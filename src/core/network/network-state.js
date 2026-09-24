/*
 * Network state the UI can speak about precisely.
 *
 *   online | offline | slow | server_error | auth_expired
 *
 * Fed by the platform (online/offline) and by API client events. The shell
 * shows a specific banner per state instead of "Something went wrong.", and
 * never blocks rendering on it (offline baseline: no white screen, no loop).
 */

import { ApiErrorKind } from '../api/api-errors.js';

export const NetworkStatus = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  SLOW: 'slow',
  SERVER_ERROR: 'server_error',
  AUTH_EXPIRED: 'auth_expired'
});

/* Map one failed request to the state the user should see. */
export function statusForError(err) {
  if (!err || !err.kind) return NetworkStatus.SERVER_ERROR;
  switch (err.kind) {
    case ApiErrorKind.OFFLINE:
    case ApiErrorKind.NETWORK_ERROR:
      return NetworkStatus.OFFLINE;
    case ApiErrorKind.TIMEOUT:
      return NetworkStatus.SLOW;
    case ApiErrorKind.UNAUTHORIZED:
      return NetworkStatus.AUTH_EXPIRED;
    case ApiErrorKind.SERVER_ERROR:
    case ApiErrorKind.MALFORMED_RESPONSE:
      return NetworkStatus.SERVER_ERROR;
    default:
      return null; /* 403/404/409/429/400 are feature-level, not connectivity. */
  }
}

export function createNetworkState({ platform, now = () => Date.now(), recoverAfterMs = 30000 } = {}) {
  let status = platform && !platform.isOnline() ? NetworkStatus.OFFLINE : NetworkStatus.ONLINE;
  let since = now();
  const listeners = new Set();

  function set(next) {
    if (!next || next === status) return;
    status = next;
    since = now();
    for (const fn of Array.from(listeners)) {
      try { fn(status); } catch (_err) { /* ignore */ }
    }
  }

  const offPlatform = platform
    ? platform.onNetworkChange(({ online }) => set(online ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE))
    : () => {};

  return {
    get status() {
      /* Transient states decay back to online so one slow call does not pin a
         banner forever. Offline and auth-expired only clear on real events. */
      if ((status === NetworkStatus.SLOW || status === NetworkStatus.SERVER_ERROR) && now() - since > recoverAfterMs) {
        status = NetworkStatus.ONLINE;
      }
      return status;
    },
    /* Hook for createApiClient({ onEvent }). */
    onApiEvent(event) {
      if (!event) return;
      if (event.type === 'offline' || event.type === 'network_error') set(NetworkStatus.OFFLINE);
      else if (event.type === 'timeout') set(NetworkStatus.SLOW);
      else if (event.type === 'server_error') set(NetworkStatus.SERVER_ERROR);
      else if (event.type === 'unauthorized') set(NetworkStatus.AUTH_EXPIRED);
    },
    markHealthy() { set(NetworkStatus.ONLINE); },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy() {
      offPlatform();
      listeners.clear();
    }
  };
}
