import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId, studyError } from '../lib/study-cloud.mjs';
import { generateCanonicalCards } from '../lib/canonical-catalog.mjs';
import {
  publicStudyCard,
  quotaExceeded,
  requireUuid,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'flashcards');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);
    const userId = auth.user.id;
    const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const setId = requireUuid(body.setId || body.set_id || body.studySetId, 'setId');
    const { rows: sets } = await db.select(
      'study_sets',
      `select=id,title&id=eq.${encodeURIComponent(setId)}&user_id=eq.${userId}&limit=1`
    );
    if (!sets[0]) throw studyError('Study set not found', 404, 'not_found');

    let itemIds = [];
    if (body.itemId || body.item_id) {
      itemIds = [requireUuid(body.itemId || body.item_id, 'itemId')];
    } else if (Array.isArray(body.itemIds) && body.itemIds.length) {
      itemIds = body.itemIds.slice(0, 100).map((id) => requireUuid(id, 'itemId'));
    } else {
      const links = await db.select(
        'study_set_items',
        `select=item_id&user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(setId)}&limit=100`
      );
      itemIds = links.rows.map((row) => row.item_id);
    }

    if (!itemIds.length) {
      return cookieResponse(auth, 200, {
        ok: true,
        created: 0,
        skipped: 0,
        unsupported: 0,
        cards: []
      });
    }

    const { rows: items } = await db.select(
      'study_items',
      `select=id,item_type,item_key&user_id=eq.${userId}&id=in.(${itemIds.join(',')})`
    );
    const itemById = new Map(items.map((item) => [item.id, item]));

    const existing = await db.select(
      'study_cards',
      `select=source_item_id,template_key&user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(setId)}&source_item_id=in.(${itemIds.join(',')})&limit=1000`
    );
    const seen = new Set(
      existing.rows.map((row) => `${row.source_item_id}:${row.template_key}`)
    );

    let remaining = STUDY_SET_LIMITS.maxCards - await db.count('study_cards', `user_id=eq.${userId}`);
    if (remaining <= 0) throw quotaExceeded('Flashcard');

    const created = [];
    let skipped = 0;
    let unsupported = 0;

    for (const itemId of itemIds) {
      const item = itemById.get(itemId);
      if (!item) continue;
      const drafts = generateCanonicalCards(item.item_type, item.item_key);
      if (!drafts.length) {
        unsupported += 1;
        continue;
      }
      for (const draft of drafts) {
        const key = `${item.id}:${draft.templateKey}`;
        if (seen.has(key)) {
          skipped += 1;
          continue;
        }
        if (remaining <= 0) throw quotaExceeded('Flashcard');
        try {
          const saved = await db.insert('study_cards', {
            user_id: userId,
            study_set_id: setId,
            source_item_id: item.id,
            front: draft.front,
            back: draft.back,
            card_type: 'generated',
            template_key: draft.templateKey
          });
          created.push(publicStudyCard(saved));
          seen.add(key);
          remaining -= 1;
        } catch (err) {
          if (String(err.code) === '23505') {
            skipped += 1;
            seen.add(key);
            continue;
          }
          throw err;
        }
      }
    }

    return cookieResponse(auth, 200, {
      ok: true,
      setId,
      created: created.length,
      skipped,
      unsupported,
      cards: created
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Flashcards are unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
