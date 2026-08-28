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
  decodeStudyCursor,
  encodeStudyCursor,
  cursorFilter,
  parseLimit,
  progressSelect,
  publicStudyProgress,
  STUDY_ITEM_TYPES,
  STUDY_LIMITS,
  STUDY_PROGRESS_STATUSES,
  studyError
} from '../lib/study-cloud.mjs';

function progressStatus(progress, requested) {
  if (requested && STUDY_PROGRESS_STATUSES.includes(requested)) return requested;
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'started';
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET' && request.method !== 'PUT') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'studyCloud');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const typeRaw = String(url.searchParams.get('type') || '').trim();
      const limit = parseLimit(url.searchParams.get('limit'), 20, 100);
      const cursor = decodeStudyCursor(url.searchParams.get('cursor'));
      const filters = [`user_id=eq.${userId}`];
      if (typeRaw) {
        if (!STUDY_ITEM_TYPES.includes(typeRaw)) throw studyError('type is invalid', 400);
        filters.push(`content_type=eq.${typeRaw}`);
      }
      const extra = cursorFilter(cursor);
      if (extra) filters.push(extra);
      const { rows } = await db.select(
        'study_progress',
        [`select=${progressSelect()}`, ...filters, 'order=updated_at.desc,id.desc', `limit=${limit}`].join('&')
      );
      const last = rows[rows.length - 1];
      return jsonWithCookies(200, {
        ok: true,
        items: rows.map(publicStudyProgress),
        nextCursor: rows.length === limit ? encodeStudyCursor(last) : null
      }, auth.session?.cookieHeaders || []);
    }

    const body = await readJsonBody(request, STUDY_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    await ensureOwnProfile(db, auth.user);

    const contentType = String(body.contentType || body.itemType || '').trim();
    if (!STUDY_ITEM_TYPES.includes(contentType)) throw studyError('contentType is invalid', 400);
    const contentKey = clampText(body.contentKey || body.itemKey, STUDY_LIMITS.itemKey, 'contentKey', true).trim();
    const progress = Math.min(100, Math.max(0, Math.round(Number(body.progress) || 0)));
    const status = progressStatus(progress, String(body.status || '').trim());
    const lastPosition = clampText(body.lastPosition, STUDY_LIMITS.lastPosition, 'lastPosition');

    const saved = await db.upsert('study_progress', {
      user_id: userId,
      content_type: contentType,
      content_key: contentKey,
      status,
      progress,
      last_position: lastPosition
    }, 'user_id,content_type,content_key');

    return jsonWithCookies(200, { ok: true, progress: publicStudyProgress(saved) }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Study Cloud is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
