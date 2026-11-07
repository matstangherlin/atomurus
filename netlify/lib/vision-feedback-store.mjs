/* Shared, anonymous learning signal for vision-identify: precision per element
   and the latest corrections. Read with the service role (the view exposes no
   user id and no photo). Fails soft: without stats the model just runs cold. */

function serviceConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}

async function rest(cfg, path, init = {}) {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
      ...(init.headers || {})
    }
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

const DEVICE_RE = /^[a-z0-9-]{8,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* App scans (no account): one row per analysed photo, keyed by device. Written
   with the service role; returns the scan id, or null when storage is off. */
export async function insertAppScan({ device, lang, model, summary, detections, imageBytes }) {
  const cfg = serviceConfig();
  if (!cfg || !DEVICE_RE.test(String(device || ''))) return null;
  try {
    const rows = await rest(cfg, 'vision_scans', {
      method: 'POST',
      body: JSON.stringify({ user_id: null, device_id: device, lang, model, summary, detections, image_bytes: imageBytes })
    });
    return rows[0] && UUID_RE.test(String(rows[0].id)) ? rows[0].id : null;
  } catch (_err) {
    return null;
  }
}

export async function readAppScan(device, scanId) {
  const cfg = serviceConfig();
  if (!cfg || !DEVICE_RE.test(String(device || '')) || !UUID_RE.test(String(scanId || ''))) return null;
  try {
    const rows = await rest(cfg, `vision_scans?select=id,detections&id=eq.${scanId}&device_id=eq.${encodeURIComponent(device)}&user_id=is.null&limit=1`);
    return rows[0] || null;
  } catch (_err) {
    return null;
  }
}

/* One verdict per (scan, detection, device); a repeated verdict replaces the
   previous one so the shared statistics count each judgement once. */
export async function upsertAppFeedback({ device, scanId, index, element, label, correct, correctedElement, note }) {
  const cfg = serviceConfig();
  if (!cfg || !DEVICE_RE.test(String(device || '')) || !UUID_RE.test(String(scanId || ''))) return null;
  const row = { user_id: null, device_id: device, scan_id: scanId, detection_index: index, element, label, correct, corrected_element: correctedElement, note };
  try {
    const where = `scan_id=eq.${scanId}&detection_index=eq.${index}&device_id=eq.${encodeURIComponent(device)}&user_id=is.null`;
    const existing = await rest(cfg, `vision_feedback?select=id&${where}&limit=1`);
    const rows = existing[0]
      ? await rest(cfg, `vision_feedback?${where}`, { method: 'PATCH', body: JSON.stringify({ correct, corrected_element: correctedElement, note }) })
      : await rest(cfg, 'vision_feedback', { method: 'POST', body: JSON.stringify(row) });
    return rows[0] || null;
  } catch (_err) {
    return null;
  }
}

export async function readSharedFeedback() {
  const cfg = serviceConfig();
  if (!cfg) return { stats: [], corrections: [] };
  try {
    const [statRows, corrections] = await Promise.all([
      rest(cfg, 'vision_feedback_stats?select=element,right_count,wrong_count'),
      rest(cfg, 'vision_feedback?select=element,label,corrected_element&correct=eq.false&order=created_at.desc&limit=24')
    ]);
    const stats = [];
    for (const r of statRows) {
      for (let i = 0; i < Number(r.right_count || 0); i += 1) stats.push({ element: r.element, correct: true });
      for (let i = 0; i < Number(r.wrong_count || 0); i += 1) stats.push({ element: r.element, correct: false });
    }
    return { stats, corrections };
  } catch (_err) {
    return { stats: [], corrections: [] };
  }
}
