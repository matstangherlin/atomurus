import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options
} from '../lib/netlify-identity-utils.mjs';
import { viewerMoleculePayload, isSafeMoleculeKey } from '../lib/viewer-molecule-coords.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const auth = await requireFeature(request, 'moleculeViewer');
  if (auth.response) return auth.response;

  let key = '';
  try {
    key = String(new URL(request.url).searchParams.get('key') || '').trim().toLowerCase();
  } catch (_err) {
    key = '';
  }

  if (!isSafeMoleculeKey(key)) {
    return jsonWithCookies(400, {
      ok: false,
      error: 'Unknown or invalid molecule key.',
      code: 'invalid_molecule_key'
    }, auth.session?.cookieHeaders || []);
  }

  const molecule = viewerMoleculePayload(key);
  if (!molecule) {
    return jsonWithCookies(404, {
      ok: false,
      error: 'Molecule not found.',
      code: 'molecule_not_found'
    }, auth.session?.cookieHeaders || []);
  }

  return jsonWithCookies(200, { ok: true, molecule }, auth.session?.cookieHeaders || []);
}
