import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { publicStudySet, setSelect, STUDY_SET_LIMITS } from '../lib/study-sets.mjs';
import { MASTERED_INTERVAL_DAYS } from '../lib/review-scheduler.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'smartReview');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const now = encodeURIComponent(new Date().toISOString());
    const weekAgo = encodeURIComponent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const [sets, dueNow, newCards, totalCards, masteredCards, reviewsLast7Days, dueRows] = await Promise.all([
      db.select(
        'study_sets',
        `select=${setSelect()}&user_id=eq.${userId}&order=updated_at.desc,id.desc&limit=${STUDY_SET_LIMITS.maxSets}`
      ),
      db.count('study_cards', `user_id=eq.${userId}&suspended=eq.false&due_at=lte.${now}`),
      db.count('study_cards', `user_id=eq.${userId}&suspended=eq.false&review_state=eq.new`),
      db.count('study_cards', `user_id=eq.${userId}`),
      db.count(
        'study_cards',
        `user_id=eq.${userId}&suspended=eq.false&interval_days=gte.${MASTERED_INTERVAL_DAYS}`
      ),
      db.count('study_review_events', `user_id=eq.${userId}&reviewed_at=gte.${weekAgo}`),
      db.select(
        'study_cards',
        `select=study_set_id&user_id=eq.${userId}&suspended=eq.false&due_at=lte.${now}&limit=${STUDY_SET_LIMITS.maxCards}`
      )
    ]);

    const dueBySet = new Map();
    for (const row of dueRows.rows) {
      dueBySet.set(row.study_set_id, (dueBySet.get(row.study_set_id) || 0) + 1);
    }

    return cookieResponse(auth, 200, {
      ok: true,
      dueNow,
      newCards,
      totalCards,
      masteredCards,
      reviewsLast7Days,
      sets: sets.rows.map((row) => publicStudySet(row, {
        dueCount: dueBySet.get(row.id) || 0
      }))
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Smart Review is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
