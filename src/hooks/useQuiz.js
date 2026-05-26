import { useState, useCallback, useEffect } from 'react'
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
  const [nowTick, setNowTick]           = useState(0)     // drives live timer

  const currentQuestion = sessionPool?.[currentIndex] ?? null
  const isComplete = sessionPool !== null && currentIndex >= sessionPool.length

  // Live timer: re-render once per second while a session is active and incomplete
  useEffect(() => {
    if (sessionStart === null || isComplete) return
    const id = setInterval(() => setNowTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [sessionStart, isComplete])

  const startSession = useCallback((selectedIds, selectedLevels, mode) => {
    const pool = shuffle(filterQuestions(selectedIds, selectedLevels, mode))
    setSessionPool(pool)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(Date.now())
    setNowTick(0)
  }, [])

  // Now takes a plain boolean — no more passive.correct sentinel hack
  const submitAnswer = useCallback((isCorrect) => {
    if (!currentQuestion) return
    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        level:      currentQuestion.level,
        path:       currentQuestion.path,
        correct:    !!isCorrect,
        skipped:    false,
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
        ts:         Date.now(),
      },
    ])
    setCurrentIndex(i => i + 1)
  }, [currentQuestion])

  const nextQuestion = useCallback(() => {
    setCurrentIndex(i => i + 1)
  }, [])

  const resetSession = useCallback(() => {
    setSessionPool(null)
    setCurrentIndex(0)
    setAnswers([])
    setSessionStart(null)
    setNowTick(0)
  }, [])

  const accuracy = answers.length > 0
    ? answers.filter(a => a.correct).length / answers.length
    : 0

  // nowTick is referenced so React's re-renders driven by setNowTick recompute durationMs;
  // the value itself is discarded — only the dependency on it matters.
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
    startSession,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    resetSession,
  }
}
