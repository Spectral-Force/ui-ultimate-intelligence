import { useState, useMemo, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import ModeNav from './components/ModeNav.jsx'
import PassiveCard from './components/PassiveCard.jsx'
import ActiveCard from './components/ActiveCard.jsx'
import StatsView from './components/StatsView.jsx'
import SessionStart from './components/SessionStart.jsx'
import SessionSummary from './components/SessionSummary.jsx'
import { getAllDescendantIds } from './data/categories.js'
import { filterQuestions } from './questions/index.js'
import { useQuiz } from './hooks/useQuiz.js'
import { useProgress } from './hooks/useProgress.js'

const DEFAULT_LEVELS = new Set(['U', 'M', 'P', 'A'])

export default function App() {
  const [theme, setTheme]                   = useState('cream')
  const [selectedIds, setSelectedIds]       = useState(new Set())
  const [selectedLevels, setSelectedLevels] = useState(DEFAULT_LEVELS)
  const [activeMode, setActiveMode]         = useState('passive')
  const [sidebarOpen, setSidebarOpen]       = useState(false)

  const quiz     = useQuiz()
  const progress = useProgress()

  function toggleTheme() { setTheme(t => t === 'dark' ? 'cream' : 'dark') }

  function toggleCategory(node, currentState) {
    const ids = getAllDescendantIds(node)
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (currentState === 'selected') ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
    quiz.resetSession()
  }

  function toggleLevel(levelId) {
    setSelectedLevels(prev => {
      const next = new Set(prev)
      next.has(levelId) ? next.delete(levelId) : next.add(levelId)
      return next
    })
    quiz.resetSession()
  }

  // Question pool size for the current filter
  const availableCount = useMemo(
    () => filterQuestions(selectedIds, selectedLevels, activeMode === 'stats' ? 'passive' : activeMode).length,
    [selectedIds, selectedLevels, activeMode]
  )

  // Stable set key = sorted question IDs — identifies this exact question set for consolidation
  const currentSetKey = useMemo(() => {
    if (selectedIds.size === 0) return null
    const ids = filterQuestions(selectedIds, selectedLevels, 'passive').map(q => q.id).sort()
    return ids.length > 0 ? ids.join(',') : null
  }, [selectedIds, selectedLevels])

  const noneSelected = selectedIds.size === 0

  function handleStartSession() {
    quiz.startSession(selectedIds, selectedLevels, activeMode)
  }

  function handlePlayAgain() {
    quiz.startSession(selectedIds, selectedLevels, activeMode)
  }

  function renderContent() {
    if (activeMode === 'stats') {
      return <StatsView progress={progress} currentSetKey={currentSetKey} />
    }

    if (noneSelected) return <EmptyState />

    if (quiz.sessionPool === null) {
      return (
        <SessionStart
          questionCount={availableCount}
          selectedIds={selectedIds}
          selectedLevels={selectedLevels}
          mode={activeMode}
          onStart={handleStartSession}
        />
      )
    }

    if (quiz.isComplete) {
      return (
        <SessionSummary
          answers={quiz.answers}
          pool={quiz.sessionPool}
          durationMs={quiz.durationMs}
          onSave={() => progress.saveSession(
            {
              date:       Date.now(),
              setKey:     currentSetKey,
              mode:       activeMode,
              accuracy:   quiz.accuracy,
              correct:    quiz.answers.filter(a => a.correct).length,
              total:      quiz.answers.length,
              durationMs: quiz.durationMs,
            },
            quiz.answers.map(a => ({ ...a })),
          )}
          onPlayAgain={handlePlayAgain}
          onNewSession={quiz.resetSession}
        />
      )
    }

    if (activeMode === 'passive') {
      if (!quiz.currentQuestion) return null
      return (
        <PassiveCard
          key={quiz.currentQuestion.id}
          question={quiz.currentQuestion}
          questionIndex={quiz.currentIndex}
          total={quiz.sessionPool.length}
          onAnswer={quiz.submitAnswer}
          onNext={quiz.nextQuestion}
          onSkip={quiz.nextQuestion}
        />
      )
    }

    if (activeMode === 'active') {
      if (!quiz.currentQuestion) return null
      return (
        <ActiveCard
          key={quiz.currentQuestion.id}
          question={quiz.currentQuestion}
          questionIndex={quiz.currentIndex}
          total={quiz.sessionPool.length}
          onAnswer={quiz.submitAnswer}
          onNext={quiz.nextQuestion}
          onSkip={quiz.nextQuestion}
        />
      )
    }

    return null
  }

  const inSession = quiz.sessionPool !== null && !quiz.isComplete
  const progress_ = inSession ? (quiz.currentIndex + 1) / quiz.sessionPool.length : 0

  return (
    <div className="app" data-theme={theme}>
      <Sidebar
        open={sidebarOpen}
        selectedIds={selectedIds}
        onToggleCategory={toggleCategory}
        selectedLevels={selectedLevels}
        onToggleLevel={toggleLevel}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          selectedIds={selectedIds}
          selectedLevels={selectedLevels}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <ModeNav activeMode={activeMode} onSelect={(m) => { setActiveMode(m); quiz.resetSession() }} />

        <div className="content">
          <div className="content-inner">

            {activeMode !== 'stats' && !noneSelected && (
              <div className="context-bar">
                <span className="context-bar-left">
                  {inSession
                    ? <><strong>{quiz.sessionPool.length}</strong> questions in session</>
                    : <><strong>{availableCount}</strong> questions available</>
                  }
                </span>
                {inSession && (
                  <div className="context-bar-right">
                    <span className="progress-text">{quiz.currentIndex + 1} / {quiz.sessionPool.length}</span>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${progress_ * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {renderContent()}

          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">⊙</div>
      <div className="empty-state-title">No categories selected</div>
      <p className="empty-state-body">
        Choose one or more topics from the sidebar to load questions.
        Select broad categories like "Quantum Mechanics" or drill down
        to specific topics like "Magneto-Optical Traps".
      </p>
    </div>
  )
}
