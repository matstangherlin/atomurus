import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import {
  itemSelect,
  notePresentFilter,
  progressSelect,
  publicStudyItem,
  publicStudyProgress,
  STUDY_ITEM_TYPES
} from '../lib/study-cloud.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'studyCloud');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;

    const [library, calculators, continueStudying, counts] = await Promise.all([
      db.select(
        'study_items',
        `select=${itemSelect()}&item_type=neq.calculator&user_id=eq.${userId}&order=updated_at.desc,id.desc&limit=8`
      ),
      db.select(
        'study_items',
        `select=${itemSelect()}&item_type=eq.calculator&user_id=eq.${userId}&order=updated_at.desc,id.desc&limit=8`
      ),
      db.select(
        'study_progress',
        `select=${progressSelect()}&user_id=eq.${userId}&progress=lt.100&order=updated_at.desc,id.desc&limit=8`
      ),
      countByType(db, userId)
    ]);

    return cookieResponse(auth, 200, {
      ok: true,
      counts,
      recentItems: library.rows.map(publicStudyItem),
      recentCalculatorRuns: calculators.rows.map(publicStudyItem),
      continueStudying: continueStudying.rows.map(publicStudyProgress)
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Study Cloud is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}

async function countByType(db, userId) {
  const counts = {
    items: 0,
    element: 0,
    molecule: 0,
    calculator: 0,
    article: 0,
    notes: 0,
    inProgress: 0
  };
  const results = await Promise.all([
    ...STUDY_ITEM_TYPES.map(async (type) => {
      counts[type] = await db.count('study_items', `user_id=eq.${userId}&item_type=eq.${type}`);
    }),
    db.count('study_items', `user_id=eq.${userId}&${notePresentFilter()}`).then((value) => {
      counts.notes = value;
    }),
    db.count('study_progress', `user_id=eq.${userId}&progress=lt.100`).then((value) => {
      counts.inProgress = value;
    })
  ]);
  void results;
  counts.items = (counts.element || 0) + (counts.molecule || 0) + (counts.article || 0) + (counts.calculator || 0);
  return counts;
}
