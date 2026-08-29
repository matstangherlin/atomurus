import dns from 'node:dns';

/**
 * Node 17+ resolves IPv6 first. From some Netlify isolates that path
 * black-holes: GoTrue still logs a completed request (via IPv4/happy
 * eyeballs) while `fetch()` never yields the body, so /api/auth/login
 * sits until the 30s edge inactivity timeout. Prefer IPv4.
 */
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_err) {
  // Older runtimes without setDefaultResultOrder.
}

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TIMEOUT_MS = 20000;

export function upstreamFetchTimeoutMs() {
  const n = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS);
  if (Number.isFinite(n) && n > 0) return Math.min(n, MAX_TIMEOUT_MS);
  return DEFAULT_TIMEOUT_MS;
}

export function upstreamFetchRetries() {
  const n = Number(process.env.SUPABASE_FETCH_RETRIES);
  if (Number.isFinite(n) && n >= 0) return Math.min(n, 2);
  return 1;
}

export function isUpstreamTimeoutError(err) {
  const code = String(err?.code || '').toLowerCase();
  const name = String(err?.name || '');
  return code === 'upstream_timeout' || name === 'TimeoutError' || name === 'AbortError';
}

export function upstreamTimeoutError() {
  const err = new Error('Authentication provider timed out');
  err.name = 'TimeoutError';
  err.code = 'upstream_timeout';
  err.status = 503;
  return err;
}

function delayReject(ms) {
  let timer = null;
  const promise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(upstreamTimeoutError()), ms);
  });
  promise.clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return promise;
}

function mergeHeaders(headers) {
  const out = { ...(headers || {}), Connection: 'close' };
  return out;
}

async function fetchAndBuffer(url, options, controller) {
  const res = await globalThis.fetch(url, {
    ...options,
    signal: options.signal || controller.signal,
    keepalive: false,
    headers: mergeHeaders(options.headers)
  });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    text: async () => text,
    json: async () => (text ? JSON.parse(text) : {})
  };
}

/**
 * fetch() + body read with a hard timeout and one retry.
 * Tests can stub globalThis.fetch; timeout/retry are read per call from env.
 */
export async function upstreamFetch(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : upstreamFetchTimeoutMs();
  const retries = options.retries == null ? upstreamFetchRetries() : Number(options.retries);
  const rest = { ...options };
  delete rest.timeoutMs;
  delete rest.retries;

  let lastErr = upstreamTimeoutError();
  const attempts = Math.max(0, retries) + 1;
  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController();
    const timeout = delayReject(timeoutMs);
    try {
      const buffered = await Promise.race([
        fetchAndBuffer(url, rest, controller),
        timeout
      ]);
      timeout.clear();
      return buffered;
    } catch (err) {
      timeout.clear();
      try {
        controller.abort();
      } catch (_abortErr) {}
      lastErr = isUpstreamTimeoutError(err) ? upstreamTimeoutError() : err;
      if (!isUpstreamTimeoutError(lastErr) || i === attempts - 1) throw lastErr;
    }
  }
  throw lastErr;
}
