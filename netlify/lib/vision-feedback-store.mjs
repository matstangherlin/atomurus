/* Shared, anonymous learning signal for vision-identify: precision per element
   and the latest corrections. Read with the service role (the view exposes no
   user id and no photo). Fails soft: without stats the model just runs cold. */

function serviceConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? { url, key } : null;
}

async function rest(cfg, path) {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Accept: 'application/json' }
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
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
