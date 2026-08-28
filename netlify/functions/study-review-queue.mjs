import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { studyError } from '../lib/study-cloud.mjs';
import {
  cardSelect,
  isUuid,
  parseFocusLimit,
  parseQueueLimit,
  parseQueueMode,
  publicStudyCard,
  sortQueue,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';
import { compareWeakCards, needsAttention } from '../lib/study-insights.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

async function requireOwnedSet(db, userId, setId) {
  const { rows } = await db.select(
    'study_sets',
    `select=id&id=eq.${encodeURIComponent(setId)}&user_id=eq.${userId}&limit=1`
  );
  if (!rows.length) throw studyError('Study Set not found', 404, 'not_found');
  return rows[0];
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const url = new URL(request.url);
  const rawMode = url.searchParams.get('mode');
  const wantsFocus = String(rawMode || '').trim().toLowerCase() === 'weak';
  const auth = await requireFeature(request, wantsFocus ? 'focusReview' : 'smartReview');
  if (auth.response) return auth.response;

  try {
    const mode = parseQueueMode(rawMode);
    const rawSet = String(url.searchParams.get('setId') || url.searchParams.get('set') || '').trim();
    if (rawSet && !isUuid(rawSet)) throw studyError('setId is invalid', 400, 'invalid_request');
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const now = new Date();
    const nowIso = encodeURIComponent(now.toISOString());

    if (rawSet) await requireOwnedSet(db, userId, rawSet);

    if (mode === 'weak') {
      const limit = parseFocusLimit(url.searchParams.get('limit'));
      const filters = [
        `select=${cardSelect()}`,
        `user_id=eq.${userId}`,
        'suspended=eq.false',
        'order=lapses.desc,ease_factor.asc,due_at.asc,id.asc',
        `limit=${STUDY_SET_LIMITS.focusFetchCap}`
      ];
      if (rawSet) filters.push(`study_set_id=eq.${encodeURIComponent(rawSet)}`);
      const { rows } = await db.select('study_cards', filters.join('&'));
      const cards = rows
        .filter((row) => needsAttention(row, now.getTime()))
        .sort(compareWeakCards)
        .slice(0, limit)
        .map((row) => publicStudyCard(row));
      return cookieResponse(auth, 200, {
        ok: true,
        mode: 'weak',
        setId: rawSet || null,
        now: now.toISOString(),
        limit,
        cards
      });
    }

    const limit = parseQueueLimit(url.searchParams.get('limit'));
    const filters = [
      `select=${cardSelect()}`,
      `user_id=eq.${userId}`,
      'suspended=eq.false',
      `due_at=lte.${nowIso}`
    ];
    if (rawSet) filters.push(`study_set_id=eq.${encodeURIComponent(rawSet)}`);
    const { rows } = await db.select(
      'study_cards',
      [...filters, 'order=due_at.asc,id.asc', `limit=${limit}`].join('&')
    );
    const cards = sortQueue(rows, now.getTime()).slice(0, limit).map((row) => publicStudyCard(row));
    return cookieResponse(auth, 200, {
      ok: true,
      mode: 'due',
      setId: rawSet || null,
      now: now.toISOString(),
      cards
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
