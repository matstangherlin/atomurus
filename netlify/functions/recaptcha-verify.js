/* ──────────────────────────────────────────────────────────────────
   Atomurus — reCAPTCHA v3 server-side verification
   Netlify Function · Node.js 18+ (uses native fetch + URLSearchParams)
   ──────────────────────────────────────────────────────────────────

   ENDPOINT (after deploy): POST /.netlify/functions/recaptcha-verify

   REQUEST BODY (JSON):
     {
       "token":    "<recaptcha-token-from-grecaptcha.execute>",
       "action":   "contact_submit",       // optional, used to assert match
       "minScore": 0.5                     // optional, default 0.5
     }

   RESPONSE BODY (JSON):
     {
       "pass":            true|false,
       "success":         true|false,
       "score":           0.0..1.0,
       "action":          "contact_submit",
       "expectedAction":  "contact_submit",
       "minScore":        0.5,
       "hostname":        "atomurus.com",
       "challengeTs":     "2026-05-16T...",
       "errorCodes":      []
     }

   ENVIRONMENT VARIABLE (set in Netlify dashboard → Site settings → Env):
     RECAPTCHA_SECRET_KEY = <your secret key from the reCAPTCHA admin console>
   ──────────────────────────────────────────────────────────────── */

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

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

exports.handler = async function (event) {
  const cors = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const token = body.token;
  const expectedAction = body.action || null;
  const minScore = (typeof body.minScore === 'number' && body.minScore >= 0 && body.minScore <= 1)
    ? body.minScore
    : 0.5;

  if (!token || typeof token !== 'string') {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing or invalid token' })
    };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('[recaptcha-verify] RECAPTCHA_SECRET_KEY env var is not set');
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured' })
    };
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  const clientIp =
    (event.headers && (event.headers['x-nf-client-connection-ip'] ||
                       event.headers['x-forwarded-for'])) || '';
  if (clientIp) {
    params.append('remoteip', clientIp.split(',')[0].trim());
  }

  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    data = await res.json();
  } catch (e) {
    console.error('[recaptcha-verify] siteverify failed:', e);
    return {
      statusCode: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upstream verification failed' })
    };
  }

  const success = !!data.success;
  const score = typeof data.score === 'number' ? data.score : null;
  const action = data.action || null;
  const errorCodes = data['error-codes'] || [];

  const actionOk = !expectedAction || action === expectedAction;
  const scoreOk = score === null || score >= minScore;
  const pass = success && actionOk && scoreOk;

  return {
    statusCode: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pass,
      success,
      score,
      action,
      expectedAction,
      minScore,
      hostname: data.hostname || null,
      challengeTs: data.challenge_ts || null,
      errorCodes
    })
  };
};
