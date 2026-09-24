/*
 * Canonical API error taxonomy. The UI branches on `kind`, never on message
 * text, so "offline", "slow", "server down" and "signed out" can each get
 * their own state instead of one "Something went wrong".
 *
 * `code` keeps the legacy contract: the server's own code when it sent one
 * (feature_locked, session_expired, ...), otherwise 'network' / 'timeout'
 * as the pre-A1.0 clients reported.
 */

export const ApiErrorKind = Object.freeze({
  NETWORK_ERROR: 'NETWORK_ERROR',
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
  ABORTED: 'ABORTED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  CLIENT_ERROR: 'CLIENT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE'
});

const LEGACY_CODE = {
  NETWORK_ERROR: 'network',
  OFFLINE: 'network',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
  MALFORMED_RESPONSE: 'malformed_response'
};

export class ApiError extends Error {
  constructor(kind, init = {}) {
    super(init.message || defaultMessage(kind));
    this.name = kind === ApiErrorKind.ABORTED ? 'AbortError' : 'ApiError';
    this.kind = kind;
    this.status = Number.isFinite(init.status) ? init.status : 0;
    this.code = init.code || LEGACY_CODE[kind] || null;
    this.body = init.body || null;
    this.payload = this.body;
    this.feature = this.body?.feature || null;
    this.upgradeUrl = this.body?.upgradeUrl || '/pricing';
    this.retryAfterMs = Number.isFinite(init.retryAfterMs) ? init.retryAfterMs : null;
    this.method = init.method || null;
    this.path = init.path || null;
    if (init.cause) this.cause = init.cause;
  }

  get isAuthError() {
    return this.kind === ApiErrorKind.UNAUTHORIZED;
  }

  get isConnectivityError() {
    return this.kind === ApiErrorKind.NETWORK_ERROR ||
      this.kind === ApiErrorKind.OFFLINE ||
      this.kind === ApiErrorKind.TIMEOUT;
  }
}

function defaultMessage(kind) {
  switch (kind) {
    case ApiErrorKind.OFFLINE: return 'You are offline.';
    case ApiErrorKind.NETWORK_ERROR: return 'network';
    case ApiErrorKind.TIMEOUT: return 'timeout';
    case ApiErrorKind.ABORTED: return 'aborted';
    case ApiErrorKind.UNAUTHORIZED: return 'Sign in required';
    case ApiErrorKind.FORBIDDEN: return 'Forbidden';
    case ApiErrorKind.NOT_FOUND: return 'Not found';
    case ApiErrorKind.RATE_LIMITED: return 'Too many requests';
    case ApiErrorKind.MALFORMED_RESPONSE: return 'Malformed response';
    case ApiErrorKind.SERVER_ERROR: return 'Server error';
    default: return 'Request failed';
  }
}

export function kindForStatus(status) {
  if (status === 401) return ApiErrorKind.UNAUTHORIZED;
  if (status === 403) return ApiErrorKind.FORBIDDEN;
  if (status === 404) return ApiErrorKind.NOT_FOUND;
  if (status === 409) return ApiErrorKind.CONFLICT;
  if (status === 429) return ApiErrorKind.RATE_LIMITED;
  if (status >= 500) return ApiErrorKind.SERVER_ERROR;
  return ApiErrorKind.CLIENT_ERROR;
}

/* Retry-After is seconds or an HTTP date. */
export function parseRetryAfter(value, now = Date.now()) {
  if (value == null || value === '') return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(String(value));
  return Number.isFinite(at) ? Math.max(0, at - now) : null;
}

export function isApiError(err) {
  return Boolean(err && typeof err === 'object' && typeof err.kind === 'string' && err.kind in ApiErrorKind);
}
