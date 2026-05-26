import { useState, useMemo, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import ModeNav from './components/ModeNav.jsx'
import PassiveCard from './components/PassiveCard.jsx'
import ActiveCard from './components/ActiveCard.jsx'
import StatsView from './components/StatsView.jsx'
import SessionStart from './components/SessionStart.jsx'
import SessionSummary from './components/SessionSummary.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import UpdateToast from './components/UpdateToast.jsx'
import { CATEGORIES, getAllDescendantIds, isLeaf } from './data/categories.js'
import { filterQuestions } from './questions/index.js'
import { useQuiz } from './hooks/useQuiz.js'
import { useProgress } from './hooks/useProgress.js'

const DEFAULT_LEVELS = ['U', 'M', 'P', 'A']

// ── persisted state helpers ─────────────────────────────────────────────────
const LS_THEME    = 'ui.theme'
const LS_CATS     = 'ui.selectedIds'
const LS_LEVELS   = 'ui.selectedLevels'
const LS_MODE     = 'ui.activeMode'

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function initialTheme() {
  const stored = loadJson(LS_THEME, null)
  if (stored === 'dark' || stored === 'cream') return stored
  // Fall back to OS preference (I15)
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'cream'
}

function initialSelectedIds() {
  const arr = loadJson(LS_CATS, [])
  return new Set(Array.isArray(arr) ? arr : [])
}

function initialSelectedLevels() {
  const arr = loadJson(LS_LEVELS, DEFAULT_LEVELS)
  return new Set(Array.isArray(arr) && arr.length > 0 ? arr : DEFAULT_LEVELS)
}

function initialActiveMode() {
  const m = loadJson(LS_MODE, 'passive')
  return ['passive', 'active', 'stats'].includes(m) ? m : 'passive'
}

// ── leaf-counting helpers (B2) ──────────────────────────────────────────────
// Collect the leaf IDs of the whole taxonomy once at module load.
function collectLeafIds(nodes, out = new Set()) {
  for (const n of nodes) {
    if (n.children?.length) collectLeafIds(n.children, out)
    else out.add(n.id)
  }
  return out
}
const ALL_LEAF_IDS = collectLeafIds(CATEGORIES)

export default function App() {
  const [theme, setTheme]                   = useState(initialTheme)
  const [selectedIds, setSelectedIds]       = useState(initialSelectedIds)
  const [selectedLevels, setSelectedLevels] = useState(initialSelectedLevels)
  const [activeMode, setActiveMode]         = useState(initialActiveMode)
  const [sidebarOpen, setSidebarOpen]       = useState(false)

  const quiz     = useQuiz()
  const progress = useProgress()

  // ── persist on change ────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem(LS_THEME, JSON.stringify(theme)) }, [theme])
  useEffect(() => { localStorage.setItem(LS_CATS, JSON.stringify([...selectedIds])) }, [selectedIds])
  useEffect(() => { localStorage.setItem(LS_LEVELS, JSON.stringify([...selectedLevels])) }, [selectedLevels])
  useEffect(() => { localStorage.setItem(LS_MODE, JSON.stringify(activeMode)) }, [activeMode])

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

  // Stable set key per (mode, filter) — distinct passive vs active sets (B3)
  const currentSetKey = useMemo(() => {
    if (selectedIds.size === 0) return null
    const setMode = activeMode === 'stats' ? 'passive' : activeMode
    const ids = filterQuestions(selectedIds, selectedLevels, setMode).map(q => q.id).sort()
    return ids.length > 0 ? `${setMode}:${ids.join(',')}` : null
  }, [selectedIds, selectedLevels, activeMode])

  // Leaf-only count for header (B2): how many *terminal topics* are selected
  const selectedLeafCount = useMemo(
    () => [...selectedIds].filter(id => ALL_LEAF_IDS.has(id)).length,
    [selectedIds]
  )

  const noneSelected = selectedIds.size === 0

  function handleStartSession() {
    quiz.startSession(selectedIds, selectedLevels, activeMode)
  }

  function handlePlayAgain() {
    quiz.startSession(selectedIds, selectedLevels, activeMode)
  }

  function renderContent() {
    if (activeMode === 'stats') {
      return <StatsView progress={progress} currentSetKey={currentSetKey} activeMode={activeMode} />
    }

    if (noneSelected) return <EmptyState />

    if (quiz.sessionPool === null) {
      return (
        <SessionStart
          questionCount={availableCount}
          selectedLeafCount={selectedLeafCount}
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
          onSkip={quiz.skipQuestion}
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
          onSkip={quiz.skipQuestion}
        />
      )
    }

    return null
  }

  const inSession = quiz.sessionPool !== null && !quiz.isComplete
  const progressFrac = inSession ? (quiz.currentIndex + 1) / quiz.sessionPool.length : 0

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
          selectedLeafCount={selectedLeafCount}
          selectedLevels={selectedLevels}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <ModeNav activeMode={activeMode} onSelect={(m) => { setActiveMode(m); quiz.resetSession() }} />

        <div className="content">
          <div className="content-inner">

            {activeMode !== 'stats' && !noneSelected && (
              <div className="context-bar">
                <span className="context-bar-left">
                  {inSession ? (
                    <><strong>{quiz.sessionPool.length}</strong> questions in session · <span className="context-timer">{formatDuration(quiz.durationMs)}</span></>
                  ) : (
                    <><strong>{availableCount}</strong> questions available</>
                  )}
                </span>
                {inSession && (
                  <div className="context-bar-right">
                    <span className="progress-text">{quiz.currentIndex + 1} / {quiz.sessionPool.length}</span>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${progressFrac * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>

          </div>
        </div>
      </div>

      <UpdateToast />
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

// Format milliseconds as a live "0:42" / "12:08" timer
function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
