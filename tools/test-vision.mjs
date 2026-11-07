import assert from 'node:assert/strict';
import {
  buildSystemPrompt, calibrate, identifyImage, normalizeElement, parseDataUrl, parseDetections, precisionTable, VISION_LIMITS
} from '../netlify/lib/vision-identify.mjs';
import { FEATURES } from '../netlify/lib/feature-catalog.mjs';

assert.equal(FEATURES.visionIdentify.access, 'pro', 'camera identification is a Pro feature');

assert.equal(normalizeElement('fe'), 'Fe');
assert.equal(normalizeElement('CU'), 'Cu');
assert.equal(normalizeElement('steel'), '', 'only real symbols pass');
assert.equal(normalizeElement(''), '');

const table = precisionTable([
  { element: 'Fe', correct: true }, { element: 'Fe', correct: true }, { element: 'Fe', correct: true }, { element: 'Fe', correct: true }, { element: 'Fe', correct: false },
  { element: 'Au', correct: false }, { element: 'Au', correct: false }, { element: 'Au', correct: false }, { element: 'Au', correct: false }, { element: 'Au', correct: true },
  { element: 'Cu', correct: true }, { element: 'xx', correct: true }
]);
assert.deepEqual(table.Fe, { right: 4, wrong: 1 });
assert.equal(table.xx, undefined);

// Calibration: with history, the shown confidence moves towards the measured precision.
assert.equal(calibrate(0.9, 'Cu', table).samples, 1, 'too few samples: no adjustment');
assert.equal(calibrate(0.9, 'Cu', table).confidence, 0.9);
const au = calibrate(0.9, 'Au', table);
assert.ok(au.confidence < 0.9 && au.confidence > 0.5, `gold with 20% precision is shown lower (${au.confidence})`);
const fe = calibrate(0.5, 'Fe', table);
assert.ok(fe.confidence > 0.5, `iron with 80% precision is shown higher (${fe.confidence})`);
assert.equal(calibrate(2, '', table).confidence, 1, 'clamped');

// Prompt: language, honesty about estimates, history and corrections.
const promptPt = buildSystemPrompt('pt', table, [{ element: 'Au', label: 'anel', corrected_element: 'Cu' }]);
assert.match(promptPt, /estime pela aparência/);
assert.match(promptPt, /Au: 20% \(5\)/);
assert.match(promptPt, /"anel": não era Au, era Cu/);
assert.doesNotMatch(promptPt, /Cu: /, 'elements below the sample threshold are not listed');
const promptEn = buildSystemPrompt('en', {}, []);
assert.match(promptEn, /estimate from appearance/);
assert.doesNotMatch(promptEn, /Track record/);

// Parsing: clamps, caps and calibrates.
const parsed = parseDetections(JSON.stringify({
  summary: 'ok',
  detections: [
    { element: 'fe', label: 'panela', material: 'aço', x: 0.5, y: 1.4, confidence: 0.7, reason: 'brilho metálico' },
    { element: 'unknownium', label: '?', material: '', x: -1, y: 0.2, confidence: 0.3, reason: '' }
  ]
}), table);
assert.equal(parsed.detections.length, 2);
assert.equal(parsed.detections[0].element, 'Fe');
assert.equal(parsed.detections[0].y, 1);
assert.equal(parsed.detections[1].element, '');
assert.equal(parsed.detections[1].x, 0);
assert.ok(parsed.detections[0].confidence > 0.7, 'iron calibrated upwards');
assert.equal(parsed.detections[0].modelConfidence, 0.7);
assert.throws(() => parseDetections('not json at all', table), /Unreadable/);
const tooMany = parseDetections(JSON.stringify({ summary: '', detections: Array.from({ length: 40 }, () => ({ element: 'C', label: 'x', material: '', x: 0.1, y: 0.1, confidence: 0.5, reason: '' })) }), {});
assert.equal(tooMany.detections.length, VISION_LIMITS.maxDetections);

// End to end with an injected model call: the prompt carries the memory, the answer comes back parsed.
const seen = [];
const out = await identifyImage({ image: 'AAAA', mediaType: 'image/jpeg', lang: 'pt', hint: 'moeda', table, corrections: [] }, {
  createMessage: async (req) => { seen.push(req); return JSON.stringify({ summary: 'Uma moeda.', detections: [{ element: 'Cu', label: 'moeda', material: 'bronze', x: 0.5, y: 0.5, confidence: 0.8, reason: 'cor alaranjada' }] }); }
});
assert.equal(out.detections[0].element, 'Cu');
assert.match(seen[0].userText, /moeda/);
assert.match(seen[0].system, /Fe: 80% \(5\)/);
assert.equal(seen[0].mediaType, 'image/jpeg');

// Image guard.
assert.equal(parseDataUrl('data:image/jpeg;base64,/9j/4AAQ').mediaType, 'image/jpeg');
assert.throws(() => parseDataUrl('data:text/html;base64,AAAA'), /JPEG, PNG or WebP/);
assert.throws(() => parseDataUrl('data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024)), /too large/);

console.log('vision tests passed');
