// GET /api/account/export — «Download my data» (prompt 29, M12-a; LGPD art. 18,
// V). Everything the site keeps about the signed-in user, as one JSON file.
// The rows are read with the user's own session (RLS), so a query can only
// ever see the caller's data; each row is checked again before it is written.
import { createAuthRateLimiter, digestKey } from '../lib/auth-rate-limit.mjs';
import { json, jsonWithCookies, options, statusFromError, tooManyRequests, verifySameOrigin } from '../lib/netlify-identity-utils.mjs';
import { publicUser } from '../lib/plan-access.mjs';
import { requireUser } from '../lib/require-user.mjs';
import { createUserDataClient } from '../lib/supabase-user-db.mjs';

export const EXPORT_SCHEMA_VERSION = 1;
export const EXPORT_MAX_BYTES = 5 * 1024 * 1024;
export const EXPORT_PAGE_SIZE = 500;
const MAX_PAGES = 200;

// Section → tables. Every table here references profiles(id) (see
// tools/test-account-delete.mjs), so this is the whole of the user's data.
export const EXPORT_TABLES = {
  study: ['study_items', 'study_sets', 'study_set_items', 'study_cards', 'study_progress', 'study_review_events'],
  lab: ['pro_lab_sessions']
};

export const exportLimiter = createAuthRateLimiter({ windowMs: 60 * 60 * 1000, limit: 3, maxKeys: 4000 });

const NOTES = {
  en: [
    'Payments are processed by Stripe; card details never reach Atomurus. Invoices and payment history are in the Stripe billing portal (Account → Plan & Billing).',
    'Server logs are not included.',
    'What this browser stores (theme, language, Lab bench) is not on the server; it stays on this device.'
  ],
  pt: [
    'Os pagamentos são processados pela Stripe; os dados do cartão nunca chegam ao Atomurus. Faturas e histórico de pagamento ficam no portal de cobrança da Stripe (Conta → Plano e cobrança).',
    'Os registros (logs) do servidor não estão incluídos.',
    'O que este navegador guarda (tema, idioma, bancada do Lab) não fica no servidor; fica neste aparelho.'
  ]
};

async function allRows(db, table, filter) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { rows: chunk } = await db.select(table, `select=*&${filter}&order=id.asc&limit=${EXPORT_PAGE_SIZE}&offset=${page * EXPORT_PAGE_SIZE}`);
    rows.push(...chunk);
    if (chunk.length < EXPORT_PAGE_SIZE) return rows;
  }
  const err = new Error('Export too large');
  err.status = 413;
  throw err;
}

export function accountSection(user) {
  const pub = publicUser(user);
  return {
    id: pub.id,
    email: pub.email,
    username: pub.username,
    fullName: pub.fullName,
    emailConfirmed: pub.emailConfirmed,
    createdAt: pub.createdAt,
    lastSignInAt: pub.lastSignInAt
  };
}

export function billingSection(user) {
  const pub = publicUser(user);
  // State only: no card data, no Stripe ids.
  return {
    plan: pub.plan,
    planSource: pub.planSource,
    subscriptionStatus: pub.subscriptionStatus,
    trialEndsAt: pub.trialEndsAt,
    billingPeriod: pub.billingPeriod,
    billingCurrency: pub.billingCurrency,
    cancelAtPeriodEnd: pub.cancelAtPeriodEnd,
    currentPeriodEnd: pub.currentPeriodEnd
  };
}

export async function buildExport(db, user, now = new Date()) {
  const userId = user.id;
  const own = (rows, key = 'user_id') => rows.filter((row) => row && row[key] === userId);
  const profileRows = own(await allRows(db, 'profiles', `id=eq.${encodeURIComponent(userId)}`), 'id');
  const sections = {};
  for (const [section, tables] of Object.entries(EXPORT_TABLES)) {
    sections[section] = {};
    for (const table of tables) {
      sections[section][table] = own(await allRows(db, table, `user_id=eq.${encodeURIComponent(userId)}`));
    }
  }
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    site: 'https://atomurus.com',
    notes: NOTES,
    account: accountSection(user),
    profile: profileRows[0] || null,
    study: sections.study,
    lab: sections.lab,
    billing: billingSection(user)
  };
}

export function exportFileName(now = new Date()) {
  return `atomurus-dados-${now.toISOString().slice(0, 10)}.json`;
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  try {
    verifySameOrigin(request);
  } catch (_err) {
    return json(403, { ok: false, error: 'Forbidden' });
  }

  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const cookies = auth.session?.cookieHeaders || [];

  const limited = exportLimiter.hit(digestKey(auth.user.id, 'export'));
  if (!limited.allowed) return tooManyRequests(limited.retryAfter, 'Too many exports. Try again later.');

  try {
    const now = new Date();
    const data = await buildExport(createUserDataClient(auth.session.accessToken), auth.user, now);
    const body = JSON.stringify(data, null, 2);
    if (Buffer.byteLength(body, 'utf8') > EXPORT_MAX_BYTES) {
      return jsonWithCookies(413, { ok: false, error: 'Your data is too large to export here. Write to contato@atomurus.com and we will send it.', code: 'export_too_large' }, cookies);
    }
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportFileName(now)}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    cookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
    return new Response(body, { status: 200, headers });
  } catch (err) {
    const status = statusFromError(err, 500);
    console.error('[account-export] failed:', status);
    return jsonWithCookies(status === 413 ? 413 : 500, {
      ok: false,
      error: status === 413 ? 'Your data is too large to export here. Write to contato@atomurus.com and we will send it.' : 'The export is unavailable right now. Try again later.',
      code: status === 413 ? 'export_too_large' : 'export_failed'
    }, cookies);
  }
}
