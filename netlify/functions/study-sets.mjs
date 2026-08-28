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
import { isMastered } from '../lib/review-scheduler.mjs';
import {
  normalizeDescription,
  normalizeTitle,
  publicStudySet,
  quotaExceeded,
  setSelect,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'studySets');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;

    if (request.method === 'GET') {
      const now = Date.now();
      const [{ rows }, cards] = await Promise.all([
        db.select(
          'study_sets',
          `select=${setSelect()}&user_id=eq.${userId}&order=updated_at.desc,id.desc&limit=${STUDY_SET_LIMITS.maxSets}`
        ),
        db.select(
          'study_cards',
          `select=study_set_id,interval_days,due_at,suspended,review_state&user_id=eq.${userId}&limit=${STUDY_SET_LIMITS.maxCards}`
        )
      ]);
      const stats = new Map();
      for (const row of cards.rows || []) {
        const current = stats.get(row.study_set_id) || {
          cardCount: 0,
          dueCount: 0,
          masteredCount: 0,
          activeCount: 0,
          learningCount: 0,
          newCount: 0
        };
        current.cardCount += 1;
        if (!row.suspended) {
          current.activeCount += 1;
          if (Date.parse(row.due_at) <= now) current.dueCount += 1;
          if (isMastered(row.interval_days)) current.masteredCount += 1;
          const state = String(row.review_state || '').toLowerCase();
          if (state === 'learning') current.learningCount += 1;
          if (state === 'new') current.newCount += 1;
        }
        stats.set(row.study_set_id, current);
      }
      return cookieResponse(auth, 200, {
        ok: true,
        sets: rows.map((row) => publicStudySet(row, stats.get(row.id) || {
          cardCount: 0,
          dueCount: 0,
          masteredCount: 0,
          activeCount: 0,
          learningCount: 0,
          newCount: 0
        }))
      });
    }

    await ensureOwnProfile(db, auth.user);
    const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const count = await db.count('study_sets', `user_id=eq.${userId}`);
    if (count >= STUDY_SET_LIMITS.maxSets) throw quotaExceeded('Study set');

    const saved = await db.insert('study_sets', {
      user_id: userId,
      title: normalizeTitle(body.title),
      description: normalizeDescription(body.description)
    });

    return cookieResponse(auth, 200, {
      ok: true,
      set: publicStudySet(saved)
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
