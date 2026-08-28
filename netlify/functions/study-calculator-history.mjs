import { requireFeature } from '../lib/require-feature.mjs';
import {
  json,
  jsonWithCookies,
  options,
  readJsonBody,
  statusFromError
} from '../lib/netlify-identity-utils.mjs';
import { createUserDataClient, ensureOwnProfile } from '../lib/supabase-user-db.mjs';
import {
  assertNoClientUserId,
  clampText,
  newCalculatorItemKey,
  normalizePayload,
  normalizeTags,
  publicStudyItem,
  safeStudyHref,
  STUDY_LIMITS,
  studyError
} from '../lib/study-cloud.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return options();
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const auth = await requireFeature(request, 'studyCloud');
  if (auth.response) return auth.response;

  try {
    const body = await readJsonBody(request, STUDY_LIMITS.bodyBytes);
    assertNoClientUserId(body);

    const calculator = clampText(body.calculator || body.itemKey || 'calculator', 80, 'calculator', true).trim();
    const title = clampText(body.title || calculator, STUDY_LIMITS.title, 'title');
    const href = safeStudyHref(body.href || '/calculators');
    const unit = clampText(body.unit, 32, 'unit');
    const result = clampText(body.result, 500, 'result');
    const payload = normalizePayload({
      calculator,
      inputs: body.inputs && typeof body.inputs === 'object' ? body.inputs : {},
      result,
      unit,
      ...(body.payload && typeof body.payload === 'object' ? body.payload : {})
    });

    const db = createUserDataClient(auth.session.accessToken);
    await ensureOwnProfile(db, auth.user);

    const saved = await db.insert('study_items', {
      user_id: auth.user.id,
      item_type: 'calculator',
      item_key: newCalculatorItemKey(),
      title,
      href,
      note: '',
      tags: normalizeTags(body.tags),
      payload
    });

    return jsonWithCookies(200, { ok: true, item: publicStudyItem(saved) }, auth.session?.cookieHeaders || []);
  } catch (err) {
    const status = statusFromError(err, 500);
    return jsonWithCookies(status, {
      ok: false,
      error: status >= 500 ? 'Study Cloud is unavailable right now.' : err.message,
      code: err.code || null
    }, auth.session?.cookieHeaders || []);
  }
}
