/**
 * Simplified SM-2 spaced repetition scheduler.
 *
 * Per-question state stored in questionMeta:
 *   - easeFactor:  difficulty multiplier (1.3 .. 2.5+). Default 2.5.
 *   - interval:    days until next review. Default 0 (new).
 *   - nextDue:     epoch ms timestamp at which this question is "due".
 *   - reps:        consecutive correct answers in a row.
 *   - lastQuality: last quality score 0..5.
 *
 * Confidence is mapped to a quality bonus when answer is correct,
 * a penalty when answer is wrong. Hint usage halves the bonus.
 */

const DAY_MS = 86400_000
const MIN_EASE = 1.3
const MAX_EASE = 3.0
const DEFAULT_EASE = 2.5

export function freshState() {
  return {
    easeFactor: DEFAULT_EASE,
    interval:   0,
    reps:       0,
    nextDue:    Date.now(), // immediately due
    lastQuality: null,
  }
}

/**
 * Compute quality 0..5 from a result.
 * @param wasCorrect  true/false
 * @param confidence  'low' | 'med' | 'high' | null
 * @param usedHint    true/false
 */
export function qualityFrom({ wasCorrect, confidence, usedHint }) {
  if (!wasCorrect) {
    // Higher confidence + wrong = bigger metacognitive miss (lower quality)
    if (confidence === 'high') return 0
    if (confidence === 'med')  return 1
    return 2  // low or unspecified — at least they knew they didn't know
  }
  // Correct
  let q = 4
  if (confidence === 'high') q = 5
  if (confidence === 'low')  q = 3
  if (usedHint) q = Math.max(3, q - 1)
  return q
}

/**
 * Apply SM-2 update.
 * @param prev   previous state (or null for fresh)
 * @param quality 0..5
 * @returns next state { easeFactor, interval, reps, nextDue, lastQuality }
 */
export function applySrsUpdate(prev, quality) {
  const state = { ...(prev ?? freshState()) }
  state.lastQuality = quality

  if (quality < 3) {
    // Failure: restart but keep easeFactor (penalise slightly)
    state.reps = 0
    state.interval = 1
    state.easeFactor = Math.max(MIN_EASE, state.easeFactor - 0.2)
  } else {
    state.reps += 1
    if (state.reps === 1)      state.interval = 1
    else if (state.reps === 2) state.interval = 3
    else                        state.interval = Math.round(state.interval * state.easeFactor)
    // SM-2 ease update
    const ef = state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    state.easeFactor = Math.min(MAX_EASE, Math.max(MIN_EASE, ef))
  }
  state.nextDue = Date.now() + state.interval * DAY_MS
  return state
}

/**
 * Is this question due for review now?
 * Questions with no SRS state are considered "new" (also due).
 */
export function isDue(meta, now = Date.now()) {
  if (!meta || meta.nextDue == null) return true
  return meta.nextDue <= now
}

/**
 * Estimated current retention probability (Ebbinghaus-style),
 * given days since last seen and interval. Used for forgetting-curve plot.
 */
export function retentionEstimate(meta, now = Date.now()) {
  if (!meta || !meta.lastSeen) return null
  const elapsedDays = (now - meta.lastSeen) / DAY_MS
  const stability = Math.max(1, meta.interval || 1)
  return Math.exp(-elapsedDays / stability)
}
