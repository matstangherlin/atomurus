const SENSITIVE_KEY = /access_token|refresh_token|password|cookie|authorization|atm_access|atm_refresh|nf_jwt|secret|token_hash|recovery_token|confirmation_token/i;
const DENIED_KEYS = new Set([
  'email',
  'username',
  'identifier',
  'password',
  'cookie',
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'accessToken',
  'refreshToken',
  'token_hash',
  'recovery_token',
  'confirmation_token'
]);
const JWT_RE = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDeniedKey(key) {
  const name = String(key || '');
  if (DENIED_KEYS.has(name) || DENIED_KEYS.has(name.toLowerCase())) return true;
  return SENSITIVE_KEY.test(name);
}

function isSensitiveValue(value) {
  const text = String(value == null ? '' : value);
  if (!text) return false;
  if (SENSITIVE_KEY.test(text)) return true;
  if (JWT_RE.test(text)) return true;
  if (EMAIL_RE.test(text)) return true;
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
    if (isDeniedKey(key) || isSensitiveValue(value)) continue;
    safe[key] = value;
  }

  const line = `[${endpoint}] ${JSON.stringify(safe)}`;
  const level = details.level || (details.ok === false ? 'warn' : 'info');
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
