/*
 * Sync foundation — Cloud ↕ Sync ↕ Local cache.
 *
 * A1.0 defines the contract and the conflict rules; it does not make Atomurus
 * work fully offline. Flow for a cloud mutation (e.g. grading a Review card):
 *
 *   local optimistic state  →  API  →  Supabase  →  reconcile
 *
 *   1. apply the change to local state immediately (optimistic)
 *   2. send it through the API client (no automatic replay of writes)
 *   3. success → replace the optimistic value with the server's answer
 *      failure → roll back and surface the error kind (offline, auth, ...)
 *
 * Web and Android run this same code. There is no Android-only Study logic.
 */

import { StorageClass } from '../storage/storage-policy.js';

export const ConflictPolicy = Object.freeze({
  /* Study Sets, progress, reviews, entitlement, account: the server decides.
     A write carries the version it was based on; the server answer wins. */
  CLOUD_WINS: 'cloud-wins',
  /* Versioned mutation: reject when the base version is stale and let the
     user or the feature decide (never merged silently). */
  VERSIONED: 'versioned',
  /* Small device preferences (theme, language): this device's choice stands. */
  LOCAL_WINS: 'local-wins'
});

/* Every synced domain names its rule. Unknown domains are an error, never a
   silent "last write wins". */
export const DOMAIN_POLICY = Object.freeze({
  'study.items': ConflictPolicy.CLOUD_WINS,
  'study.progress': ConflictPolicy.CLOUD_WINS,
  'study.sets': ConflictPolicy.VERSIONED,
  'study.cards': ConflictPolicy.VERSIONED,
  'study.reviews': ConflictPolicy.CLOUD_WINS,
  'study.calculatorHistory': ConflictPolicy.CLOUD_WINS,
  'proLab.sessions': ConflictPolicy.VERSIONED,
  'account.profile': ConflictPolicy.CLOUD_WINS,
  'account.entitlement': ConflictPolicy.CLOUD_WINS,
  'preferences.theme': ConflictPolicy.LOCAL_WINS,
  'preferences.lang': ConflictPolicy.LOCAL_WINS
});

export function policyFor(domain) {
  const policy = DOMAIN_POLICY[domain];
  if (!policy) throw new Error(`No conflict policy for "${domain}" — add one to DOMAIN_POLICY.`);
  return policy;
}

export function storageClassFor(domain) {
  return domain.startsWith('preferences.') ? StorageClass.PREFERENCE : StorageClass.CLOUD;
}

/**
 * Decide the value after a round-trip.
 * @returns {{ value, conflict: boolean, reason?: string }}
 */
export function resolveConflict(domain, { local, server, baseVersion }) {
  const policy = policyFor(domain);
  if (policy === ConflictPolicy.LOCAL_WINS) return { value: local, conflict: false };
  if (policy === ConflictPolicy.CLOUD_WINS) return { value: server, conflict: false };
  /* VERSIONED */
  const serverVersion = server && (server.updatedAt || server.version);
  if (baseVersion != null && serverVersion != null && String(serverVersion) !== String(baseVersion)) {
    return { value: server, conflict: true, reason: 'stale_base_version' };
  }
  return { value: server, conflict: false };
}

/**
 * Optimistic mutation helper.
 *
 *   await optimisticMutation({
 *     domain: 'study.sets',
 *     apply:    () => store.rename(id, title),         // returns rollback fn
 *     send:     () => api.put('/api/study/set', ...),
 *     reconcile:(server) => store.replace(server.set)
 *   })
 */
export async function optimisticMutation({ domain, apply, send, reconcile, onConflict }) {
  policyFor(domain);
  const rollback = typeof apply === 'function' ? apply() : null;
  try {
    const server = await send();
    if (typeof reconcile === 'function') reconcile(server);
    return server;
  } catch (err) {
    if (typeof rollback === 'function') {
      try { rollback(); } catch (_e) { /* rollback must not mask the real error */ }
    }
    if (err && err.kind === 'CONFLICT' && typeof onConflict === 'function') onConflict(err);
    throw err;
  }
}
