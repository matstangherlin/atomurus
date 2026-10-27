import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contact = require('../netlify/functions/contact-send.js');

const inbox = ['inbox', 'example.com'].join('@');
const visitor = ['ada', 'example.com'].join('@');
const otherVisitor = ['grace', 'example.com'].join('@');
const KEYS = [
  'MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'CONTACT_TO', 'CONTACT_FROM',
  'CONTACT_ALLOWED_ORIGINS', 'ALLOWED_ORIGIN', 'CONTACT_RECAPTCHA_MODE',
  'RECAPTCHA_SECRET_KEY', 'RECAPTCHA_MIN_SCORE', 'CONTACT_RATE_LIMIT_IP',
  'CONTACT_RATE_LIMIT_EMAIL', 'CONTACT_RATE_LIMIT_WINDOW_SEC',
  'RATE_LIMIT_STORE', 'RATE_LIMIT_REST_URL', 'RATE_LIMIT_REST_TOKEN', 'NODE_ENV'
];
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

function useEnv(extra = {}) {
  for (const key of KEYS) delete process.env[key];
  process.env.NODE_ENV = 'test';
  process.env.MAILGUN_API_KEY = 'test-mail-token';
  process.env.CONTACT_TO = inbox;
  process.env.MAILGUN_DOMAIN = 'example.com';
  Object.assign(process.env, extra);
  contact._resetRateLimitForTests();
}

function body(extra = {}) {
  return {
    name: 'Ada Lovelace',
    email: visitor,
    topic: 'bug',
    message: 'The displayed mass of water looks inconsistent.',
    ...extra
  };
}

function event({ method = 'POST', origin = 'https://atomurus.com', ip = '203.0.113.10', payload, raw } = {}) {
  const headers = { 'x-nf-client-connection-ip': ip };
  if (origin) headers.origin = origin;
  return {
    httpMethod: method,
    headers,
    body: raw !== undefined ? raw : JSON.stringify(payload || body())
  };
}

let fetchCalls = [];
function installFetch(impl) {
  fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), init });
    return impl(String(url), init);
  };
}

function mailgunOk() {
  installFetch(async () => ({ ok: true, json: async () => ({}), text: async () => '' }));
}

async function send(options) {
  return contact.handler(event(options));
}

const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(' '));

try {
  useEnv();
  mailgunOk();
  const allowed = await send();
  assert.equal(allowed.statusCode, 200);
  assert.equal(JSON.parse(allowed.body).ok, true);
  assert.equal(allowed.headers['Access-Control-Allow-Origin'], 'https://atomurus.com');

  useEnv({ NODE_ENV: 'production' });
  mailgunOk();
  const denied = await send({ origin: 'https://evil.example' });
  assert.equal(denied.statusCode, 403);
  assert.equal(JSON.parse(denied.body).error, 'Origin not allowed');
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
  assert.equal(fetchCalls.length, 0);

  useEnv();
  mailgunOk();
  const noOrigin = await send({ origin: '' });
  assert.equal(noOrigin.statusCode, 200);
  assert.equal(noOrigin.headers['Access-Control-Allow-Origin'], undefined);
  assert.equal(noOrigin.headers.Vary, 'Origin');

  useEnv();
  const options = await send({ method: 'OPTIONS' });
  assert.equal(options.statusCode, 204);
  assert.equal(options.headers['Access-Control-Allow-Origin'], 'https://atomurus.com');
  assert.equal(options.headers.Vary, 'Origin');

  useEnv();
  mailgunOk();
  const optional = await send();
  assert.equal(optional.statusCode, 200);
  assert.equal(fetchCalls.length, 1);
  assert.ok(warnings.some((line) => line.includes('RECAPTCHA_SECRET_KEY')));

  useEnv({ CONTACT_RECAPTCHA_MODE: 'required' });
  mailgunOk();
  const unconfigured = await send();
  assert.equal(unconfigured.statusCode, 503);
  assert.equal(JSON.parse(unconfigured.body).error, 'Spam protection not configured');
  assert.equal(fetchCalls.length, 0);

  useEnv({ CONTACT_RECAPTCHA_MODE: 'required', RECAPTCHA_SECRET_KEY: 'not-a-real-value' });
  mailgunOk();
  const missingToken = await send();
  assert.equal(missingToken.statusCode, 403);
  assert.equal(JSON.parse(missingToken.body).error, 'Failed spam verification');

  useEnv({ CONTACT_RECAPTCHA_MODE: 'required', RECAPTCHA_SECRET_KEY: 'not-a-real-value' });
  installFetch(async (url) => {
    if (url.includes('siteverify')) return { ok: true, json: async () => ({ success: true, score: 0.1 }) };
    return { ok: true, json: async () => ({}), text: async () => '' };
  });
  const lowScore = await send({ payload: body({ token: 'tok' }) });
  assert.equal(lowScore.statusCode, 403);

  useEnv({ CONTACT_RECAPTCHA_MODE: 'required', RECAPTCHA_SECRET_KEY: 'not-a-real-value' });
  installFetch(async () => { throw new Error('network down'); });
  const googleDown = await send({ payload: body({ token: 'tok' }) });
  assert.equal(googleDown.statusCode, 503);
  assert.equal(JSON.parse(googleDown.body).error, 'Spam protection not configured');

  useEnv({ CONTACT_RATE_LIMIT_IP: '1' });
  mailgunOk();
  const honeypot = await send({ payload: body({ _gotcha: 'bot' }) });
  assert.equal(honeypot.statusCode, 200);
  assert.equal(fetchCalls.length, 0);
  const afterHoneypot = await send();
  assert.equal(afterHoneypot.statusCode, 429);

  useEnv({ CONTACT_RATE_LIMIT_IP: '2', CONTACT_RATE_LIMIT_EMAIL: '9' });
  mailgunOk();
  assert.equal((await send({ payload: body({ email: visitor }) })).statusCode, 200);
  assert.equal((await send({ payload: body({ email: otherVisitor }) })).statusCode, 200);
  const ipLimited = await send({ payload: body({ email: ['bea', 'example.com'].join('@') }) });
  assert.equal(ipLimited.statusCode, 429);
  assert.equal(JSON.parse(ipLimited.body).error, 'Too many requests');
  assert.ok(Number(ipLimited.headers['Retry-After']) >= 1);

  useEnv({ CONTACT_RATE_LIMIT_IP: '9', CONTACT_RATE_LIMIT_EMAIL: '1' });
  mailgunOk();
  assert.equal((await send({ ip: '203.0.113.20' })).statusCode, 200);
  const emailLimited = await send({ ip: '203.0.113.21' });
  assert.equal(emailLimited.statusCode, 429);
  assert.ok(emailLimited.headers['Retry-After']);

  useEnv();
  let mailed = '';
  installFetch(async (_url, init) => {
    mailed = init.body;
    return { ok: true, json: async () => ({}), text: async () => '' };
  });
  const dirty = await send({ payload: body({ name: 'Ada\r\n<script>' }) });
  assert.equal(dirty.statusCode, 200);
  assert.equal(mailed.includes('\n<script>'), false);
  assert.equal(mailed.includes('<script>'), false);
  assert.equal(decodeURIComponent(mailed).includes('Ada'), true);

  useEnv();
  mailed = '';
  installFetch(async (_url, init) => {
    mailed = init.body;
    return { ok: true, json: async () => ({}), text: async () => '' };
  });
  const unknownTopic = await send({ payload: body({ topic: 'not-a-topic' }) });
  assert.equal(unknownTopic.statusCode, 200);
  assert.equal(decodeURIComponent(mailed).includes('Other'), true);
  assert.equal(decodeURIComponent(mailed).includes('not-a-topic'), false);

  useEnv();
  const method = await send({ method: 'GET' });
  assert.equal(method.statusCode, 405);
  assert.equal(JSON.parse(method.body).error, 'Method not allowed');

  useEnv();
  const invalid = await send({ raw: '{' });
  assert.equal(invalid.statusCode, 400);
  assert.equal(JSON.parse(invalid.body).error, 'Invalid JSON body');

  useEnv({
    RATE_LIMIT_STORE: 'rest',
    RATE_LIMIT_REST_URL: 'https://rate.example/pipeline',
    RATE_LIMIT_REST_TOKEN: 'token'
  });
  const originalImport = globalThis.fetch;
  installFetch(async (url) => {
    if (String(url).includes('rate.example')) throw new Error('store down');
    return { ok: true, json: async () => ({}), text: async () => '' };
  });
  const fallback = await send();
  assert.equal(fallback.statusCode, 200);
  assert.ok(warnings.some((line) => line.includes('store unavailable')));
  globalThis.fetch = originalImport;
} finally {
  console.warn = originalWarn;
  restoreEnv();
  contact._resetRateLimitForTests();
}

console.log('test-contact-send: ok');
