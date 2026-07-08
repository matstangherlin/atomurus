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
     ALLOWED_ORIGIN        (optional)  lock CORS to your domain (e.g. https://atomurus.com)
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

function corsHeaders(event) {
  const origin = event.headers && (event.headers.origin || event.headers.Origin);
  const allow = process.env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allow === '*' ? '*' : (origin === allow ? origin : allow),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
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

// ── reCAPTCHA v3 server-side check (only when a secret is configured) ──
async function recaptchaPasses(event, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { skip: true, pass: true };       // not configured → don't block
  if (!token) return { skip: false, pass: false, reason: 'missing-token' };

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
    return { skip: false, pass: ok, score, reason: ok ? null : 'low-score-or-invalid' };
  } catch (e) {
    console.error('[contact-send] reCAPTCHA verify failed:', e);
    // Fail open on an upstream outage so genuine users aren't stranded.
    return { skip: false, pass: true, reason: 'verify-unreachable' };
  }
}

exports.handler = async function (event) {
  const cors = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, cors, { ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, cors, { ok: false, error: 'Invalid JSON body' });
  }

  // ── Honeypot: a bot that fills the hidden _gotcha field gets a fake
  //    success so it doesn't retry, but nothing is sent. ──────────────
  if (body._gotcha) {
    return json(200, cors, { ok: true });
  }

  const name    = (body.name    || '').toString().trim();
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
    return json(403, cors, { ok: false, error: 'Failed spam verification' });
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

  const topicLabel = TOPIC_LABELS[topic] || topic || 'Contact';
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
