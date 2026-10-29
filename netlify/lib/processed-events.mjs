// Stripe webhook dedupe (prompt 29, B05). A second delivery of an event that
// was already handled answers 200 { duplicate: true } without redoing its
// effects. This is an extra layer: the metadata writes are last-write-wins, so
// a duplicate that slips through still lands in the same state.
//
//   claim(id)   → true if this delivery may process the event, false if it was
//                 already processed (or is being processed right now)
//   commit(id)  → the event was handled; remember it
//   release(id) → handling failed; forget the claim so Stripe's retry runs
//
// Two stores. Memory (default): per function instance, best effort, short TTL.
// Supabase: the processed_stripe_events table of migration 011, used only when
// STRIPE_EVENT_DEDUPE=supabase is set (an owner step, after applying 011).
import { supabaseServiceRest } from './supabase-auth.mjs';

export const MEMORY_TTL_MS = 60 * 60 * 1000;
export const MEMORY_MAX = 2000;

export function memoryProcessedEvents({ ttlMs = MEMORY_TTL_MS, max = MEMORY_MAX, now = () => Date.now() } = {}) {
  const seen = new Map(); // id → { state: 'pending' | 'done', at }
  const prune = () => {
    const limit = now() - ttlMs;
    for (const [id, row] of seen) if (row.at < limit) seen.delete(id);
    while (seen.size > max) seen.delete(seen.keys().next().value);
  };
  return {
    kind: 'memory',
    async claim(id) {
      if (!id) return true;
      prune();
      if (seen.has(id)) return false;
      seen.set(id, { state: 'pending', at: now() });
      return true;
    },
    async commit(id) {
      if (id) seen.set(id, { state: 'done', at: now() });
    },
    async release(id) {
      if (id && seen.get(id)?.state === 'pending') seen.delete(id);
    }
  };
}

export function supabaseProcessedEvents({ rest = supabaseServiceRest } = {}) {
  return {
    kind: 'supabase',
    async claim(id) {
      if (!id) return true;
      const rows = await rest('/processed_stripe_events?on_conflict=event_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ event_id: id })
      });
      return Array.isArray(rows) && rows.length > 0;
    },
    async commit() {
      // The row written by claim() is the record.
    },
    async release(id) {
      if (!id) return;
      await rest(`/processed_stripe_events?event_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    }
  };
}

let memorySingleton = null;
export function processedEventsStore(env = process.env) {
  if (String(env.STRIPE_EVENT_DEDUPE || '').trim().toLowerCase() === 'supabase') return supabaseProcessedEvents();
  if (!memorySingleton) memorySingleton = memoryProcessedEvents();
  return memorySingleton;
}
