import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { assertNoClientUserId } from '../lib/study-cloud.mjs';
import { canonicalElement, normalizeAtomicNumbers } from '../lib/canonical-elements.mjs';
import { PRO_LAB_LIMITS } from '../lib/pro-lab.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'advancedAtomicCompare');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, PRO_LAB_LIMITS.bodyBytes);
    assertNoClientUserId(body);
    const lang = String(body.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    const numbers = normalizeAtomicNumbers(body.atomicNumbers || body.elements, 2);
    const elements = numbers.map((z) => {
      const el = canonicalElement(z, lang);
      if (!el) throw new Error(`unknown element ${z}`);
      return {
        atomicNumber: el.atomicNumber,
        symbol: el.symbol,
        name: el.name,
        latin: el.latin,
        href: el.href,
        itemKey: el.itemKey,
        electronConfig: el.electronConfig,
        shells: el.shells,
        period: el.period,
        group: el.group,
        category: el.category
      };
    });
    return jsonWithCookies(200, { ok: true, elements }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Pro Lab is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
