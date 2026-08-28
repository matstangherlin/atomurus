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
  clampText,
  itemSelect,
  normalizeItemType,
  normalizePayload,
  normalizeTags,
  publicStudyItem,
  safeStudyHref,
  STUDY_LIMITS,
  studyError
} from '../lib/study-cloud.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'PUT' && request.method !== 'DELETE') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'studyCloud');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = String(url.searchParams.get('id') || '').trim();
      if (!id) throw studyError('id is required', 400);
      const removed = await db.remove(
        'study_items',
        `id=eq.${encodeURIComponent(id)}&user_id=eq.${auth.user.id}&select=${itemSelect()}`
      );
      if (!removed.length) throw studyError('Item not found', 404, 'not_found');
      return jsonWithCookies(200, { ok: true, deleted: true, id }, auth.session?.cookieHeaders || []);
    }

    const body = await readJsonBody(request, STUDY_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const itemType = normalizeItemType(body.itemType || body.item_type);
    const itemKey = clampText(body.itemKey || body.item_key, STUDY_LIMITS.itemKey, 'itemKey', true).trim();
    const title = clampText(body.title, STUDY_LIMITS.title, 'title');
    const href = safeStudyHref(body.href || body.origin);
    const note = clampText(body.note, STUDY_LIMITS.note, 'note');
    const tags = normalizeTags(body.tags);
    const payload = normalizePayload(body.payload);

    const row = {
      user_id: auth.user.id,
      item_type: itemType,
      item_key: itemKey,
      title,
      href,
      note,
      tags,
      payload
    };

    const saved = await db.upsert('study_items', row, 'user_id,item_type,item_key');
    return jsonWithCookies(200, {
      ok: true,
      item: publicStudyItem(saved)
    }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Study Cloud is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
