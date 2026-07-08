export { accessForUser, publicUser, PLAN_PRICING, trialEndsAtForUser } from './plan-access.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function noStoreHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  };
}

export function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: noStoreHeaders()
  });
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: noStoreHeaders()
  });
}

export async function readJsonBody(request, maxBytes = 4096) {
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    const err = new Error('Request body too large');
    err.status = 413;
    throw err;
  }
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (_err) {
    const err = new Error('Invalid JSON body');
    err.status = 400;
    throw err;
  }
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

export function validEmail(email) {
  return EMAIL_RE.test(email) && email.length <= 200;
}

export function validUsername(username) {
  return /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/.test(username);
}

export function passwordPolicyError(password) {
  const value = String(password || '');
  if (value.length < 9 || value.length > 1024) {
    return 'Use a password with at least 9 characters.';
  }
  if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value)) {
    return 'Use at least one special character in your password.';
  }
  return '';
}

export function clientIp(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  );
}

function configuredOrigins() {
  return [
    process.env.AUTH_ALLOWED_ORIGINS,
    process.env.ALLOWED_ORIGIN,
    'https://atomurus.com',
    'https://www.atomurus.com'
  ]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function hostOriginAliases(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const aliases = [origin];
    if (host.startsWith('www.')) {
      aliases.push(`${url.protocol}//${host.slice(4)}`);
    } else if (!host.includes('localhost') && !host.endsWith('.netlify.app') && host.includes('.')) {
      aliases.push(`${url.protocol}//www.${host}`);
    }
    return aliases;
  } catch (_err) {
    return [origin];
  }
}

function allowedOriginSet(request) {
  const seeds = [new URL(request.url).origin, ...configuredOrigins()];
  const allowed = new Set();
  for (const origin of seeds) {
    for (const alias of hostOriginAliases(origin)) allowed.add(alias);
  }
  return allowed;
}

export function verifySameOrigin(request) {
  const allowedOrigins = allowedOriginSet(request);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) {
    if (!allowedOrigins.has(origin)) {
      const err = new Error('Forbidden origin');
      err.status = 403;
      throw err;
    }
    return;
  }

  if (referer) {
    let refererOrigin = '';
    try {
      refererOrigin = new URL(referer).origin;
    } catch (_err) {
      const err = new Error('Forbidden referer');
      err.status = 403;
      throw err;
    }
    if (!allowedOrigins.has(refererOrigin)) {
      const err = new Error('Forbidden referer');
      err.status = 403;
      throw err;
    }
  }
}

export function jsonWithCookies(status, payload, cookieHeaders = []) {
  const headers = new Headers(noStoreHeaders());
  for (const cookie of cookieHeaders) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}

export function isIdentityConfigError(error) {
  return error?.name === 'MissingIdentityError' || error?.code === 'auth_not_configured';
}

export function statusFromError(error, fallback = 500) {
  const status = Number(error?.status || error?.statusCode);
  return Number.isFinite(status) ? status : fallback;
}

export function createRateLimit({ windowMs, limit }) {
  const attempts = new Map();

  function prune(list, now) {
    return list.filter((time) => now - time < windowMs);
  }

  return function hit(key) {
    const now = Date.now();
    const list = prune(attempts.get(key) || [], now);
    if (list.length >= limit) {
      attempts.set(key, list);
      return false;
    }
    list.push(now);
    attempts.set(key, list);
    return true;
  };
}
