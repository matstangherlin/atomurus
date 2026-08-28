import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { studyError } from '../lib/study-cloud.mjs';
import { cardSelect, isUuid, publicStudySet, setSelect, STUDY_SET_LIMITS } from '../lib/study-sets.mjs';
import {
  INSIGHTS_CARD_CAP,
  INSIGHTS_EVENT_CAP,
  buildInsightsPayload,
  parseInsightsRange,
  parseInsightsTimezone,
  rangeWindow
} from '../lib/study-insights.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

async function requireOwnedSet(db, userId, setId) {
  const { rows } = await db.select(
    'study_sets',
    `select=id,title&id=eq.${encodeURIComponent(setId)}&user_id=eq.${userId}&limit=1`
  );
  if (!rows.length) throw studyError('Study Set not found', 404, 'not_found');
  return rows[0];
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'studyInsights');
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const range = parseInsightsRange(url.searchParams.get('range'));
    const timeZone = parseInsightsTimezone(url.searchParams.get('tz') || url.searchParams.get('timeZone'));
    const rawSet = String(url.searchParams.get('setId') || url.searchParams.get('set') || '').trim();
    if (rawSet && !isUuid(rawSet)) throw studyError('setId is invalid', 400, 'invalid_request');

    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const now = new Date();
    const window = rangeWindow(range, now, timeZone);
    const startIso = encodeURIComponent(window.startIso);
    const endIso = encodeURIComponent(window.endIso);

    if (rawSet) await requireOwnedSet(db, userId, rawSet);

    const cardFilters = [
      `select=${cardSelect()}`,
      `user_id=eq.${userId}`,
      `limit=${INSIGHTS_CARD_CAP}`
    ];
    if (rawSet) cardFilters.push(`study_set_id=eq.${encodeURIComponent(rawSet)}`);

    const setFilters = [
      `select=${setSelect()}`,
      `user_id=eq.${userId}`,
      `limit=${STUDY_SET_LIMITS.maxSets}`
    ];
    if (rawSet) setFilters.push(`id=eq.${encodeURIComponent(rawSet)}`);

    const [events, cards, sets] = await Promise.all([
      db.select(
        'study_review_events',
        [
          'select=id,card_id,rating,reviewed_at',
          `user_id=eq.${userId}`,
          `reviewed_at=gte.${startIso}`,
          `reviewed_at=lt.${endIso}`,
          'order=reviewed_at.asc',
          `limit=${INSIGHTS_EVENT_CAP}`
        ].join('&')
      ),
      db.select('study_cards', cardFilters.join('&')),
      db.select('study_sets', setFilters.join('&'))
    ]);

    const payload = buildInsightsPayload({
      range,
      timeZone,
      now,
      events: events.rows,
      cards: cards.rows,
      sets: sets.rows.map((row) => publicStudySet(row))
    });
    if (rawSet) payload.setId = rawSet;

    return cookieResponse(auth, 200, payload);
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Study Insights is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
