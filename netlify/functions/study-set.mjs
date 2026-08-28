import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import {
  assertNoClientUserId,
  itemSelect,
  parseLimit,
  publicStudyItem,
  studyError
} from '../lib/study-cloud.mjs';
import {
  cardCursorFilter,
  cardSelect,
  decodeCardCursor,
  encodeCardCursor,
  normalizeDescription,
  normalizeTitle,
  publicSetItem,
  publicStudyCard,
  publicStudySet,
  requireUuid,
  setSelect,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'studySets');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const url = new URL(request.url);

    if (request.method === 'DELETE') {
      const id = requireUuid(url.searchParams.get('id'));
      const removed = await db.remove(
        'study_sets',
        `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${setSelect()}`
      );
      if (!removed.length) throw studyError('Study set not found', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, deleted: true, id });
    }

    if (request.method === 'PUT') {
      await ensureOwnProfile(db, auth.user);
      const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
      assertNoClientUserId(body);
      const id = requireUuid(body.id || url.searchParams.get('id'));
      const patch = {};
      if (Object.prototype.hasOwnProperty.call(body, 'title')) patch.title = normalizeTitle(body.title);
      if (Object.prototype.hasOwnProperty.call(body, 'description')) {
        patch.description = normalizeDescription(body.description);
      }
      if (Object.prototype.hasOwnProperty.call(body, 'archivedAt') || Object.prototype.hasOwnProperty.call(body, 'archived_at')) {
        const raw = body.archivedAt ?? body.archived_at;
        patch.archived_at = raw ? new Date().toISOString() : null;
      }
      if (!Object.keys(patch).length) throw studyError('No fields to update', 400);
      const saved = await db.patch(
        'study_sets',
        `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${setSelect()}`,
        patch
      );
      if (!saved) throw studyError('Study set not found', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, set: publicStudySet(saved) });
    }

    const id = requireUuid(url.searchParams.get('id'));
    const { rows } = await db.select(
      'study_sets',
      `select=${setSelect()}&id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&limit=1`
    );
    const set = rows[0];
    if (!set) throw studyError('Study set not found', 404, 'not_found');

    const limit = parseLimit(url.searchParams.get('limit'), STUDY_SET_LIMITS.cardsPage, STUDY_SET_LIMITS.cardsPageMax);
    const cursor = decodeCardCursor(url.searchParams.get('cursor'));
    const extra = cardCursorFilter(cursor);

    const [itemLinks, cardPage, cardCount, dueCount] = await Promise.all([
      db.select(
        'study_set_items',
        `select=id,item_id,created_at&user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(id)}&order=created_at.desc,id.desc&limit=100`
      ),
      db.select(
        'study_cards',
        [
          `select=${cardSelect()}`,
          `user_id=eq.${userId}`,
          `study_set_id=eq.${encodeURIComponent(id)}`,
          extra,
          'order=created_at.desc,id.desc',
          `limit=${limit}`
        ].filter(Boolean).join('&')
      ),
      db.count('study_cards', `user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(id)}`),
      db.count(
        'study_cards',
        `user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(id)}&suspended=eq.false&due_at=lte.${encodeURIComponent(new Date().toISOString())}`
      )
    ]);

    let libraryItems = [];
    const itemIds = itemLinks.rows.map((row) => row.item_id).filter(Boolean);
    if (itemIds.length) {
      const listed = await db.select(
        'study_items',
        `select=${itemSelect()}&user_id=eq.${userId}&id=in.(${itemIds.join(',')})`
      );
      libraryItems = listed.rows;
    }
    const itemById = new Map(libraryItems.map((item) => [item.id, publicStudyItem(item)]));

    const last = cardPage.rows[cardPage.rows.length - 1];
    return cookieResponse(auth, 200, {
      ok: true,
      set: publicStudySet(set, {
        cardCount,
        dueCount,
        itemCount: itemLinks.rows.length
      }),
      items: itemLinks.rows.map((row) => publicSetItem(row, itemById.get(row.item_id) || null)),
      cards: cardPage.rows.map((row) => publicStudyCard(row)),
      nextCursor: cardPage.rows.length === limit ? encodeCardCursor(last) : null
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Study Sets are unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
