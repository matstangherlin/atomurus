import {
  json,
  options
} from '../lib/netlify-identity-utils.mjs';
import { viewerMoleculePayload, isSafeMoleculeKey } from '../lib/viewer-molecule-coords.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  let key = '';
  try {
    key = String(new URL(request.url).searchParams.get('key') || '').trim().toLowerCase();
  } catch (_err) {
    key = '';
  }

  if (!isSafeMoleculeKey(key)) {
    return json(400, {
      ok: false,
      error: 'Unknown or invalid molecule key.',
      code: 'invalid_molecule_key'
    });
  }

  const molecule = viewerMoleculePayload(key);
  if (!molecule) {
    return json(404, {
      ok: false,
      error: 'Molecule not found.',
      code: 'molecule_not_found'
    });
  }

  return json(200, { ok: true, molecule });
}
