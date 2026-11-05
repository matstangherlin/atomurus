const BR_COUNTRIES = new Set(['BR']);

function normalizeCountry(value) {
  const country = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

function normalizeLanguage(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('pt')) return 'pt';
  if (raw.startsWith('en')) return 'en';
  return null;
}

function countryFromGeoHeader(value) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(String(value), 'base64').toString('utf8'));
    return normalizeCountry(decoded?.country?.code);
  } catch (_err) {
    return null;
  }
}

// Netlify passes the visitor's country on `context.geo` and, for older
// runtimes, in x-country / x-nf-geo. Cloudflare's header is a fallback.
export function countryFromRequest(request, context) {
  return normalizeCountry(context?.geo?.country?.code) ||
    normalizeCountry(request.headers.get('x-country')) ||
    countryFromGeoHeader(request.headers.get('x-nf-geo')) ||
    normalizeCountry(request.headers.get('x-nf-geo-country')) ||
    normalizeCountry(request.headers.get('cf-ipcountry'));
}

export function languageFromRequest(request) {
  const explicit = normalizeLanguage(new URL(request.url).searchParams.get('lang'));
  if (explicit) return explicit;

  const preferred = String(request.headers.get('accept-language') || '')
    .split(',')
    .map((part) => normalizeLanguage(part.split(';')[0]))
    .find(Boolean);

  return preferred || 'en';
}

// Currency follows the visitor's country only: reais inside Brazil, dollars
// everywhere else, whatever the page language. Language is a fallback for
// requests with no country at all (local dev, unknown networks).
export function currencyForCountry(country, language) {
  if (country) return BR_COUNTRIES.has(country) ? 'brl' : 'usd';
  return language === 'pt' ? 'brl' : 'usd';
}

export function resolvePricingContext(request, overrides = {}, context) {
  const country = normalizeCountry(overrides.country) || countryFromRequest(request, context);
  const language = normalizeLanguage(overrides.language) || languageFromRequest(request);
  return {
    country: country || null,
    language,
    currency: currencyForCountry(country, language),
    source: country ? 'geo' : (language === 'pt' ? 'language' : 'default')
  };
}

export function normalizeBillingPeriod(value) {
  const period = String(value || '').trim().toLowerCase();
  return period === 'annual' ? 'annual' : 'monthly';
}
