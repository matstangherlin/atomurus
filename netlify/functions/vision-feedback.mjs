import { requireFeature } from '../lib/require-feature.mjs';
import { json, jsonWithCookies, options, readJsonBody, statusFromError } from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { normalizeElement } from '../lib/vision-identify.mjs';

function cookieResponse(auth, status, payload) {
  return jsonWithCookies(status, payload, auth.session?.cookieHeaders || []);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

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
