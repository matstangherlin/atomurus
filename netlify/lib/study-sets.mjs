import { clampText, parseLimit, studyError } from './study-cloud.mjs';
import { isMastered } from './review-scheduler.mjs';

export const STUDY_SET_LIMITS = {
  title: 120,
  description: 1000,
  front: 1000,
  back: 3000,
  maxSets: 50,
  maxCards: 5000,
  bodyBytes: 32768,
  cardsPage: 20,
  cardsPageMax: 50,
  queueDefault: 20,
  queueMax: 50,
  focusLimits: [10, 20, 30],
  focusDefault: 20,
  focusFetchCap: 200
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || '').trim());
}

export function requireUuid(value, field = 'id') {
  const text = String(value || '').trim();
  if (!isUuid(text)) throw studyError(`${field} is invalid`, 400, 'invalid_request');
  return text;
}

export function normalizeTitle(raw) {
  return clampText(raw, STUDY_SET_LIMITS.title, 'title', true).trim();
}

export function normalizeDescription(raw) {
  return clampText(raw == null ? '' : raw, STUDY_SET_LIMITS.description, 'description');
}

export function normalizeCardText(raw, field, max, required = true) {
  const text = clampText(raw, max, field, required);
  return text.replace(/\u0000/g, '');
}

export function quotaExceeded(kind) {
  return studyError(`${kind} quota exceeded`, 409, 'quota_exceeded');
}

export function setSelect() {
  return 'id,title,description,created_at,updated_at,archived_at';
}

export function cardSelect() {
  return [
    'id',
    'study_set_id',
    'source_item_id',
    'front',
    'back',
    'card_type',
    'template_key',
    'due_at',
    'interval_days',
    'ease_factor',
    'repetitions',
    'lapses',
    'review_state',
    'version',
    'suspended',
    'created_at',
    'updated_at'
  ].join(',');
}

export function publicStudySet(row, extra = {}) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    ...extra
  };
}

export function publicStudyCard(row, { includeBack = true } = {}) {
  if (!row) return null;
  const intervalDays = Number(row.interval_days) || 0;
  const card = {
    id: row.id,
    studySetId: row.study_set_id,
    sourceItemId: row.source_item_id || null,
    front: row.front || '',
    cardType: row.card_type,
    templateKey: row.template_key,
    dueAt: row.due_at,
    intervalDays,
    easeFactor: Number(row.ease_factor),
    repetitions: Number(row.repetitions) || 0,
    lapses: Number(row.lapses) || 0,
    reviewState: row.review_state,
    version: Number(row.version) || 1,
    suspended: Boolean(row.suspended),
    mastered: isMastered(intervalDays),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includeBack) card.back = row.back || '';
  return card;
}

export function publicSetItem(row, item) {
  return {
    id: row.id,
    itemId: row.item_id,
    createdAt: row.created_at,
    item: item || null
  };
}

export function parseQueueLimit(raw) {
  return parseLimit(raw, STUDY_SET_LIMITS.queueDefault, STUDY_SET_LIMITS.queueMax);
}

export function parseFocusLimit(raw) {
  if (raw == null || raw === '') return STUDY_SET_LIMITS.focusDefault;
  const n = Number(raw);
  if (STUDY_SET_LIMITS.focusLimits.includes(n)) return n;
  return STUDY_SET_LIMITS.focusDefault;
}

export function parseQueueMode(raw) {
  const mode = String(raw || 'due').trim().toLowerCase();
  if (mode === 'due' || mode === 'weak') return mode;
  const err = studyError('mode must be due or weak', 400, 'invalid_request');
  throw err;
}

export function encodeCardCursor(row) {
  if (!row?.id || !row?.created_at) return null;
  return Buffer.from(`${row.created_at}|${row.id}`, 'utf8').toString('base64url');
}

export function decodeCardCursor(raw) {
  if (!raw) return null;
  try {
    const text = Buffer.from(String(raw), 'base64url').toString('utf8');
    const split = text.indexOf('|');
    if (split <= 0) return null;
    return { createdAt: text.slice(0, split), id: text.slice(split + 1) };
  } catch (_err) {
    return null;
  }
}

export function cardCursorFilter(cursor) {
  if (!cursor?.createdAt || !cursor?.id) return '';
  const created = encodeURIComponent(cursor.createdAt);
  const id = encodeURIComponent(cursor.id);
  return `and=(created_at.lt.${created},and(created_at.eq.${created},id.lt.${id}))`;
}

export function mapReviewStoreError(err) {
  const code = String(err?.code || '');
  const message = String(err?.message || '');
  if (code === 'P0002' || message.includes('review_conflict')) {
    err.status = 409;
    err.code = 'review_conflict';
    err.message = 'This card was already reviewed in another tab.';
    return err;
  }
  if (code === 'P0001' || message.includes('not_found')) {
    err.status = 404;
    err.code = 'not_found';
    err.message = 'Card not found';
    return err;
  }
  if (code === 'P0003' || message.includes('card_suspended')) {
    err.status = 409;
    err.code = 'card_suspended';
    err.message = 'Card is suspended';
    return err;
  }
  if (code === '42501' || message.includes('not_authenticated')) {
    err.status = 401;
    err.code = 'session_expired';
    return err;
  }
  if (code === '23503') {
    err.status = 404;
    err.code = 'not_found';
    err.message = 'Related study record was not found';
    return err;
  }
  if (code === '23505' && /client_event/i.test(message)) {
    err.status = 200;
    err.code = 'idempotent';
    return err;
  }
  if (code === '22023' || message.includes('invalid_rating')) {
    err.status = 400;
    err.code = 'invalid_rating';
    return err;
  }
  return err;
}

export function queueRank(card, nowMs) {
  const due = Date.parse(card.due_at);
  const dueMs = Number.isFinite(due) ? due : nowMs;
  if (card.review_state === 'new') return 2;
  if (dueMs < nowMs) return 0;
  return 1;
}

export function sortQueue(cards, nowMs) {
  return [...cards].sort((a, b) => {
    const rank = queueRank(a, nowMs) - queueRank(b, nowMs);
    if (rank) return rank;
    const due = String(a.due_at || '').localeCompare(String(b.due_at || ''));
    if (due) return due;
    return String(a.id).localeCompare(String(b.id));
  });
}
