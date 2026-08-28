import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import {
  cursorFilter,
  decodeStudyCursor,
  encodeStudyCursor,
  itemSelect,
  normalizeItemType,
  notePresentFilter,
  parseLimit,
  publicStudyItem,
  tagContainsFilter
} from '../lib/study-cloud.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'studyCloud');
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const typeRaw = String(url.searchParams.get('type') || '').trim();
    const tag = String(url.searchParams.get('tag') || '').trim();
    const hasNote = String(url.searchParams.get('hasNote') || '') === '1';
    const limit = parseLimit(url.searchParams.get('limit'), 20, 100);
    const cursor = decodeStudyCursor(url.searchParams.get('cursor'));
    const userId = auth.user.id;
    const db = createUserDataClient(auth.session.accessToken);

    const filters = [`user_id=eq.${userId}`];
    if (typeRaw) filters.push(`item_type=eq.${normalizeItemType(typeRaw)}`);
    if (tag) filters.push(tagContainsFilter(tag));
    if (hasNote) filters.push(notePresentFilter());
    const extra = cursorFilter(cursor);
    if (extra) filters.push(extra);

    const query = [
      `select=${itemSelect()}`,
      ...filters,
      'order=updated_at.desc,id.desc',
      `limit=${limit}`
    ].join('&');

    const { rows } = await db.select('study_items', query);
    const last = rows[rows.length - 1];
    return jsonWithCookies(200, {
      ok: true,
      items: rows.map(publicStudyItem),
      nextCursor: rows.length === limit ? encodeStudyCursor(last) : null
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
