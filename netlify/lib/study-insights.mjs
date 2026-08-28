/**
 * Study Insights + Focus Review ranking (server-only).
 *
 * Day buckets: calendar dates in a validated IANA time zone. Review events
 * are stored as UTC timestamps and grouped in JavaScript — timezone is never
 * interpolated into SQL.
 *
 * Mastered: intervalDays >= MASTERED_INTERVAL_DAYS (same as Smart Review).
 *
 * Confident reviews: (Good + Easy) / total ratings. This is not a
 * correctness rate — Smart Review grades are self-ratings.
 *
 * Weakness score (internal only, never returned to clients):
 *   (lapses * 100)
 *   + ((MAX_EASE - easeFactor) * 20)
 *   + max(0, overdueDays) * 2
 *   + (intervalDays < 1 ? 8 : 0)
 *   + (reviewState === 'learning' ? 5 : 0)
 *
 * Needs attention / Focus Review (not ordinary Due review):
 *   not suspended AND (lapses > 0 OR ease < DEFAULT_EASE OR learning).
 *   Due cards with default ease and no lapses stay on Due review.
 *
 * Focus / Needs attention sort (exposed order):
 *   lapses DESC, ease_factor ASC, due_at ASC, id ASC
 */

import { studyError } from './study-cloud.mjs';
import {
  DEFAULT_EASE,
  MASTERED_INTERVAL_DAYS,
  MAX_EASE,
  isMastered
} from './review-scheduler.mjs';

export const INSIGHTS_RANGES = ['7d', '30d'];
export const DEFAULT_INSIGHTS_RANGE = '30d';
export const DEFAULT_INSIGHTS_TZ = 'UTC';
export const WEAK_CARDS_DASHBOARD = 5;
export const DUE_FORECAST_DAYS = 7;
export const CONSISTENCY_WINDOW_DAYS = 14;
export const INSIGHTS_EVENT_CAP = 8000;
export const INSIGHTS_CARD_CAP = 5000;

const TZ_RE = /^[A-Za-z0-9_+\-\/]+$/;
const MS_DAY = 24 * 60 * 60 * 1000;

export function parseInsightsRange(raw) {
  if (raw == null || String(raw).trim() === '') return DEFAULT_INSIGHTS_RANGE;
  const value = String(raw).trim().toLowerCase();
  if (INSIGHTS_RANGES.includes(value)) return value;
  throw studyError('range must be 7d or 30d', 400, 'invalid_request');
}

export function parseInsightsTimezone(raw) {
  const tz = String(raw == null || String(raw).trim() === '' ? DEFAULT_INSIGHTS_TZ : raw).trim();
  if (tz.length > 64 || !TZ_RE.test(tz)) return DEFAULT_INSIGHTS_TZ;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return tz;
  } catch (_err) {
    return DEFAULT_INSIGHTS_TZ;
  }
}

export function rangeDayCount(range) {
  return range === '7d' ? 7 : 30;
}

function zonedOffsetMs(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

export function zonedYmd(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day)
  };
}

export function zonedMidnightUtcMs(y, m, d, timeZone) {
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offset = zonedOffsetMs(noon, timeZone);
  return Date.UTC(y, m - 1, d) - offset;
}

export function addCalendarDays(ymd, delta) {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + delta));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function formatYmd(ymd) {
  return `${ymd.y}-${String(ymd.m).padStart(2, '0')}-${String(ymd.d).padStart(2, '0')}`;
}

export function rangeWindow(range, now = new Date(), timeZone = DEFAULT_INSIGHTS_TZ) {
  const days = rangeDayCount(range);
  const today = zonedYmd(now, timeZone);
  const startYmd = addCalendarDays(today, -(days - 1));
  const endYmd = addCalendarDays(today, 1);
  const startMs = zonedMidnightUtcMs(startYmd.y, startYmd.m, startYmd.d, timeZone);
  const endMs = zonedMidnightUtcMs(endYmd.y, endYmd.m, endYmd.d, timeZone);
  return {
    range,
    timeZone,
    days,
    today,
    startYmd,
    endYmd,
    startMs,
    endMs,
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString()
  };
}

export function dayKey(iso, timeZone = DEFAULT_INSIGHTS_TZ) {
  const at = iso instanceof Date ? iso : new Date(iso);
  if (!Number.isFinite(at.getTime())) return null;
  return formatYmd(zonedYmd(at, timeZone));
}

export function weekdayKey(ymd, timeZone = DEFAULT_INSIGHTS_TZ) {
  const ms = zonedMidnightUtcMs(ymd.y, ymd.m, ymd.d, timeZone) + 12 * 60 * 60 * 1000;
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(ms));
  return String(weekday || '').toLowerCase().slice(0, 3);
}

export function needsAttention(card, nowMs = Date.now()) {
  if (card && (card.suspended === true || card.suspended === 'true')) return false;
  const lapses = Number(card?.lapses) || 0;
  const ease = Number(card?.ease_factor ?? card?.easeFactor);
  const easeFactor = Number.isFinite(ease) ? ease : DEFAULT_EASE;
  const state = String(card?.review_state || card?.reviewState || '').toLowerCase();
  if (lapses > 0) return true;
  if (easeFactor < DEFAULT_EASE) return true;
  if (state === 'learning') return true;
  return false;
}

export function weaknessScore(card, nowMs = Date.now()) {
  const lapses = Number(card?.lapses) || 0;
  const ease = Number(card?.ease_factor ?? card?.easeFactor);
  const easeFactor = Number.isFinite(ease) ? ease : DEFAULT_EASE;
  const interval = Number(card?.interval_days ?? card?.intervalDays) || 0;
  const state = String(card?.review_state || card?.reviewState || '').toLowerCase();
  const due = Date.parse(card?.due_at || card?.dueAt);
  const overdueDays = Number.isFinite(due) && due < nowMs ? (nowMs - due) / MS_DAY : 0;
  return (
    lapses * 100
    + (MAX_EASE - easeFactor) * 20
    + Math.max(0, overdueDays) * 2
    + (interval < 1 ? 8 : 0)
    + (state === 'learning' ? 5 : 0)
  );
}

export function compareWeakCards(a, b) {
  const lapseDiff = (Number(b?.lapses) || 0) - (Number(a?.lapses) || 0);
  if (lapseDiff) return lapseDiff;
  const easeA = Number(a?.ease_factor ?? a?.easeFactor);
  const easeB = Number(b?.ease_factor ?? b?.easeFactor);
  const left = Number.isFinite(easeA) ? easeA : DEFAULT_EASE;
  const right = Number.isFinite(easeB) ? easeB : DEFAULT_EASE;
  if (left !== right) return left - right;
  const dueA = String(a?.due_at || a?.dueAt || '');
  const dueB = String(b?.due_at || b?.dueAt || '');
  if (dueA !== dueB) return dueA < dueB ? -1 : 1;
  return String(a?.id || '').localeCompare(String(b?.id || ''));
}

export function pickWeakCards(cards, { nowMs = Date.now(), limit = WEAK_CARDS_DASHBOARD } = {}) {
  return [...(cards || [])]
    .filter((card) => needsAttention(card, nowMs))
    .sort(compareWeakCards)
    .slice(0, Math.max(0, limit));
}

function ratingOf(event) {
  return String(event?.rating || '').toLowerCase();
}

export function aggregateRatings(events) {
  const ratings = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const event of events || []) {
    const key = ratingOf(event);
    if (key in ratings) ratings[key] += 1;
  }
  const total = ratings.again + ratings.hard + ratings.good + ratings.easy;
  const confidentReviews = total ? (ratings.good + ratings.easy) / total : 0;
  return { ratings, total, confidentReviews };
}

export function activitySeries(events, window) {
  const counts = new Map();
  for (const event of events || []) {
    const key = dayKey(event.reviewed_at || event.reviewedAt, window.timeZone);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const series = [];
  for (let i = 0; i < window.days; i += 1) {
    const ymd = addCalendarDays(window.startYmd, i);
    const date = formatYmd(ymd);
    series.push({
      date,
      weekday: weekdayKey(ymd, window.timeZone),
      reviews: counts.get(date) || 0
    });
  }
  return series;
}

export function activeDayCount(activity) {
  return (activity || []).filter((row) => row.reviews > 0).length;
}

export function consistencyWindow(activity, days = CONSISTENCY_WINDOW_DAYS) {
  const slice = (activity || []).slice(-days);
  return {
    windowDays: slice.length,
    activeDays: slice.filter((row) => row.reviews > 0).length
  };
}

export function dueForecast(cards, now, timeZone = DEFAULT_INSIGHTS_TZ) {
  const today = zonedYmd(now, timeZone);
  const nowMs = now.getTime();
  const buckets = [];
  for (let i = 0; i < DUE_FORECAST_DAYS; i += 1) {
    const ymd = addCalendarDays(today, i);
    const start = zonedMidnightUtcMs(ymd.y, ymd.m, ymd.d, timeZone);
    const next = addCalendarDays(ymd, 1);
    const end = zonedMidnightUtcMs(next.y, next.m, next.d, timeZone);
    buckets.push({
      date: formatYmd(ymd),
      weekday: weekdayKey(ymd, timeZone),
      kind: i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'weekday',
      startMs: start,
      endMs: end,
      due: 0
    });
  }
  for (const card of cards || []) {
    if (card.suspended) continue;
    const due = Date.parse(card.due_at || card.dueAt);
    if (!Number.isFinite(due)) continue;
    let placed = false;
    for (const bucket of buckets) {
      const inDay = due >= bucket.startMs && due < bucket.endMs;
      const overdueToday = bucket.kind === 'today' && due < nowMs;
      if (inDay || overdueToday) {
        bucket.due += 1;
        placed = true;
        break;
      }
    }
    if (!placed && due < buckets[0].startMs) buckets[0].due += 1;
  }
  return buckets.map(({ startMs, endMs, ...row }) => row);
}

export function cardKindCounts(cards, nowMs = Date.now()) {
  let total = 0;
  let mastered = 0;
  let learning = 0;
  let neu = 0;
  let due = 0;
  let attention = 0;
  for (const card of cards || []) {
    if (card.suspended) continue;
    total += 1;
    const interval = Number(card.interval_days ?? card.intervalDays) || 0;
    const state = String(card.review_state || card.reviewState || '').toLowerCase();
    const dueAt = Date.parse(card.due_at || card.dueAt);
    if (isMastered(interval)) mastered += 1;
    if (state === 'learning') learning += 1;
    if (state === 'new') neu += 1;
    if (Number.isFinite(dueAt) && dueAt <= nowMs) due += 1;
    if (needsAttention(card, nowMs)) attention += 1;
  }
  return {
    totalCards: total,
    masteredCards: mastered,
    learningCards: learning,
    newCards: neu,
    dueNow: due,
    needsAttention: attention,
    masteredPercent: total ? Math.round((mastered / total) * 100) : null
  };
}

export function publicWeakCard(card, nowMs = Date.now(), setTitle = '') {
  const dueAt = card.due_at || card.dueAt || null;
  const dueMs = Date.parse(dueAt);
  const state = String(card.review_state || card.reviewState || 'new');
  return {
    id: card.id,
    studySetId: card.study_set_id || card.studySetId || null,
    studySetTitle: setTitle || '',
    front: card.front || '',
    lapses: Number(card.lapses) || 0,
    reviewState: state,
    dueAt,
    dueNow: Number.isFinite(dueMs) && dueMs <= nowMs
  };
}

export function setInsights(sets, cards, events, nowMs = Date.now()) {
  const bySet = new Map();
  for (const set of sets || []) {
    bySet.set(set.id, {
      id: set.id,
      title: set.title || '',
      cards: [],
      reviews: 0
    });
  }
  const cardToSet = new Map();
  for (const card of cards || []) {
    const setId = card.study_set_id || card.studySetId;
    cardToSet.set(card.id, setId);
    const bucket = bySet.get(setId);
    if (bucket) bucket.cards.push(card);
  }
  for (const event of events || []) {
    const setId = cardToSet.get(event.card_id || event.cardId);
    const bucket = bySet.get(setId);
    if (bucket) bucket.reviews += 1;
  }
  return [...bySet.values()].map((row) => {
    const counts = cardKindCounts(row.cards, nowMs);
    return {
      id: row.id,
      title: row.title,
      totalCards: counts.totalCards,
      mastered: counts.masteredCards,
      learning: counts.learningCards,
      newCards: counts.newCards,
      due: counts.dueNow,
      reviews: row.reviews,
      needsAttention: counts.needsAttention,
      masteredPercent: counts.masteredPercent
    };
  });
}

export function buildInsightsPayload({
  range,
  timeZone,
  now,
  events,
  cards,
  sets
}) {
  const at = now instanceof Date ? now : new Date(now);
  const window = rangeWindow(range, at, timeZone);
  const inRange = (events || []).filter((event) => {
    const t = Date.parse(event.reviewed_at || event.reviewedAt);
    return Number.isFinite(t) && t >= window.startMs && t < window.endMs;
  });
  const { ratings, total, confidentReviews } = aggregateRatings(inRange);
  const activity = activitySeries(inRange, window);
  const counts = cardKindCounts(cards, at.getTime());
  const setRows = setInsights(sets, cards, inRange, at.getTime());
  const titles = new Map(setRows.map((row) => [row.id, row.title]));
  const weak = pickWeakCards(cards, { nowMs: at.getTime(), limit: WEAK_CARDS_DASHBOARD })
    .map((card) => publicWeakCard(card, at.getTime(), titles.get(card.study_set_id || card.studySetId) || ''));
  const consistency = consistencyWindow(activity, Math.min(CONSISTENCY_WINDOW_DAYS, window.days));

  return {
    ok: true,
    range: window.range,
    timeZone: window.timeZone,
    rangeStart: window.startIso,
    rangeEnd: window.endIso,
    dayDefinition: 'Calendar days in timeZone. Events are stored in UTC and bucketed in the API.',
    masteredDefinition: `Cards with intervalDays >= ${MASTERED_INTERVAL_DAYS} and not suspended.`,
    confidentReviewsDefinition: 'Share of reviews rated Good or Easy.',
    summary: {
      reviews: total,
      activeDays: activeDayCount(activity),
      masteredCards: counts.masteredCards,
      dueNow: counts.dueNow,
      confidentReviews
    },
    ratings,
    activity,
    consistency,
    dueForecast: dueForecast(cards, at, window.timeZone),
    weakCards: weak,
    sets: setRows
  };
}
