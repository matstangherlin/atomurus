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
  cardSelect,
  normalizeCardText,
  publicStudyCard,
  quotaExceeded,
  requireUuid,
  STUDY_SET_LIMITS
} from '../lib/study-sets.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'flashcards');
  if (auth.response) return auth.response;

  try {
    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);
    const userId = auth.user.id;

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = requireUuid(url.searchParams.get('id'));
      const removed = await db.remove(
        'study_cards',
        `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${cardSelect()}`
      );
      if (!removed.length) throw studyError('Card not found', 404, 'not_found');
      return cookieResponse(auth, 200, { ok: true, deleted: true, id });
    }

    const body = await readJsonBody(request, STUDY_SET_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    if (request.method === 'POST') {
      const setId = requireUuid(body.setId || body.set_id || body.studySetId, 'setId');
      const { rows } = await db.select(
        'study_sets',
        `select=id&id=eq.${encodeURIComponent(setId)}&user_id=eq.${userId}&limit=1`
      );
      if (!rows[0]) throw studyError('Study set not found', 404, 'not_found');

      const count = await db.count('study_cards', `user_id=eq.${userId}`);
      if (count >= STUDY_SET_LIMITS.maxCards) throw quotaExceeded('Flashcard');

      const saved = await db.insert('study_cards', {
        user_id: userId,
        study_set_id: setId,
        source_item_id: null,
        front: normalizeCardText(body.front, 'front', STUDY_SET_LIMITS.front),
        back: normalizeCardText(body.back, 'back', STUDY_SET_LIMITS.back),
        card_type: 'manual',
        template_key: 'manual'
      });
      return cookieResponse(auth, 200, { ok: true, card: publicStudyCard(saved) });
    }

    const id = requireUuid(body.id || body.cardId, 'id');
    const patch = {};
    if (Object.prototype.hasOwnProperty.call(body, 'front')) {
      patch.front = normalizeCardText(body.front, 'front', STUDY_SET_LIMITS.front);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'back')) {
      patch.back = normalizeCardText(body.back, 'back', STUDY_SET_LIMITS.back);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'suspended')) {
      patch.suspended = Boolean(body.suspended);
    }
    if (!Object.keys(patch).length) throw studyError('No fields to update', 400);

    const saved = await db.patch(
      'study_cards',
      `id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}&select=${cardSelect()}`,
      patch
    );
    if (!saved) throw studyError('Card not found', 404, 'not_found');
    return cookieResponse(auth, 200, { ok: true, card: publicStudyCard(saved) });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Flashcards are unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
