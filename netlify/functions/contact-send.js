/* ──────────────────────────────────────────────────────────────────
   Atomurus — contact form → email via Mailgun
   Netlify Function · Node.js 18+ (native fetch + URLSearchParams + Buffer)
   ──────────────────────────────────────────────────────────────────

   ENDPOINT (after deploy): POST /.netlify/functions/contact-send
                            pretty:  POST /api/contact-send  (see netlify.toml)

   REQUEST BODY (JSON):
     {
       "name":    "Visitor name",
       "email":   "visitor@example.com",   // used as Reply-To
       "topic":   "bug" | "feedback" | ... // optional
       "message": "…",
       "token":   "<recaptcha-token>",     // optional; enforced only if
                                           //   RECAPTCHA_SECRET_KEY is set
       "_gotcha": ""                        // honeypot — must stay empty
     }

   RESPONSE BODY (JSON):
     { "ok": true }                              on success
     { "ok": false, "error": "…" }               on failure

   ENVIRONMENT VARIABLES (Netlify dashboard → Site settings → Env vars):
     MAILGUN_API_KEY       (required)  private Mailgun key — NEVER in client code
     MAILGUN_DOMAIN        (optional)  defaults to the sandbox domain; override for a verified one
     CONTACT_TO            (optional)  defaults to the sandbox's authorized recipient
                                       (on a SANDBOX domain the value must be an Authorized Recipient)
     MAILGUN_BASE_URL      (optional)  https://api.mailgun.net (default, US)
                                       https://api.eu.mailgun.net (EU region)
     CONTACT_FROM          (optional)  default: "Atomurus <postmaster@MAILGUN_DOMAIN>"
     CONTACT_SUBJECT_PREFIX(optional)  default: "[Atomurus]"
     RECAPTCHA_SECRET_KEY  (optional)  if present, reCAPTCHA v3 is verified server-side
     RECAPTCHA_MIN_SCORE   (optional)  default 0.5
     CONTACT_RECAPTCHA_MODE (optional) optional (default) | required
     ALLOWED_ORIGIN        (optional)  single allowed Origin; alias of the list below
     CONTACT_ALLOWED_ORIGINS (optional) comma-separated Origins. Default: https://atomurus.com
                                       and https://www.atomurus.com, plus localhost outside production
     CONTACT_RATE_LIMIT_IP (optional)  default 5 hits per window
     CONTACT_RATE_LIMIT_EMAIL (optional) default 3 hits per window
     CONTACT_RATE_LIMIT_WINDOW_SEC (optional) default 3600
     RATE_LIMIT_STORE      (optional)  rest, and only with URL + token; otherwise memory
     RATE_LIMIT_REST_URL   (optional)  Redis-HTTP pipeline endpoint
     RATE_LIMIT_REST_TOKEN (optional)  bearer token for that endpoint
   ──────────────────────────────────────────────────────────────── */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// Human-readable labels for the form's <select> values (fallback: the raw value).
const TOPIC_LABELS = {
  bug:         'Bug / scientific error',
  feedback:    'Feedback / suggestion',
  partnership: 'Educational partnership',
  press:       'Press',
  other:       'Other'
};

function requestOrigin(event) {
  const headers = event && event.headers;
  if (!headers) return '';
  return headers.origin || headers.Origin || '';
}

function configuredOrigins() {
  const raw = process.env.CONTACT_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function originAllowed(origin) {
  if (!origin) return false;
  const configured = configuredOrigins();
  if (configured.length) return configured.includes(origin);
  if (origin === 'https://atomurus.com' || origin === 'https://www.atomurus.com') return true;
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch (_err) {
    return false;
  }
}

function corsHeaders(event) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
  const origin = requestOrigin(event);
  if (origin && originAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(statusCode, cors, payload) {
  return {
    statusCode,
    headers: { ...cors, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

// Minimal HTML escaping so visitor input can't inject markup into the
// email we render for the owner's inbox.
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function recaptchaMode() {
  return String(process.env.CONTACT_RECAPTCHA_MODE || 'optional').toLowerCase() === 'required'
    ? 'required'
    : 'optional';
}

let warnedOptionalRecaptcha = false;
let warnedRecipient = false;

function warnBuiltInRecipient() {
  if (process.env.CONTACT_TO || warnedRecipient) return;
  warnedRecipient = true;
  console.warn('[contact-send] CONTACT_TO is not set; using the built-in recipient');
}

// ── reCAPTCHA v3 server-side check ──
// optional (default): missing secret or a Google outage does not block.
// required: missing secret, missing/invalid token, or a Google outage fails closed.
async function recaptchaPasses(event, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const mode = recaptchaMode();
  if (!secret) {
    if (mode === 'required') {
      return { skip: false, pass: false, status: 503, error: 'Spam protection not configured' };
    }
    if (!warnedOptionalRecaptcha) {
      warnedOptionalRecaptcha = true;
      console.warn('[contact-send] RECAPTCHA_SECRET_KEY is not set; mode is optional');
    }
    return { skip: true, pass: true };
  }
  if (!token) return { skip: false, pass: false, status: 403, error: 'Failed spam verification' };

  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE);
  const threshold = (minScore >= 0 && minScore <= 1) ? minScore : 0.5;

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  const clientIp =
    (event.headers && (event.headers['x-nf-client-connection-ip'] ||
                       event.headers['x-forwarded-for'])) || '';
  if (clientIp) params.append('remoteip', clientIp.split(',')[0].trim());

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    const score = typeof data.score === 'number' ? data.score : null;
    const ok = !!data.success && (score === null || score >= threshold);
    if (!ok) return { skip: false, pass: false, status: 403, error: 'Failed spam verification', score };
    return { skip: false, pass: true, score };
  } catch (e) {
    console.error('[contact-send] reCAPTCHA verify failed:', e && e.message ? e.message : e);
    if (mode === 'required') {
      return { skip: false, pass: false, status: 503, error: 'Spam protection not configured' };
    }
    console.warn('[contact-send] reCAPTCHA unreachable; optional mode continues');
    return { skip: false, pass: true, reason: 'verify-unreachable' };
  }
}

function positiveInt(name, fallback) {
  const parsed = parseInt(process.env[name], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientIp(event) {
  const headers = (event && event.headers) || {};
  const raw = headers['x-nf-client-connection-ip'] || headers['x-forwarded-for'] || '';
  return String(raw).split(',')[0].trim();
}

function cleanName(value) {
  return String(value || '').replace(/[\r\n<>]/g, '').trim();
}

let rateApi = null;

async function getRateApi() {
  if (!rateApi) {
    const mod = await import('../lib/rate-limit-store.mjs');
    rateApi = { mod, store: mod.createRateStore(process.env) };
  }
  return rateApi;
}

async function enforceRateLimit(event, body) {
  const { mod, store } = await getRateApi();
  const windowMs = positiveInt('CONTACT_RATE_LIMIT_WINDOW_SEC', 3600) * 1000;
  const ipLimiter = mod.createAsyncRateLimiter({
    windowMs,
    limit: positiveInt('CONTACT_RATE_LIMIT_IP', 5),
    store
  });
  const emailLimiter = mod.createAsyncRateLimiter({
    windowMs,
    limit: positiveInt('CONTACT_RATE_LIMIT_EMAIL', 3),
    store
  });
  const ip = clientIp(event);
  const email = String((body && body.email) || '').trim().toLowerCase();
  const ipDecision = await ipLimiter.hit(ip ? `ip:${ip}` : 'ip:');
  const emailDecision = email ? await emailLimiter.hit(`email:${email}`) : { allowed: true, retryAfter: 0 };
  if (ipDecision.allowed && emailDecision.allowed) return null;
  const retryAfter = Math.max(ipDecision.retryAfter || 0, emailDecision.retryAfter || 0, 1);
  return {
    statusCode: 429,
    headers: {
      ...corsHeaders(event),
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter)
    },
    body: JSON.stringify({ ok: false, error: 'Too many requests' })
  };
}

function resetRateLimitForTests() {
  rateApi = null;
  warnedOptionalRecaptcha = false;
  warnedRecipient = false;
}

exports.handler = async function (event) {
  warnBuiltInRecipient();
  const cors = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, cors, { ok: false, error: 'Method not allowed' });
  }
  if (requestOrigin(event) && !originAllowed(requestOrigin(event))) {
    return json(403, cors, { ok: false, error: 'Origin not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, cors, { ok: false, error: 'Invalid JSON body' });
  }

  const limited = await enforceRateLimit(event, body);
  if (limited) return limited;

  // ── Honeypot: a bot that fills the hidden _gotcha field gets a fake
  //    success so it doesn't retry, but nothing is sent. ──────────────
  if (body._gotcha) {
    return json(200, cors, { ok: true });
  }

  const name    = cleanName(body.name);
  const email   = (body.email   || '').toString().trim();
  const topic   = (body.topic   || '').toString().trim();
  const message = (body.message || '').toString().trim();

  // ── Validation ─────────────────────────────────────────────────────
  if (!name || name.length > 120) {
    return json(400, cors, { ok: false, error: 'Invalid name' });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json(400, cors, { ok: false, error: 'Invalid email' });
  }
  if (message.length < 10 || message.length > 5000) {
    return json(400, cors, { ok: false, error: 'Message too short or too long' });
  }

  // ── Spam check ─────────────────────────────────────────────────────
  const rc = await recaptchaPasses(event, body.token);
  if (!rc.pass) {
    return json(rc.status || 403, cors, { ok: false, error: rc.error || 'Failed spam verification' });
  }

  // ── Mailgun config ─────────────────────────────────────────────────
  // Only MAILGUN_API_KEY is a true secret that MUST live in Netlify env vars.
  // DOMAIN and CONTACT_TO are not secret, so they fall back to sensible
  // built-in defaults (the sandbox domain + its authorized recipient). Set
  // the matching env vars in Netlify to override — e.g. when you verify a
  // real domain or change the destination inbox.
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'atomurus.com';
  const to     = process.env.CONTACT_TO || 'matheus.stangherlin@hotmail.com';
  const baseUrl = (process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net').replace(/\/+$/, '');
  const from   = process.env.CONTACT_FROM || `Atomurus <postmaster@${domain}>`;
  const subjectPrefix = process.env.CONTACT_SUBJECT_PREFIX || '[Atomurus]';

  if (!apiKey) {
    console.error('[contact-send] Missing MAILGUN_API_KEY env var');
    return json(500, cors, { ok: false, error: 'Server not configured (missing API key)' });
  }

  const topicLabel = TOPIC_LABELS[topic] || TOPIC_LABELS.other;
  const subject = `${subjectPrefix} ${topicLabel} — ${name}`;

  const clientIp =
    (event.headers && (event.headers['x-nf-client-connection-ip'] ||
                       event.headers['x-forwarded-for'])) || '—';
  const userAgent = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || '—';

  const textBody =
`New message from the Atomurus contact form

Name:    ${name}
E-mail:  ${email}
Subject: ${topicLabel}

${message}

──────────────────────────────
IP:        ${String(clientIp).split(',')[0].trim()}
User-Agent: ${userAgent}
Sent:      ${new Date().toISOString()}`;

  const htmlBody =
`<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6">
  <h2 style="margin:0 0 12px;font-size:16px">New message from the Atomurus contact form</h2>
  <table style="border-collapse:collapse">
    <tr><td style="padding:2px 12px 2px 0;color:#666">Name</td><td><strong>${escHtml(name)}</strong></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666">E-mail</td><td><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666">Subject</td><td>${escHtml(topicLabel)}</td></tr>
  </table>
  <p style="white-space:pre-wrap;margin:14px 0;padding:12px;background:#f6f6f4;border-radius:8px">${escHtml(message)}</p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:14px 0">
  <p style="font-size:12px;color:#999;margin:0">
    IP ${escHtml(String(clientIp).split(',')[0].trim())} ·
    ${escHtml(userAgent)} ·
    ${new Date().toISOString()}
  </p>
</div>`;

  // ── Send via Mailgun (form-encoded, like the official samples) ──────
  const form = new URLSearchParams();
  form.append('from', from);
  form.append('to', to);
  form.append('subject', subject);
  form.append('text', textBody);
  form.append('html', htmlBody);
  form.append('h:Reply-To', `${name} <${email}>`);
  // Tag so you can filter/inspect these in the Mailgun dashboard.
  form.append('o:tag', 'contact-form');

  const auth = 'Basic ' + Buffer.from('api:' + apiKey).toString('base64');

  try {
    const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[contact-send] Mailgun ${res.status}: ${detail.slice(0, 500)}`);
      // 401 = bad key · 403 = unauthorized recipient (sandbox) · 4xx = bad request
      return json(502, cors, { ok: false, error: 'Email provider rejected the message' });
    }
  } catch (e) {
    console.error('[contact-send] Mailgun request failed:', e);
    return json(502, cors, { ok: false, error: 'Could not reach email provider' });
  }

  return json(200, cors, { ok: true });
};

exports._resetRateLimitForTests = resetRateLimitForTests;
