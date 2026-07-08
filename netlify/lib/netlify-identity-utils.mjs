import { verifyRequestOrigin } from '@netlify/identity';
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

export function validEmail(email) {
  return EMAIL_RE.test(email) && email.length <= 200;
}

export function clientIp(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  );
}

function configuredOrigins() {
  return [process.env.AUTH_ALLOWED_ORIGINS, process.env.ALLOWED_ORIGIN]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function verifySameOrigin(request) {
  const ownOrigin = new URL(request.url).origin;
  const allowedOrigins = Array.from(new Set([ownOrigin, ...configuredOrigins()]));
  verifyRequestOrigin(request, { allowedOrigins });
}

export function isIdentityConfigError(error) {
  return error?.name === 'MissingIdentityError';
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
