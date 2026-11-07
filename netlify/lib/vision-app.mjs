/* Vision identify from the Android app. The app has no accounts yet and every
   feature is open in it, so analyses are free per device. The only limits are
   abuse guards, counted in memory per function instance:
     VISION_APP_PER_DAY     analyses per device per day (0 = unlimited, default)
     VISION_APP_IP_PER_DAY  analyses per IP per day     (0 = unlimited, default 300)
   When the camera becomes a paid feature in the app, lower VISION_APP_PER_DAY. */
import { clientIp } from './netlify-identity-utils.mjs';

const APP_ORIGINS = new Set(['https://localhost', 'capacitor://localhost', 'http://localhost']);
const DEVICE_RE = /^[a-z0-9-]{8,64}$/i;

export function isAppRequest(request) {
  const h = request.headers;
  return h.get('x-atomurus-app') === 'android' && DEVICE_RE.test(String(h.get('x-atomurus-device') || ''));
}

export function appDevice(request) {
  return String(request.headers.get('x-atomurus-device') || '').toLowerCase();
}

export function appCors(request) {
  const origin = request.headers.get('origin') || '';
  if (!APP_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Atomurus-App, X-Atomurus-Device',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin'
  };
}

function positive(value, fallback) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/* Daily counters. `left` is the number of analyses still allowed today, or
   null when nothing limits this device. */
export function createAppQuota({ perDevice = 0, perIp = 300 } = {}) {
  perDevice = positive(perDevice, 0);
  perIp = positive(perIp, 0);
  const counts = new Map();
  const key = (k) => `${new Date().toISOString().slice(0, 10)}:${k}`;
  const used = (k) => counts.get(key(k)) || 0;
  const bump = (k) => { if (counts.size > 5000) counts.clear(); counts.set(key(k), used(k) + 1); };
  function left(device, ip) {
    const d = perDevice ? perDevice - used(`d:${device}`) : null;
    const i = perIp ? perIp - used(`ip:${ip}`) : null;
    if (d === null && i === null) return null;
    return Math.max(0, Math.min(d ?? Infinity, i ?? Infinity));
  }
  return {
    peek(device, ip) { const l = left(device, ip); return { allowed: l !== 0, left: l }; },
    take(device, ip) {
      if (left(device, ip) === 0) return { allowed: false, left: 0 };
      bump(`d:${device}`); bump(`ip:${ip}`);
      return { allowed: true, left: left(device, ip) };
    }
  };
}

const quota = createAppQuota({ perDevice: process.env.VISION_APP_PER_DAY ?? 0, perIp: process.env.VISION_APP_IP_PER_DAY ?? 300 });

export function appQuota(request, { peek = false } = {}) {
  const device = appDevice(request);
  const ip = clientIp(request) || 'noip';
  return peek ? quota.peek(device, ip) : quota.take(device, ip);
}
