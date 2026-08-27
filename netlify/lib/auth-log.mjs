const SENSITIVE_KEY = /access_token|refresh_token|password|cookie|authorization|atm_access|atm_refresh|nf_jwt|secret/i;
const JWT_RE = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

function isSensitiveValue(value) {
  const text = String(value == null ? '' : value);
  if (!text) return false;
  if (SENSITIVE_KEY.test(text)) return true;
  if (JWT_RE.test(text)) return true;
  return false;
}

export function logAuthEvent(endpoint, details = {}) {
  const safe = {
    endpoint,
    provider: 'supabase',
    timestamp: new Date().toISOString()
  };

  for (const [key, value] of Object.entries(details)) {
    if (key === 'level') continue;
    if (SENSITIVE_KEY.test(key) || isSensitiveValue(value)) continue;
    safe[key] = value;
  }

  const line = `[${endpoint}] ${JSON.stringify(safe)}`;
  const level = details.level || (details.ok === false ? 'warn' : 'info');
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
