import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  persistSession, loadAllSessions, loadQuestionHistory, loadQuestionMeta,
  loadUserQuestions, saveUserQuestion, deleteUserQuestion,
  toggleBookmark as dbToggleBookmark, toggleFlag as dbToggleFlag,
  setNote as dbSetNote, bulkUpdateMeta,
  exportData, importData,
} from '../db/index.js'
import { applySrsUpdate, qualityFrom } from '../lib/srs.js'

export function useProgress() {
  const [sessions, setSessions]               = useState([])
  const [questionHistory, setQuestionHistory] = useState({})
  const [questionMeta, setQuestionMeta]       = useState({})
  const [userQuestions, setUserQuestions]     = useState([])
  const [loaded, setLoaded]                   = useState(false)
  const [loadError, setLoadError]             = useState(null)

  useEffect(() => {
    Promise.all([
      loadAllSessions(),
      loadQuestionHistory(),
      loadQuestionMeta(),
      loadUserQuestions(),
    ])
      .then(([sess, hist, meta, userQs]) => {
        setSessions(sess)
        setQuestionHistory(hist)
        setQuestionMeta(meta)
        setUserQuestions(userQs)
        setLoaded(true)
      })
      .catch(err => {
        console.error('[useProgress] DB load failed:', err)
        setLoadError(err)
        setLoaded(true)
      })
  }, [])

  const refresh = useCallback(async () => {
    const [sess, hist, meta, userQs] = await Promise.all([
      loadAllSessions(),
      loadQuestionHistory(),
      loadQuestionMeta(),
      loadUserQuestions(),
    ])
    setSessions(sess)
    setQuestionHistory(hist)
    setQuestionMeta(meta)
    setUserQuestions(userQs)
  }, [])

  /**
   * Save session + history, then apply SRS updates per answer.
   * answers: [{ questionId, correct, skipped, confidence, usedHint }]
   */
  const saveSession = useCallback(async (sessionData, answers) => {
    try {
      await persistSession(sessionData, answers)

      // SRS pass: for each non-skipped answer, update questionMeta
      const updates = []
      const fresh = await loadQuestionMeta()
      for (const a of answers) {
        if (a.skipped) continue
        const prev = fresh[a.questionId]
        const q = qualityFrom({ wasCorrect: !!a.correct, confidence: a.confidence ?? null, usedHint: !!a.usedHint })
        const next = applySrsUpdate(prev, q)
        updates.push({
          questionId: a.questionId,
          fields: {
            easeFactor:  next.easeFactor,
            interval:    next.interval,
            reps:        next.reps,
            nextDue:     next.nextDue,
            lastQuality: next.lastQuality,
            lastConfidence: a.confidence ?? null,
            lastSeen:    Date.now(),
          },
        })
      }
      await bulkUpdateMeta(updates)
      await refresh()
    } catch (err) {
      console.error('[useProgress] saveSession failed:', err)
      throw err
    }
  }, [refresh])

  // ── meta mutations ───────────────────────────────────

  const toggleBookmark = useCallback(async (qid) => {
    const row = await dbToggleBookmark(qid)
    setQuestionMeta(prev => ({ ...prev, [qid]: row }))
  }, [])

  const toggleFlag = useCallback(async (qid) => {
    const row = await dbToggleFlag(qid)
    setQuestionMeta(prev => ({ ...prev, [qid]: row }))
  }, [])

  const setNote = useCallback(async (qid, note) => {
    const row = await dbSetNote(qid, note)
    setQuestionMeta(prev => ({ ...prev, [qid]: row }))
  }, [])

  // ── user-authored ────────────────────────────────────

  const saveUserQ = useCallback(async (q) => {
    await saveUserQuestion(q)
    await refresh()
  }, [refresh])

  const removeUserQ = useCallback(async (id) => {
    await deleteUserQuestion(id)
    await refresh()
  }, [refresh])

  // ── derived stats ────────────────────────────────────

  const totalSessions = sessions.length

  const overallAccuracy = sessions.length > 0
    ? sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length
    : null

  const bestAccuracy = sessions.length > 0
    ? Math.max(...sessions.map(r => r.accuracy))
    : null

  const consolidationRuns = useCallback((setKey) => {
    return sessions.filter(s => s.setKey === setKey)
  }, [sessions])

  const categoryStats = useMemo(() => {
    const cache = new WeakMap()
    return (allQuestions) => {
      if (cache.has(allQuestions)) return cache.get(allQuestions)
      const byId = new Map(allQuestions.map(q => [q.id, q]))
      const map = {}
      for (const [qid, hist] of Object.entries(questionHistory)) {
        if (!hist || hist.seen === 0) continue
        const q = byId.get(qid)
        if (!q) continue
        const cat = q.path[1] ?? q.path[0]
        if (!map[cat]) map[cat] = { seen: 0, correct: 0 }
        map[cat].seen    += hist.seen
        map[cat].correct += hist.correct
      }
      cache.set(allQuestions, map)
      return map
    }
  }, [questionHistory])

  const exportProgress = useCallback(async () => exportData(), [])

  const importProgress = useCallback(async (payload) => {
    await importData(payload)
    await refresh()
  }, [refresh])

  return {
    loaded,
    loadError,
    sessions,
    questionHistory,
    questionMeta,
    userQuestions,
    totalSessions,
    overallAccuracy,
    bestAccuracy,
    consolidationRuns,
    categoryStats,
    saveSession,
    toggleBookmark,
    toggleFlag,
    setNote,
    saveUserQ,
    removeUserQ,
    exportProgress,
    importProgress,
    refresh,
  }
}
