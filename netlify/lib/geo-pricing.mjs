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

export function countryFromRequest(request) {
  return normalizeCountry(
    request.headers.get('x-country') ||
    request.headers.get('x-nf-geo-country') ||
    request.headers.get('cf-ipcountry')
  );
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

export function resolvePricingContext(request, overrides = {}) {
  const country = normalizeCountry(overrides.country) || countryFromRequest(request);
  const language = normalizeLanguage(overrides.language) || languageFromRequest(request);
  const explicitCurrency = String(overrides.currency || '').trim().toLowerCase();
  const currency = explicitCurrency === 'brl' || explicitCurrency === 'usd'
    ? explicitCurrency
    : (BR_COUNTRIES.has(country) || language === 'pt' ? 'brl' : 'usd');

  return {
    country: country || null,
    language,
    currency,
    source: country ? 'geo' : (language === 'pt' ? 'language' : 'default')
  };
}

export function normalizeBillingPeriod(value) {
  const period = String(value || '').trim().toLowerCase();
  return period === 'annual' ? 'annual' : 'monthly';
}
