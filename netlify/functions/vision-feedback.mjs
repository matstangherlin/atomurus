import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { normalizeElement } from '../lib/vision-identify.mjs';
import { readAppScan, upsertAppFeedback } from '../lib/vision-feedback-store.mjs';
import { appCors, appDevice, isAppRequest } from '../lib/vision-app.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(request) {
  const cors = appCors(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  if (isAppRequest(request)) return handleApp(request, cors);

  const auth = await requireFeature(request, 'visionIdentify');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, 4096);
    assertNoClientUserId(body);
    const scanId = String(body.scanId || '');
    const index = Number(body.detectionIndex);
    if (!UUID.test(scanId) || !Number.isInteger(index) || index < 0 || index > 31) {
      throw Object.assign(new Error('Invalid feedback'), { status: 400, code: 'vision_bad_feedback' });
    }
    const correct = body.correct === true;
    const db = createUserDataClient(auth.session.accessToken);
    const { rows } = await db.select('vision_scans', `select=id,detections&id=eq.${scanId}&user_id=eq.${auth.user.id}&limit=1`);
    const scan = rows && rows[0];
    const det = scan && Array.isArray(scan.detections) ? scan.detections[index] : null;
    if (!det) throw Object.assign(new Error('Scan not found'), { status: 404, code: 'vision_scan_not_found' });

    const row = await db.upsert('vision_feedback', {
      user_id: auth.user.id,
      scan_id: scanId,
      detection_index: index,
      element: normalizeElement(det.element),
      label: String(det.label || '').slice(0, 80),
      correct,
      corrected_element: correct ? '' : normalizeElement(body.correctedElement),
      note: String(body.note || '').slice(0, 240)
    }, 'scan_id,detection_index,user_id');

    return cookieResponse(auth, 200, { ok: true, feedback: { id: row.id, correct, correctedElement: row.corrected_element } });
  } catch (err) {
    const status = statusFromError(err, 500);
    return cookieResponse(auth, status, {
      ok: false,
      error: status >= 500 ? 'Could not save your feedback right now.' : err.message,
      code: err.code || null
    });
  }
}

function parseFeedback(body) {
  const scanId = String(body.scanId || '');
  const index = Number(body.detectionIndex);
  if (!UUID.test(scanId) || !Number.isInteger(index) || index < 0 || index > 31) {
    throw Object.assign(new Error('Invalid feedback'), { status: 400, code: 'vision_bad_feedback' });
  }
  return { scanId, index, correct: body.correct === true };
}

/* Android app (no account): the verdict is stored by device with the service
   role, so app users train the shared precision table like Pro users do. */
async function handleApp(request, cors) {
  try {
    const body = await readJsonBody(request, 4096);
    assertNoClientUserId(body);
    const { scanId, index, correct } = parseFeedback(body);
    const device = appDevice(request);
    const scan = await readAppScan(device, scanId);
    const det = scan && Array.isArray(scan.detections) ? scan.detections[index] : null;
    if (!det) throw Object.assign(new Error('Scan not found'), { status: 404, code: 'vision_scan_not_found' });
    const row = await upsertAppFeedback({
      device, scanId, index,
      element: normalizeElement(det.element),
      label: String(det.label || '').slice(0, 80),
      correct,
      correctedElement: correct ? '' : normalizeElement(body.correctedElement),
      note: String(body.note || '').slice(0, 240)
    });
    if (!row) throw Object.assign(new Error('Could not save your feedback right now.'), { status: 503, code: 'vision_feedback_unavailable' });
    return json(200, { ok: true, feedback: { id: row.id, correct, correctedElement: row.corrected_element } }, cors);
  } catch (err) {
    const status = statusFromError(err, 500);
    return json(status, { ok: false, error: status >= 500 ? 'Could not save your feedback right now.' : err.message, code: err.code || null }, cors);
  }
}
