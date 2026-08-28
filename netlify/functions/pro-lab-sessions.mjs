import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import {
  normalizeSessionTitle,
  normalizeSessionType,
  PRO_LAB_LIMITS,
  publicLabSession,
  publicLabSessionSummary,
  quotaExceeded,
  sessionSelect,
  validateSessionState
} from '../lib/pro-lab.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'savedLabSessions');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;

    if (request.method === 'GET') {
      const { rows } = await db.select(
        'pro_lab_sessions',
        `select=${sessionSelect()}&user_id=eq.${userId}&order=updated_at.desc,id.desc&limit=${PRO_LAB_LIMITS.maxSessions}`
      );
      return cookieResponse(auth, 200, {
        ok: true,
        sessions: (rows || []).map(publicLabSessionSummary),
        quota: { used: (rows || []).length, max: PRO_LAB_LIMITS.maxSessions }
      });
    }

    await ensureOwnProfile(db, auth.user);
    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const count = await db.count('pro_lab_sessions', `user_id=eq.${userId}`);
    if (count >= PRO_LAB_LIMITS.maxSessions) throw quotaExceeded();

    const sessionType = normalizeSessionType(body.sessionType || body.session_type);
    const saved = await db.insert('pro_lab_sessions', {
      user_id: userId,
      session_type: sessionType,
      title: normalizeSessionTitle(body.title),
      state: validateSessionState(sessionType, body.state || {})
    });

    return cookieResponse(auth, 200, {
      ok: true,
      session: publicLabSession(saved)
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Pro Lab is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
