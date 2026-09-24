/*
 * Retry policy. Conservative on purpose:
 *
 *  - GET/HEAD may retry a few times on connectivity or 5xx, with backoff.
 *  - POST/PUT/PATCH/DELETE never retry on their own. A write that timed out
 *    may still have landed (checkout, a Study Set, a Review grade, a Pro Lab
 *    session, an account change); replaying it could duplicate it. A caller
 *    that sends an Idempotency-Key opts in explicitly.
 *  - Never more than HARD_MAX_RETRIES, whatever the config says.
 *  - 401 is not retried here; the client refreshes once and replays once.
 */

import { ApiErrorKind } from './api-errors.js';

export const HARD_MAX_RETRIES = 4;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const RETRYABLE_KINDS = new Set([
  ApiErrorKind.NETWORK_ERROR,
  ApiErrorKind.TIMEOUT,
  ApiErrorKind.SERVER_ERROR,
  ApiErrorKind.RATE_LIMITED
]);
const RETRYABLE_WRITE_KINDS = new Set([ApiErrorKind.NETWORK_ERROR, ApiErrorKind.TIMEOUT]);

export function isSafeMethod(method) {
  return SAFE_METHODS.has(String(method || 'GET').toUpperCase());
}

export function maxRetriesFor({ method, idempotencyKey, retry, config }) {
  if (retry === false) return 0;
  const configured = Number.isFinite(retry) ? retry : (config?.maxRetries ?? 0);
  const bounded = Math.max(0, Math.min(HARD_MAX_RETRIES, Math.floor(configured)));
  if (isSafeMethod(method)) return bounded;
  return idempotencyKey ? Math.min(bounded, 1) : 0;
}

export function shouldRetry(error, { method, idempotencyKey, attempt, maxRetries, maxDelayMs }) {
  if (!error || attempt >= maxRetries) return false;
  if (error.kind === ApiErrorKind.ABORTED || error.kind === ApiErrorKind.OFFLINE) return false;
  if (!isSafeMethod(method)) {
    return Boolean(idempotencyKey) && RETRYABLE_WRITE_KINDS.has(error.kind);
  }
  if (!RETRYABLE_KINDS.has(error.kind)) return false;
  if (error.kind === ApiErrorKind.SERVER_ERROR && error.status === 501) return false;
  if (error.kind === ApiErrorKind.RATE_LIMITED) {
    /* Honour Retry-After only when it is short; otherwise surface it. */
    return error.retryAfterMs != null && error.retryAfterMs <= (maxDelayMs ?? 4000);
  }
  return true;
}

export function backoffDelay(attempt, { baseDelayMs = 400, maxDelayMs = 4000 } = {}, random = Math.random, retryAfterMs = null) {
  if (retryAfterMs != null) return Math.min(maxDelayMs, retryAfterMs);
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.round(exp * (0.5 + random() / 2));
}
