import { useState, useEffect, useCallback, useMemo } from 'react'
import { persistSession, loadAllSessions, loadQuestionHistory, exportData, importData } from '../db/index.js'

export function useProgress() {
  const [sessions, setSessions]               = useState([])
  const [questionHistory, setQuestionHistory] = useState({})
  const [loaded, setLoaded]                   = useState(false)
  const [loadError, setLoadError]             = useState(null)

  useEffect(() => {
    Promise.all([loadAllSessions(), loadQuestionHistory()])
      .then(([sess, hist]) => {
        setSessions(sess)
        setQuestionHistory(hist)
        setLoaded(true)
      })
      .catch(err => {
        console.error('[useProgress] DB load failed:', err)
        setLoadError(err)
        // Still mark loaded so UI can show an error state instead of hanging
        setLoaded(true)
      })
  }, [])

  const saveSession = useCallback(async (sessionData, answers) => {
    try {
      await persistSession(sessionData, answers)
      const [sess, hist] = await Promise.all([loadAllSessions(), loadQuestionHistory()])
      setSessions(sess)
      setQuestionHistory(hist)
    } catch (err) {
      console.error('[useProgress] saveSession failed:', err)
      throw err
    }
  }, [])

  // ── derived stats ─────────────────────────────────────

  const totalSessions = sessions.length

  const overallAccuracy = sessions.length > 0
    ? sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length
    : null

  const bestAccuracy = sessions.length > 0
    ? Math.max(...sessions.map(r => r.accuracy))
    : null

  // consolidation runs for a given setKey + mode (so passive/active don't mix)
  const consolidationRuns = useCallback((setKey, mode) => {
    return sessions.filter(s => s.setKey === setKey && (!mode || s.mode === mode))
  }, [sessions])

  // Returns the memoised category-stats map keyed by an "allQuestions" reference.
  // Grouping rule: every question's path[1] is the canonical sub-area
  // (atomic-physics, equipment, calculus, key-quantities, etc.).
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
    const [sess, hist] = await Promise.all([loadAllSessions(), loadQuestionHistory()])
    setSessions(sess)
    setQuestionHistory(hist)
  }, [])

  return {
    loaded,
    loadError,
    sessions,
    questionHistory,
    totalSessions,
    overallAccuracy,
    bestAccuracy,
    consolidationRuns,
    categoryStats,
    saveSession,
    exportProgress,
    importProgress,
  }
}
