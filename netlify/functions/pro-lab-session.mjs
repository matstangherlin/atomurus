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
import {
  normalizeSessionTitle,
  normalizeSessionType,
  PRO_LAB_LIMITS,
  publicLabSession,
  requireSessionId,
  sessionSelect,
  validateSessionState
} from '../lib/pro-lab.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'savedLabSessions');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const id = requireSessionId(url.searchParams.get('id'));
      const { rows } = await db.select(
        'pro_lab_sessions',
        `select=${sessionSelect()}&id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&limit=1`
      );
      const row = rows[0];
      if (!row) throw studyError('Lab session not found', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, session: publicLabSession(row) });
    }

    if (request.method === 'DELETE') {
      const id = requireSessionId(url.searchParams.get('id'));
      const removed = await db.remove(
        'pro_lab_sessions',
        `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${sessionSelect()}`
      );
      if (!removed.length) throw studyError('Lab session not found', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, deleted: true, id });
    }

    await ensureOwnProfile(db, auth.user);
    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const id = requireSessionId(body.id || url.searchParams.get('id'));
    const { rows } = await db.select(
      'pro_lab_sessions',
      `select=${sessionSelect()}&id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&limit=1`
    );
    const existing = rows[0];
    if (!existing) throw studyError('Lab session not found', 404, 'not_found');

    const patch = {};
    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      patch.title = normalizeSessionTitle(body.title);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'sessionType') || Object.prototype.hasOwnProperty.call(body, 'session_type')) {
      patch.session_type = normalizeSessionType(body.sessionType || body.session_type);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'state')) {
      const type = patch.session_type || existing.session_type;
      patch.state = validateSessionState(type, body.state || {});
    }
    if (!Object.keys(patch).length) throw studyError('No fields to update', 400);

    const saved = await db.patch(
      'pro_lab_sessions',
      `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${sessionSelect()}`,
      patch
    );
    if (!saved) throw studyError('Lab session not found', 404, 'not_found');
    return cookieResponse(auth, 200, { ok: true, session: publicLabSession(saved) });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Pro Lab is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
