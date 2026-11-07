/**
 * Vision identify (Pro): estimate which chemical elements / materials are
 * visible in a photo, with a point per finding, and learn from feedback.
 *
 * Honest framing — a photo cannot prove an element. The model estimates from
 * appearance (colour, lustre, context) and says so. "Learning" here is a
 * feedback memory: every ✓/✗ the user gives is stored; the next requests get
 * (1) the measured precision per element, used to calibrate the confidence
 * shown, and (2) recent corrections as examples in the prompt. No weights are
 * trained on the user's phone.
 */
import Anthropic from '@anthropic-ai/sdk';

export const VISION_LIMITS = Object.freeze({
  bodyBytes: 7 * 1024 * 1024,     // base64 JPEG from a phone, after client-side resize
  imageBytes: 5 * 1024 * 1024,
  maxDetections: 12,
  feedbackExamples: 24,
  statsMinSamples: 5
});

export const VISION_MODEL = 'claude-opus-5-5';

const ELEMENT_RE = /^(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Sc|Ti|V|Cr|Mn|Fe|Co|Ni|Cu|Zn|Ga|Ge|As|Se|Br|Kr|Rb|Sr|Y|Zr|Nb|Mo|Tc|Ru|Rh|Pd|Ag|Cd|In|Sn|Sb|Te|I|Xe|Cs|Ba|La|Ce|Pr|Nd|Pm|Sm|Eu|Gd|Tb|Dy|Ho|Er|Tm|Yb|Lu|Hf|Ta|W|Re|Os|Ir|Pt|Au|Hg|Tl|Pb|Bi|Po|At|Rn|Fr|Ra|Ac|Th|Pa|U|Np|Pu|Am|Cm|Bk|Cf|Es|Fm|Md|No|Lr|Rf|Db|Sg|Bh|Hs|Mt|Ds|Rg|Cn|Nh|Fl|Mc|Lv|Ts|Og)$/;

export const DETECTION_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['detections', 'summary'],
  properties: {
    summary: { type: 'string', description: 'One sentence on what the photo shows and how reliable the estimate is.' },
    /* Structured outputs accept only basic JSON Schema: no maxItems, minimum or
       maximum (the API rejects them with a 400). Limits live in the description
       and are enforced in parseDetections. */
    detections: {
      type: 'array',
      description: `At most ${VISION_LIMITS.maxDetections} detections, the most relevant first.`,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['element', 'label', 'material', 'x', 'y', 'confidence', 'reason'],
        properties: {
          element: { type: 'string', description: 'Chemical symbol of the main element in that spot (e.g. Fe, Cu, Al, C, Si, Au). Empty string if no single element dominates.' },
          label: { type: 'string', description: 'Short name of the object or region in the photo, in the user language.' },
          material: { type: 'string', description: 'The material or compound the element is in (e.g. aço inoxidável, latão, vidro, grafite).' },
          x: { type: 'number', description: 'Horizontal position of the point, between 0 (left edge) and 1 (right edge).' },
          y: { type: 'number', description: 'Vertical position of the point, between 0 (top edge) and 1 (bottom edge).' },
          confidence: { type: 'number', description: 'How sure you are, from appearance alone, between 0 and 1.' },
          reason: { type: 'string', description: 'What in the image supports it, in the user language. One sentence.' }
        }
      }
    }
  }
});

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function normalizeElement(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const fixed = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return ELEMENT_RE.test(fixed) ? fixed : '';
}

/* Precision per element from stored feedback: { Fe: { right: 8, wrong: 2 } }. */
export function precisionTable(feedbackRows) {
  const table = {};
  for (const row of feedbackRows || []) {
    const el = normalizeElement(row.element);
    if (!el) continue;
    table[el] = table[el] || { right: 0, wrong: 0 };
    if (row.correct) table[el].right += 1;
    else table[el].wrong += 1;
  }
  return table;
}

/* Shown confidence = model confidence blended with the measured precision for
   that element once there are enough samples. */
export function calibrate(confidence, element, table, minSamples = VISION_LIMITS.statsMinSamples) {
  const c = clamp01(confidence);
  const stat = element && table ? table[element] : null;
  if (!stat) return { confidence: c, samples: 0, precision: null };
  const n = stat.right + stat.wrong;
  if (n < minSamples) return { confidence: c, samples: n, precision: null };
  const precision = stat.right / n;
  const weight = Math.min(0.6, n / (n + 10));
  return { confidence: clamp01(c * (1 - weight) + precision * weight), samples: n, precision };
}

export function buildSystemPrompt(lang, table, corrections) {
  const pt = lang === 'pt';
  const lines = [];
  lines.push(pt
    ? 'Você é o identificador de elementos do Atomurus, um app educacional de química. O usuário fotografa um objeto ou cena e quer saber quais elementos químicos provavelmente estão ali.'
    : 'You are the element identifier of Atomurus, an educational chemistry app. The user photographs an object or scene and wants to know which chemical elements are probably there.');
  lines.push(pt
    ? 'Uma foto não prova composição: estime pela aparência (cor, brilho, textura, contexto, rótulos visíveis) e diga isso com clareza na confiança. Prefira o elemento dominante do material (aço → Fe, latão → Cu, lata de refrigerante → Al, lápis → C, vidro → Si, joia amarela → Au ou latão). Não invente elementos para regiões ambíguas: nesses casos use confiança baixa ou omita.'
    : 'A photo cannot prove composition: estimate from appearance (colour, lustre, texture, context, visible labels) and make that clear in the confidence. Prefer the dominant element of the material (steel → Fe, brass → Cu, soda can → Al, pencil → C, glass → Si, yellow jewellery → Au or brass). Do not invent elements for ambiguous regions: use low confidence or leave them out.');
  lines.push(pt
    ? `Marque de 1 a ${VISION_LIMITS.maxDetections} pontos, cada um no centro do objeto ou região (x e y de 0 a 1). Responda em português do Brasil.`
    : `Mark 1 to ${VISION_LIMITS.maxDetections} points, each at the centre of the object or region (x and y from 0 to 1). Answer in English.`);
  const stats = Object.entries(table || {})
    .map(([el, s]) => ({ el, n: s.right + s.wrong, p: s.right / Math.max(1, s.right + s.wrong) }))
    .filter((r) => r.n >= VISION_LIMITS.statsMinSamples)
    .sort((a, b) => b.n - a.n)
    .slice(0, 20);
  if (stats.length) {
    lines.push(pt
      ? 'Histórico de acertos confirmado pelos usuários (precisão por elemento quando você o apontou):'
      : 'Track record confirmed by users (precision per element when you pointed at it):');
    lines.push(stats.map((r) => `${r.el}: ${Math.round(r.p * 100)}% (${r.n})`).join(', '));
    lines.push(pt
      ? 'Seja mais cauteloso com elementos de precisão baixa.'
      : 'Be more cautious with low-precision elements.');
  }
  if (corrections && corrections.length) {
    lines.push(pt ? 'Correções recentes dos usuários (aprenda com elas):' : 'Recent user corrections (learn from them):');
    for (const c of corrections.slice(0, VISION_LIMITS.feedbackExamples)) {
      const from = normalizeElement(c.element) || '?';
      const to = normalizeElement(c.corrected_element);
      const what = String(c.label || '').slice(0, 80);
      lines.push(to ? `- "${what}": ${pt ? 'não era' : 'was not'} ${from}, ${pt ? 'era' : 'it was'} ${to}` : `- "${what}": ${pt ? 'não era' : 'was not'} ${from}`);
    }
  }
  return lines.join('\n');
}

export function parseDetections(text, table) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (_err) {
    const m = String(text || '').match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  }
  if (!data || !Array.isArray(data.detections)) throw Object.assign(new Error('Unreadable answer from the model'), { status: 502, code: 'vision_bad_answer' });
  const detections = data.detections.slice(0, VISION_LIMITS.maxDetections).map((d, i) => {
    const element = normalizeElement(d.element);
    const cal = calibrate(d.confidence, element, table);
    return {
      index: i,
      element,
      label: String(d.label || '').slice(0, 80),
      material: String(d.material || '').slice(0, 80),
      x: clamp01(d.x),
      y: clamp01(d.y),
      confidence: Math.round(cal.confidence * 100) / 100,
      modelConfidence: Math.round(clamp01(d.confidence) * 100) / 100,
      samples: cal.samples,
      reason: String(d.reason || '').slice(0, 240)
    };
  });
  return { summary: String(data.summary || '').slice(0, 300), detections };
}

/* Runs one identification. `deps.createMessage` can be injected for tests. */
export async function identifyImage({ image, mediaType, lang, hint, table, corrections }, deps = {}) {
  const createMessage = deps.createMessage || defaultCreateMessage;
  const system = buildSystemPrompt(lang, table, corrections);
  const userText = lang === 'pt'
    ? 'Quais elementos químicos provavelmente aparecem nesta foto?' + (hint ? ` Contexto do usuário: ${hint}` : '')
    : 'Which chemical elements probably appear in this photo?' + (hint ? ` User context: ${hint}` : '');
  const text = await createMessage({ system, image, mediaType, userText });
  return parseDetections(text, table);
}

let client = null;
async function defaultCreateMessage({ system, image, mediaType, userText }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error('Vision is not configured'), { status: 503, code: 'vision_not_configured' });
  }
  client = client || new Anthropic();
  let response;
  try {
    response = await client.messages.create({
    model: VISION_MODEL,
    max_tokens: 4000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: DETECTION_SCHEMA } },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
        { type: 'text', text: userText }
      ]
    }]
    });
  } catch (err) {
    /* Never echo the provider's error to the browser: it names request ids
       and schema internals. Log it and answer with a generic upstream error. */
    console.error('vision-identify upstream error', err && err.status, err && err.message);
    const status = err instanceof Anthropic.RateLimitError ? 429 : 502;
    throw Object.assign(new Error('Vision is unavailable right now.'), { status, code: status === 429 ? 'vision_busy' : 'vision_upstream' });
  }
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('The model declined to analyse this photo'), { status: 422, code: 'vision_refused' });
  }
  return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export function parseDataUrl(raw) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(raw || ''));
  if (!m) throw Object.assign(new Error('Send a JPEG, PNG or WebP photo'), { status: 400, code: 'vision_bad_image' });
  const bytes = Math.floor(m[2].length * 3 / 4);
  if (bytes > VISION_LIMITS.imageBytes) throw Object.assign(new Error('Photo too large (max 5 MB)'), { status: 413, code: 'vision_image_too_large' });
  return { mediaType: m[1], data: m[2], bytes };
}
