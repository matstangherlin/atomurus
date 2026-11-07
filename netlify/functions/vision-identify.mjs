import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { identifyImage, parseDataUrl, precisionTable, VISION_LIMITS, VISION_MODEL } from '../lib/vision-identify.mjs';
import { insertAppScan, readSharedFeedback } from '../lib/vision-feedback-store.mjs';
import { appCors, appDevice, appQuota, isAppRequest } from '../lib/vision-app.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

export default async function handler(request) {
  const cors = appCors(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET') {
    /* The app asks whether analyses are open on this device (left: null = unlimited). */
    if (!isAppRequest(request)) return json(405, { ok: false, error: 'Method not allowed' });
    const q = appQuota(request, { peek: true });
    return json(200, { ok: true, open: q.allowed, left: q.left }, cors);
  }
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  if (isAppRequest(request)) return handleApp(request, cors);

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

/* Android app without accounts: every feature is open for now, so the camera
   runs free per device (abuse guards only, see vision-app.mjs). The scan is
   stored by device with the service role so ✓/✗ feedback keeps training the
   shared precision table. Photos are never stored. */
async function handleApp(request, cors) {
  try {
    const q = appQuota(request, { peek: false });
    if (!q.allowed) {
      return json(429, { ok: false, code: 'app_quota', left: 0, error: 'Daily analysis limit reached on this device.' }, cors);
    }
    const body = await readJsonBody(request, VISION_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const lang = String(body.lang || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
    const hint = String(body.hint || '').slice(0, 160);
    const img = parseDataUrl(body.image);
    const shared = await readSharedFeedback();
    const table = precisionTable(shared.stats);
    const result = await identifyImage({ image: img.data, mediaType: img.mediaType, lang, hint, table, corrections: shared.corrections });
    const scanId = await insertAppScan({
      device: appDevice(request), lang, model: VISION_MODEL, summary: result.summary, detections: result.detections, imageBytes: img.bytes
    });
    return json(200, {
      ok: true, scanId, left: q.left, summary: result.summary, detections: result.detections,
      learned: { elements: Object.keys(table).length, corrections: shared.corrections.length }
    }, cors);
  } catch (err) {
    const status = statusFromError(err, 500);
    return json(status, { ok: false, error: status >= 500 ? 'Vision is unavailable right now.' : err.message, code: err.code || null }, cors);
  }
}
