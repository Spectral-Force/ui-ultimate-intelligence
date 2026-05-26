import { useState, useEffect, useCallback } from 'react'
import { persistSession, loadAllSessions, loadQuestionHistory, exportData, importData } from '../db/index.js'

export function useProgress() {
  const [sessions, setSessions]               = useState([])
  const [questionHistory, setQuestionHistory] = useState({})
  const [loaded, setLoaded]                   = useState(false)

  useEffect(() => {
    Promise.all([loadAllSessions(), loadQuestionHistory()]).then(([sess, hist]) => {
      setSessions(sess)
      setQuestionHistory(hist)
      setLoaded(true)
    })
  }, [])

  const saveSession = useCallback(async (sessionData, answers) => {
    await persistSession(sessionData, answers)
    // refresh from DB to stay in sync
    const [sess, hist] = await Promise.all([loadAllSessions(), loadQuestionHistory()])
    setSessions(sess)
    setQuestionHistory(hist)
  }, [])

  // ── derived stats ─────────────────────────────────────

  const totalSessions = sessions.length

  const overallAccuracy = sessions.length > 0
    ? sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length
    : null

  const bestAccuracy = sessions.length > 0
    ? Math.max(...sessions.map(r => r.accuracy))
    : null

  // consolidation runs for a given setKey
  const consolidationRuns = useCallback((setKey) => {
    return sessions.filter(s => s.setKey === setKey)
  }, [sessions])

  // per-category accuracy (grouped by path[0] i.e. physics / mathematics)
  const categoryStats = useCallback((allQuestions) => {
    const map = {}
    for (const [qid, hist] of Object.entries(questionHistory)) {
      if (hist.seen === 0) continue
      const q = allQuestions.find(q => q.id === qid)
      if (!q) continue
      const cat = q.path[1] ?? q.path[0]
      if (!map[cat]) map[cat] = { seen: 0, correct: 0 }
      map[cat].seen    += hist.seen
      map[cat].correct += hist.correct
    }
    return map
  }, [questionHistory])

  const exportProgress = useCallback(async () => {
    return exportData()
  }, [])

  const importProgress = useCallback(async (payload) => {
    await importData(payload)
    const [sess, hist] = await Promise.all([loadAllSessions(), loadQuestionHistory()])
    setSessions(sess)
    setQuestionHistory(hist)
  }, [])

  return {
    loaded,
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
