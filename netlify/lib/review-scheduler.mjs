/**
 * Atomurus Smart Review scheduler (server-only).
 *
 * Deterministic SM-2-inspired algorithm. The browser must never compute
 * due dates; only the server calls scheduleReview().
 *
 * Ratings: again | hard | good | easy
 *
 * Clamps:
 *   easeFactor   1.30 .. 3.00
 *   interval     10 minutes .. 3650 days
 *
 * Again: ~10 minutes, lapses++, ease −0.20, repetitions = 0, state learning
 * Hard:  ease −0.15; new/learning → 0.5 day; review → interval × 1.2
 * Good:  reps 0 → 1 day; reps 1 → 6 days; else interval × ease; reps++
 * Easy:  ease +0.15; reps 0 → 4 days; else max(interval, 1) × ease × 1.3; reps++
 *
 * Mastered is a UI metric only: intervalDays >= 21
 */

export const REVIEW_RATINGS = ['again', 'hard', 'good', 'easy'];
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const DEFAULT_EASE = 2.5;
export const MIN_INTERVAL_DAYS = Math.round((10 / (24 * 60)) * 1e6) / 1e6;
export const MAX_INTERVAL_DAYS = 3650;
export const MASTERED_INTERVAL_DAYS = 21;

export class SchedulerError extends Error {
  constructor(message, status = 400, code = 'invalid_request') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function finiteNumber(value, fallback) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeCardState(cardState = {}) {
  const easeFactor = clamp(
    finiteNumber(cardState.easeFactor ?? cardState.ease_factor, DEFAULT_EASE),
    MIN_EASE,
    MAX_EASE
  );
  const intervalDays = clamp(
    Math.max(0, finiteNumber(cardState.intervalDays ?? cardState.interval_days, 0)),
    0,
    MAX_INTERVAL_DAYS
  );
  const repetitions = Math.max(0, Math.floor(finiteNumber(cardState.repetitions, 0)));
  const lapses = Math.max(0, Math.floor(finiteNumber(cardState.lapses, 0)));
  const rawState = String(cardState.reviewState ?? cardState.review_state ?? 'new').toLowerCase();
  const reviewState = ['new', 'learning', 'review'].includes(rawState) ? rawState : 'new';
  return { easeFactor, intervalDays, repetitions, lapses, reviewState };
}

export function isMastered(intervalDays) {
  return finiteNumber(intervalDays, 0) >= MASTERED_INTERVAL_DAYS;
}

function roundInterval(value) {
  return Math.round(value * 1e6) / 1e6;
}

function roundEase(value) {
  return Math.round(value * 100) / 100;
}

export function scheduleReview(cardState, rating, now = new Date()) {
  const grade = String(rating || '').trim().toLowerCase();
  if (!REVIEW_RATINGS.includes(grade)) {
    throw new SchedulerError('rating is invalid', 400, 'invalid_rating');
  }

  const at = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(at.getTime())) {
    throw new SchedulerError('server time is invalid', 500, 'invalid_time');
  }

  let { easeFactor, intervalDays, repetitions, lapses, reviewState } = normalizeCardState(cardState);

  if (grade === 'again') {
    easeFactor = clamp(easeFactor - 0.2, MIN_EASE, MAX_EASE);
    lapses += 1;
    repetitions = 0;
    intervalDays = MIN_INTERVAL_DAYS;
    reviewState = 'learning';
  } else if (grade === 'hard') {
    easeFactor = clamp(easeFactor - 0.15, MIN_EASE, MAX_EASE);
    if (reviewState === 'new' || reviewState === 'learning' || repetitions === 0) {
      intervalDays = 0.5;
      reviewState = 'learning';
    } else {
      intervalDays = intervalDays * 1.2;
      reviewState = intervalDays >= 1 ? 'review' : 'learning';
    }
  } else if (grade === 'good') {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = intervalDays * easeFactor;
    repetitions += 1;
    reviewState = intervalDays < 1 ? 'learning' : 'review';
  } else {
    easeFactor = clamp(easeFactor + 0.15, MIN_EASE, MAX_EASE);
    if (repetitions === 0) intervalDays = 4;
    else intervalDays = Math.max(intervalDays, 1) * easeFactor * 1.3;
    repetitions += 1;
    reviewState = 'review';
  }

  intervalDays = clamp(intervalDays, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS);
  easeFactor = clamp(easeFactor, MIN_EASE, MAX_EASE);
  if (!Number.isFinite(intervalDays) || intervalDays <= 0) intervalDays = MIN_INTERVAL_DAYS;
  if (!Number.isFinite(easeFactor)) easeFactor = DEFAULT_EASE;

  intervalDays = clamp(roundInterval(intervalDays), MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS);
  easeFactor = clamp(roundEase(easeFactor), MIN_EASE, MAX_EASE);

  const dueMs = at.getTime() + intervalDays * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(dueMs)) {
    throw new SchedulerError('due date overflow', 500, 'invalid_time');
  }

  return {
    dueAt: new Date(dueMs).toISOString(),
    intervalDays,
    easeFactor,
    repetitions,
    lapses,
    reviewState
  };
}
