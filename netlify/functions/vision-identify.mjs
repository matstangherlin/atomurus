import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { identifyImage, parseDataUrl, precisionTable, VISION_LIMITS, VISION_MODEL } from '../lib/vision-identify.mjs';
import { readSharedFeedback } from '../lib/vision-feedback-store.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'visionIdentify');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, VISION_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const lang = String(body.lang || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
    const hint = String(body.hint || '').slice(0, 160);
    const img = parseDataUrl(body.image);

    const shared = await readSharedFeedback();
    const table = precisionTable(shared.stats);
    const result = await identifyImage({
      image: img.data, mediaType: img.mediaType, lang, hint, table, corrections: shared.corrections
    });

    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);
    const scan = await db.insert('vision_scans', {
      user_id: auth.user.id,
      lang,
      model: VISION_MODEL,
      summary: result.summary,
      detections: result.detections,
      image_bytes: img.bytes
    });

    return cookieResponse(auth, 200, {
      ok: true,
      scanId: scan.id,
      summary: result.summary,
      detections: result.detections,
      learned: { elements: Object.keys(table).length, corrections: shared.corrections.length }
    });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Vision is unavailable right now.' : err.message,
      code: err.code || null
    });
  }
}
