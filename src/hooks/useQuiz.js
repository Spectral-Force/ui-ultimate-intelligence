import { useState, useCallback, useEffect, useRef } from 'react'
import { filterQuestions } from '../questions/index.js'
import { saveInProgress, loadInProgress, clearInProgress } from '../db/index.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Group chained questions: a question with `chain: ["id1","id2",...]` pulls
 * its successors next to it; successors are filtered out as standalone.
 */
function groupChains(pool) {
  const byId = new Map(pool.map(q => [q.id, q]))
  const successorIds = new Set()
  for (const q of pool) {
    if (Array.isArray(q.chain)) q.chain.forEach(id => successorIds.add(id))
  }
  const out = []
  for (const q of pool) {
    if (successorIds.has(q.id)) continue
    out.push(q)
    if (Array.isArray(q.chain)) {
      for (const cid of q.chain) {
        const c = byId.get(cid)
        if (c) out.push(c)
      }
    }
  }
  return out
}

export function useQuiz() {
  const [sessionPool, setSessionPool]   = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState([])
  const [sessionStart, setSessionStart] = useState(null)
  const [nowTick, setNowTick]           = useState(0)
  const [meta, setMeta]                 = useState(null)  // { mode, setKey, goalSize? }

  const currentQuestion = sessionPool?.[currentIndex] ?? null
  const isComplete = sessionPool !== null && currentIndex >= sessionPool.length

  // Live timer
  useEffect(() => {
    if (sessionStart === null || isComplete) return
    const id = setInterval(() => setNowTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [sessionStart, isComplete])

  // ── pause/resume: snapshot to IndexedDB whenever answers change ─────────
  const debounceRef = useRef(null)
  useEffect(() => {
    if (sessionPool === null || isComplete) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveInProgress({
        sessionPool,
        currentIndex,
        answers,
        sessionStart,
        meta,
      }).catch(err => console.warn('[useQuiz] pause-save failed:', err))
    }, 250)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [sessionPool, currentIndex, answers, sessionStart, meta, isComplete])

  // Clear snapshot when session completes or resets
  useEffect(() => {
    if (isComplete) clearInProgress().catch(() => {})
  }, [isComplete])

  /**
   * Start a session.
   *  - selectedIds/levels/mode: standard filter
   *  - pool: optional pre-computed pool (smart-set, daily, etc) - bypasses filter
   *  - goalSize: optional cap on number of questions
   *  - setKey: stable identifier for stats
   */
  const startSession = useCallback((opts) => {
    const {
      selectedIds, selectedLevels, mode,
      pool: precomputedPool = null,
      goalSize = null,
      setKey = null,
    } = opts
    let pool = precomputedPool ?? filterQuestions(selectedIds, selectedLevels, mode)
    pool = shuffle(pool)
    pool = groupChains(pool)
    if (goalSize && pool.length > goalSize) pool = pool.slice(0, goalSize)
    setSessionPool(pool)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(Date.now())
    setNowTick(0)
    setMeta({ mode, setKey, goalSize })
  }, [])

  /**
   * Resume a saved session (from inProgress store).
   */
  const resumeSession = useCallback((snapshot) => {
    if (!snapshot?.sessionPool) return false
    setSessionPool(snapshot.sessionPool)
    setCurrentIndex(snapshot.currentIndex ?? 0)
    setAnswers(snapshot.answers ?? [])
    setSessionStart(snapshot.sessionStart ?? Date.now())
    setMeta(snapshot.meta ?? null)
    setNowTick(0)
    return true
  }, [])

  /**
   * Record an answer.
   *  payload: { correct, confidence?, usedHint? }
   */
  const submitAnswer = useCallback((payload) => {
    if (!currentQuestion) return
    const { correct, confidence = null, usedHint = false } = (typeof payload === 'object' && payload !== null)
      ? payload
      : { correct: !!payload }
    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        level:      currentQuestion.level,
        path:       currentQuestion.path,
        correct:    !!correct,
        skipped:    false,
        confidence,
        usedHint:   !!usedHint,
        ts:         Date.now(),
      },
    ])
  }, [currentQuestion])

  const skipQuestion = useCallback(() => {
    if (!currentQuestion) {
      setCurrentIndex(i => i + 1)
      return
    }
    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        level:      currentQuestion.level,
        path:       currentQuestion.path,
        correct:    false,
        skipped:    true,
        confidence: null,
        usedHint:   false,
        ts:         Date.now(),
      },
    ])
    setCurrentIndex(i => i + 1)
  }, [currentQuestion])

  const nextQuestion = useCallback(() => setCurrentIndex(i => i + 1), [])

  const resetSession = useCallback(() => {
    setSessionPool(null)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(null)
    setNowTick(0)
    setMeta(null)
    clearInProgress().catch(() => {})
  }, [])

  const accuracy = answers.length > 0
    ? answers.filter(a => a.correct).length / answers.length
    : 0

  void nowTick
  const durationMs = sessionStart ? Date.now() - sessionStart : 0

  return {
    sessionPool,
    currentQuestion,
    currentIndex,
    answers,
    isComplete,
    accuracy,
    durationMs,
    meta,
    startSession,
    resumeSession,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    resetSession,
  }
}

// Re-export for App to check resume on mount
export async function getSavedSession() {
  try { return await loadInProgress() } catch { return null }
}
