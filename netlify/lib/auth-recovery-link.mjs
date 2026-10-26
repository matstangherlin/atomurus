// Pure classifier for Supabase auth callback URLs.
// The inline script in index.html / index.pt.html follows the same decisions.

const ACTIONS = new Set(['none', 'reset', 'expired', 'login-token']);

function paramsFrom(value) {
  const raw = String(value || '');
  const body = raw.startsWith('#') || raw.startsWith('?') ? raw.slice(1) : raw;
  try {
    return new URLSearchParams(body);
  } catch (_err) {
    return new URLSearchParams();
  }
}

function pick(hashParams, searchParams, name) {
  return hashParams.get(name) || searchParams.get(name) || '';
}

export function classifyAuthCallback({ hash = '', search = '' } = {}) {
  const hashText = String(hash || '');
  const searchText = String(search || '');
  const hashParams = paramsFrom(hashText);
  const searchParams = paramsFrom(searchText);
  const type = pick(hashParams, searchParams, 'type').toLowerCase();
  const errorCode = pick(hashParams, searchParams, 'error_code').toLowerCase();
  const accessToken = pick(hashParams, searchParams, 'access_token');
  const refreshToken = pick(hashParams, searchParams, 'refresh_token');

  if (errorCode === 'otp_expired') return { action: 'expired' };
  if (accessToken && refreshToken && type === 'recovery') return { action: 'reset' };
  if (/^#(confirmation_token|recovery_token)=/.test(hashText)) return { action: 'login-token' };
  if (/[?&]token_hash=/.test(searchText.startsWith('?') ? searchText : `?${searchText}`)) {
    return { action: 'login-token' };
  }
  return { action: 'none' };
}

export function authCallbackTarget(action, { portuguese = false } = {}) {
  if (!ACTIONS.has(action) || action === 'none') return '';
  const lang = portuguese ? '?lang=pt-BR' : '';
  if (action === 'reset') return `/reset-password${lang}`;
  return `/login${lang}`;
}
