/**
 * "Smart sets" — virtual question collections.
 *
 *   Due:        SRS-due (or never seen)
 *   Weak:       seen >= 3, accuracy < 60%
 *   Bookmarked: user-bookmarked
 *   Flagged:    user-flagged ("review this")
 *   Daily:      stable 5-question selection for today, drawn from weak/due
 */

import { isDue } from './srs.js'

const DAY_MS = 86400_000

function dayKey(ts = Date.now()) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Mulberry32 PRNG: stable per-day shuffle seed
function mulberry32(a) {
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle(arr, seed) {
  const rng = mulberry32(seed)
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function hashString(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function dueQuestions(allQuestions, meta, now = Date.now()) {
  return allQuestions.filter(q => isDue(meta[q.id], now))
}

export function weakQuestions(allQuestions, history) {
  return allQuestions.filter(q => {
    const h = history[q.id]
    if (!h || h.seen < 3) return false
    return (h.correct / h.seen) < 0.6
  })
}

export function bookmarkedQuestions(allQuestions, meta) {
  return allQuestions.filter(q => meta[q.id]?.bookmarked)
}

export function flaggedQuestions(allQuestions, meta) {
  return allQuestions.filter(q => meta[q.id]?.flagged)
}

/**
 * Daily challenge: stable 5-question subset for today.
 * Drawn first from due (or weak), then random fill from all.
 */
export function dailyChallenge(allQuestions, meta, history, size = 5) {
  const today = dayKey()
  const seed = hashString(today)
  const due  = dueQuestions(allQuestions, meta).filter(q => !meta[q.id]?.flagged)
  const weak = weakQuestions(allQuestions, history)
  const pool = [...new Set([...due, ...weak])]
  const shuffled = seededShuffle(pool.length >= size ? pool : allQuestions, seed)
  return shuffled.slice(0, size)
}

/** Helpers for stats */
export { dayKey, DAY_MS }
