import { randomUUID } from 'node:crypto';
import { safeNextPath } from './auth-redirect.mjs';

export const STUDY_ITEM_TYPES = ['element', 'molecule', 'calculator', 'article'];
export const STUDY_PROGRESS_STATUSES = ['started', 'in_progress', 'completed'];

export const STUDY_LIMITS = {
  bodyBytes: 32768,
  title: 160,
  href: 500,
  note: 5000,
  itemKey: 200,
  lastPosition: 200,
  tags: 10,
  tag: 32,
  payloadBytes: 8192
};

const REJECT = '\u0000';

export function studyError(message, status = 400, code = 'invalid_request') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function safeStudyHref(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (value.length > STUDY_LIMITS.href) {
    throw studyError('href is too long', 400, 'invalid_href');
  }
  const safe = safeNextPath(value, REJECT, 'https://atomurus.com');
  if (!safe || safe === REJECT) {
    throw studyError('href must be an internal path', 400, 'invalid_href');
  }
  return safe.slice(0, STUDY_LIMITS.href);
}

export function clampText(value, max, field, required = false) {
  const text = String(value == null ? '' : value);
  if (required && !text.trim()) {
    throw studyError(`${field} is required`, 400, 'invalid_request');
  }
  if (text.length > max) {
    throw studyError(`${field} is too long`, 400, 'invalid_request');
  }
  return text;
}

export function normalizeTags(raw) {
  const source = Array.isArray(raw) ? raw : [];
  if (source.length > STUDY_LIMITS.tags) {
    throw studyError(`At most ${STUDY_LIMITS.tags} tags are allowed`, 400, 'invalid_request');
  }
  const seen = new Set();
  const tags = [];
  for (const entry of source) {
    const tag = String(entry == null ? '' : entry).trim().replace(/\s+/g, ' ');
    if (!tag) continue;
    if (tag.length > STUDY_LIMITS.tag) {
      throw studyError(`Each tag must be at most ${STUDY_LIMITS.tag} characters`, 400, 'invalid_request');
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length > STUDY_LIMITS.tags) {
      throw studyError(`At most ${STUDY_LIMITS.tags} tags are allowed`, 400, 'invalid_request');
    }
  }
  return tags;
}

export function normalizeItemType(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!STUDY_ITEM_TYPES.includes(value)) {
    throw studyError('itemType is invalid', 400, 'invalid_request');
  }
  return value;
}

export function normalizePayload(raw) {
  if (raw == null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw studyError('payload must be a JSON object', 400, 'invalid_request');
  }
  const encoded = JSON.stringify(raw);
  if (Buffer.byteLength(encoded, 'utf8') > STUDY_LIMITS.payloadBytes) {
    throw studyError('payload is too large', 413, 'payload_too_large');
  }
  return JSON.parse(encoded);
}

export function parseLimit(raw, fallback = 20, max = 100) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(value)));
}

export function encodeStudyCursor(row) {
  if (!row?.id || !row?.updated_at) return null;
  return Buffer.from(`${row.updated_at}|${row.id}`, 'utf8').toString('base64url');
}

export function decodeStudyCursor(raw) {
  if (!raw) return null;
  try {
    const text = Buffer.from(String(raw), 'base64url').toString('utf8');
    const split = text.indexOf('|');
    if (split <= 0) return null;
    return {
      updatedAt: text.slice(0, split),
      id: text.slice(split + 1)
    };
  } catch (_err) {
    return null;
  }
}

export function publicStudyItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemType: row.item_type,
    itemKey: row.item_key,
    title: row.title || '',
    href: row.href || '',
    note: row.note || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function publicStudyProgress(row) {
  if (!row) return null;
  return {
    id: row.id,
    contentType: row.content_type,
    contentKey: row.content_key,
    status: row.status,
    progress: Number(row.progress) || 0,
    lastPosition: row.last_position || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function newCalculatorItemKey() {
  return `run_${randomUUID()}`;
}

export function assertNoClientUserId(body) {
  if (!body || typeof body !== 'object') return;
  if (Object.prototype.hasOwnProperty.call(body, 'user_id') || Object.prototype.hasOwnProperty.call(body, 'userId')) {
    throw studyError('user_id is not allowed', 400, 'invalid_request');
  }
}

export function itemSelect() {
  return 'id,item_type,item_key,title,href,note,tags,payload,created_at,updated_at';
}

export function progressSelect() {
  return 'id,content_type,content_key,status,progress,last_position,created_at,updated_at';
}

export function cursorFilter(cursor) {
  if (!cursor?.updatedAt || !cursor?.id) return '';
  const updated = encodeURIComponent(cursor.updatedAt);
  const id = encodeURIComponent(cursor.id);
  return `and=(updated_at.lt.${updated},and(updated_at.eq.${updated},id.lt.${id}))`;
}

export function tagContainsFilter(tag) {
  const value = String(tag || '').trim();
  if (!value) return '';
  return `tags=cs.{${JSON.stringify(value)}}`;
}

export function notePresentFilter() {
  return 'and=(note.neq.%22%22)';
}
