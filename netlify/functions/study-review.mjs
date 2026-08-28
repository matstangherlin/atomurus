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
import { scheduleReview } from '../lib/review-scheduler.mjs';
import {
  cardSelect,
  mapReviewStoreError,
  publicStudyCard,
  requireUuid,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'smartReview');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);
    const userId = auth.user.id;
    const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const cardId = requireUuid(body.cardId || body.card_id, 'cardId');
    const clientEventId = requireUuid(body.clientEventId || body.client_event_id, 'clientEventId');
    const expectedVersion = Number(body.expectedVersion ?? body.expected_version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw studyError('expectedVersion is invalid', 400, 'invalid_request');
    }

    const rating = String(body.rating || '').trim().toLowerCase();
    const now = new Date();

    const { rows } = await db.select(
      'study_cards',
      `select=${cardSelect()}&id=eq.${encodeURIComponent(cardId)}&user_id=eq.${userId}&limit=1`
    );
    const card = rows[0];
    if (!card) throw studyError('Card not found', 404, 'not_found');
    if (card.suspended) throw studyError('Card is suspended', 409, 'card_suspended');

    const next = scheduleReview(card, rating, now);

    let result;
    try {
      result = await db.rpc('apply_study_review', {
        p_card_id: cardId,
        p_client_event_id: clientEventId,
        p_rating: rating,
        p_expected_version: expectedVersion,
        p_due_at: next.dueAt,
        p_interval_days: next.intervalDays,
        p_ease_factor: next.easeFactor,
        p_repetitions: next.repetitions,
        p_lapses: next.lapses,
        p_review_state: next.reviewState,
        p_previous_interval: Number(card.interval_days) || 0,
        p_previous_ease: Number(card.ease_factor),
        p_reviewed_at: now.toISOString()
      });
    } catch (err) {
      mapReviewStoreError(err);
      if (err.code === 'review_conflict') {
        const latest = await db.select(
          'study_cards',
          `select=${cardSelect()}&id=eq.${encodeURIComponent(cardId)}&user_id=eq.${userId}&limit=1`
        );
        return cookieResponse(auth, 409, {
          ok: false,
          code: 'review_conflict',
          error: err.message,
          card: publicStudyCard(latest.rows[0] || card)
        });
      }
      throw err;
    }

    const saved = result?.card || result;
    return cookieResponse(auth, 200, {
      ok: true,
      idempotent: Boolean(result?.idempotent),
      eventId: result?.eventId || result?.event_id || null,
      card: publicStudyCard(saved),
      schedule: next
    });
  } catch (err) {
    mapReviewStoreError(err);
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Smart Review is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
