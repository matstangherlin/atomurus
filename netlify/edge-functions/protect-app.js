import { appGateDecision } from '../lib/app-gate.mjs';

export default async (request, context) => {
  const decision = appGateDecision(request.url, request.headers.get('cookie') || '');
  if (decision.action === 'redirect') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: decision.location,
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  }
  return context.next();
};
