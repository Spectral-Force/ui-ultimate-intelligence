import { useState, useCallback } from 'react'
import { filterQuestions } from '../questions/index.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useQuiz() {
  const [sessionPool, setSessionPool]   = useState(null)  // null = not started
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState([])
  const [sessionStart, setSessionStart] = useState(null)

  const currentQuestion = sessionPool?.[currentIndex] ?? null
  const isComplete = sessionPool !== null && currentIndex >= sessionPool.length

  const startSession = useCallback((selectedIds, selectedLevels, mode) => {
    const pool = shuffle(filterQuestions(selectedIds, selectedLevels, mode))
    setSessionPool(pool)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(Date.now())
  }, [])

  // PassiveCard passes the original correct index (or -1) so correctness is already resolved
  const submitAnswer = useCallback((resolvedCorrectIdx) => {
    if (!currentQuestion) return
    const correct = resolvedCorrectIdx === currentQuestion.passive.correct
    setAnswers(prev => [
      ...prev,
      { questionId: currentQuestion.id, correct, ts: Date.now() },
    ])
  }, [currentQuestion])

  const nextQuestion = useCallback(() => {
    setCurrentIndex(i => i + 1)
  }, [])

  const resetSession = useCallback(() => {
    setSessionPool(null)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(null)
  }, [])

  const accuracy = answers.length > 0
    ? answers.filter(a => a.correct).length / answers.length
    : 0

  const durationMs = sessionStart ? Date.now() - sessionStart : 0

  return {
    sessionPool,
    currentQuestion,
    currentIndex,
    answers,
    isComplete,
    accuracy,
    durationMs,
    startSession,
    submitAnswer,
    nextQuestion,
    resetSession,
  }
}
