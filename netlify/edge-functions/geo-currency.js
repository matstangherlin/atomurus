// Tells the page which currency to show before any API call: reais for
// visitors in Brazil, dollars for every other country. The page body is not
// touched, so the static HTML stays cacheable; only a short-lived cookie is
// added. The server re-derives the currency at checkout, so this cookie is a
// display hint and never decides what is charged.
const COOKIE = 'atomurus-geo';

export default async (request, context) => {
  const response = await context.next();
  const code = String(context.geo?.country?.code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return response;
  const currency = code === 'BR' ? 'brl' : 'usd';
  const value = code + '.' + currency;
  const sent = (request.headers.get('cookie') || '').split(/;\s*/).some((part) => part === COOKIE + '=' + value);
  if (sent) return response;
  try {
    response.headers.append('set-cookie', COOKIE + '=' + value + '; Path=/; Max-Age=86400; SameSite=Lax; Secure');
  } catch (_err) {
    // Immutable headers (rare): copy the response so the cookie can be added.
    const copy = new Response(response.body, response);
    copy.headers.append('set-cookie', COOKIE + '=' + value + '; Path=/; Max-Age=86400; SameSite=Lax; Secure');
    return copy;
  }
  return response;
};

export const config = {
  path: ['/', '/index.html', '/index.pt.html', '/pricing', '/pricing.html', '/pricing.pt.html']
};
