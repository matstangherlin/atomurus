/*
 * Auth error mapping. One vocabulary for web and native, derived from the
 * API error kind plus the server's code. The login screen and the shell
 * branch on these; nothing branches on raw messages.
 */

import { ApiErrorKind } from '../api/api-errors.js';

export const AuthErrorCode = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  REFRESH_EXPIRED: 'REFRESH_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN'
});

export function mapAuthError(err, { phase = 'request' } = {}) {
  if (!err) return AuthErrorCode.UNKNOWN;
  const code = String(err.code || '').toLowerCase();
  switch (err.kind) {
    case ApiErrorKind.OFFLINE:
    case ApiErrorKind.NETWORK_ERROR:
      return AuthErrorCode.OFFLINE;
    case ApiErrorKind.TIMEOUT:
      return AuthErrorCode.TIMEOUT;
    case ApiErrorKind.RATE_LIMITED:
      return AuthErrorCode.RATE_LIMITED;
    case ApiErrorKind.SERVER_ERROR:
    case ApiErrorKind.MALFORMED_RESPONSE:
      return AuthErrorCode.SERVER_UNAVAILABLE;
    case ApiErrorKind.UNAUTHORIZED:
      if (code === 'email_not_confirmed') return AuthErrorCode.EMAIL_NOT_CONFIRMED;
      if (phase === 'login') return AuthErrorCode.INVALID_CREDENTIALS;
      if (phase === 'refresh') return AuthErrorCode.REFRESH_EXPIRED;
      if (code === 'token_invalid') return AuthErrorCode.TOKEN_INVALID;
      return AuthErrorCode.SESSION_EXPIRED;
    case ApiErrorKind.CLIENT_ERROR:
      if (phase === 'refresh') return AuthErrorCode.REFRESH_EXPIRED;
      if (code === 'upstream_timeout') return AuthErrorCode.SERVER_UNAVAILABLE;
      return AuthErrorCode.UNKNOWN;
    default:
      return AuthErrorCode.UNKNOWN;
  }
}

/* Refresh failures that mean "the refresh token is dead" (sign out) versus
   "could not reach the server" (keep the session, try later). */
export function isTerminalRefreshError(err) {
  if (!err) return false;
  if (err.kind === ApiErrorKind.UNAUTHORIZED) return true;
  if (err.kind === ApiErrorKind.CLIENT_ERROR && (err.status === 400 || err.status === 401)) return true;
  if (err.kind === ApiErrorKind.FORBIDDEN) return true;
  return false;
}
