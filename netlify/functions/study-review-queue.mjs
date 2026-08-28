import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { studyError } from '../lib/study-cloud.mjs';
import {
  cardSelect,
  isUuid,
  parseQueueLimit,
  publicStudyCard,
  sortQueue
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'smartReview');
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const rawSet = String(url.searchParams.get('setId') || url.searchParams.get('set') || '').trim();
    if (rawSet && !isUuid(rawSet)) throw studyError('setId is invalid', 400, 'invalid_request');
    const limit = parseQueueLimit(url.searchParams.get('limit'));
    const db = createUserDataClient(auth.session.accessToken);
    const userId = auth.user.id;
    const now = new Date();
    const nowIso = encodeURIComponent(now.toISOString());

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
