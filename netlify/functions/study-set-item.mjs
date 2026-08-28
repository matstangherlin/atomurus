import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId, itemSelect, publicStudyItem, studyError } from '../lib/study-cloud.mjs';
import { publicSetItem, requireUuid, STUDY_SET_LIMITS } from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'PUT' && request.method !== 'DELETE') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'studySets');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);
    const userId = auth.user.id;

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const setId = requireUuid(url.searchParams.get('setId') || url.searchParams.get('set_id'), 'setId');
      const itemId = requireUuid(url.searchParams.get('itemId') || url.searchParams.get('item_id'), 'itemId');
      const removed = await db.remove(
        'study_set_items',
        `user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(setId)}&item_id=eq.${encodeURIComponent(itemId)}&select=id,item_id,created_at`
      );
      if (!removed.length) throw studyError('Library item was not in this set', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, deleted: true });
    }

    const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const setId = requireUuid(body.setId || body.set_id || body.studySetId, 'setId');
    const itemId = requireUuid(body.itemId || body.item_id, 'itemId');

    const [sets, items, existing] = await Promise.all([
      db.select('study_sets', `select=id,title&id=eq.${encodeURIComponent(setId)}&user_id=eq.${userId}&limit=1`),
      db.select('study_items', `select=${itemSelect()}&id=eq.${encodeURIComponent(itemId)}&user_id=eq.${userId}&limit=1`),
      db.select(
        'study_set_items',
        `select=id,item_id,created_at&user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(setId)}&item_id=eq.${encodeURIComponent(itemId)}&limit=1`
      )
    ]);
    if (!sets.rows[0]) throw studyError('Study set not found', 404, 'not_found');
    if (!items.rows[0]) throw studyError('Saved item not found', 404, 'not_found');

    let link = existing.rows[0];
    if (!link) {
      try {
        link = await db.insert('study_set_items', {
          user_id: userId,
          study_set_id: setId,
          item_id: itemId
        });
      } catch (err) {
        if (String(err.code) !== '23505') throw err;
        const again = await db.select(
          'study_set_items',
          `select=id,item_id,created_at&user_id=eq.${userId}&study_set_id=eq.${encodeURIComponent(setId)}&item_id=eq.${encodeURIComponent(itemId)}&limit=1`
        );
        link = again.rows[0];
      }
    }

    return cookieResponse(auth, 200, {
      ok: true,
      setId,
      setTitle: sets.rows[0].title,
      item: publicSetItem(link, publicStudyItem(items.rows[0]))
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Study Sets are unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
