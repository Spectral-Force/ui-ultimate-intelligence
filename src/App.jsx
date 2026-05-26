import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
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
import InstallBanner from './components/InstallBanner.jsx'
import QuestionEditor from './components/QuestionEditor.jsx'
import { CATEGORIES, getAllDescendantIds } from './data/categories.js'
import { filterQuestions, setUserQuestions } from './questions/index.js'
import { useQuiz, getSavedSession } from './hooks/useQuiz.js'
import { useProgress } from './hooks/useProgress.js'
import { useAllQuestions } from './hooks/useAllQuestions.js'
import {
  dueQuestions, weakQuestions, bookmarkedQuestions, flaggedQuestions, dailyChallenge,
} from './lib/smartSets.js'
import { searchQuestions } from './lib/search.js'

const DEFAULT_LEVELS = ['U', 'M', 'P', 'A']

const LS_THEME    = 'ui.theme'
const LS_THEME_AUTO = 'ui.theme.auto'
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

function osPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function initialTheme() {
  const stored = loadJson(LS_THEME, null)
  if (stored === 'dark' || stored === 'cream') return stored
  return osPrefersDark() ? 'dark' : 'cream'
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
  const [themeAuto]                          = useState(() => loadJson(LS_THEME_AUTO, false))
  const [selectedIds, setSelectedIds]       = useState(initialSelectedIds)
  const [selectedLevels, setSelectedLevels] = useState(initialSelectedLevels)
  const [activeMode, setActiveMode]         = useState(initialActiveMode)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [resumeSnapshot, setResumeSnapshot] = useState(null)
  const [resumeChecked,  setResumeChecked]  = useState(false)
  const [editorOpen,     setEditorOpen]     = useState(false)
  const [editorInitial,  setEditorInitial]  = useState(null)

  const quiz     = useQuiz()
  const progress = useProgress()
  const allQuestions = useAllQuestions()

  // Sync Dexie user-questions into the runtime question bank
  useEffect(() => {
    if (progress.loaded) setUserQuestions(progress.userQuestions ?? [])
  }, [progress.loaded, progress.userQuestions])

  // ── persistence ──
  useEffect(() => { localStorage.setItem(LS_THEME, JSON.stringify(theme)) }, [theme])
  useEffect(() => { localStorage.setItem(LS_CATS, JSON.stringify([...selectedIds])) }, [selectedIds])
  useEffect(() => { localStorage.setItem(LS_LEVELS, JSON.stringify([...selectedLevels])) }, [selectedLevels])
  useEffect(() => { localStorage.setItem(LS_MODE, JSON.stringify(activeMode)) }, [activeMode])

  // OS theme media-query listener — only flip if user hasn't explicitly chosen
  useEffect(() => {
    const stored = loadJson(LS_THEME, null)
    if (stored !== null) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setTheme(e.matches ? 'dark' : 'cream')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  // Pause-and-resume detection: only on first mount
  useEffect(() => {
    let mounted = true
    getSavedSession().then(snap => {
      if (!mounted) return
      // ignore stale snapshots (>7d old) or completed sessions
      if (snap && snap.savedAt && (Date.now() - snap.savedAt < 7 * 86400_000) && snap.sessionPool?.length) {
        setResumeSnapshot(snap)
      }
      setResumeChecked(true)
    }).catch(() => setResumeChecked(true))
    return () => { mounted = false }
  }, [])

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

  const availableCount = useMemo(
    () => filterQuestions(selectedIds, selectedLevels, activeMode === 'stats' ? 'passive' : activeMode).length,
    [selectedIds, selectedLevels, activeMode, allQuestions]
  )

  const currentSetKey = useMemo(() => {
    if (selectedIds.size === 0) return null
    const setMode = activeMode === 'stats' ? 'passive' : activeMode
    const ids = filterQuestions(selectedIds, selectedLevels, setMode).map(q => q.id).sort()
    return ids.length > 0 ? `${setMode}:${ids.join(',')}` : null
  }, [selectedIds, selectedLevels, activeMode, allQuestions])

  const selectedLeafCount = useMemo(
    () => [...selectedIds].filter(id => ALL_LEAF_IDS.has(id)).length,
    [selectedIds]
  )

  // ── smart-set counts (for sidebar) ──
  const smartCounts = useMemo(() => ({
    daily:      dailyChallenge(allQuestions, progress.questionMeta, progress.questionHistory).length,
    due:        dueQuestions(allQuestions, progress.questionMeta).length,
    weak:       weakQuestions(allQuestions, progress.questionHistory).length,
    bookmarked: bookmarkedQuestions(allQuestions, progress.questionMeta).length,
    flagged:    flaggedQuestions(allQuestions, progress.questionMeta).length,
  }), [allQuestions, progress.questionMeta, progress.questionHistory])

  // ── search ──
  const searchResults = useMemo(
    () => searchQuery.trim() ? searchQuestions(allQuestions, searchQuery).slice(0, 50) : [],
    [searchQuery, allQuestions],
  )

  const noneSelected = selectedIds.size === 0

  function handleStartSession(goalSize) {
    quiz.startSession({
      selectedIds, selectedLevels, mode: activeMode,
      goalSize, setKey: currentSetKey,
    })
    setResumeSnapshot(null)
  }

  function handlePlayAgain() {
    quiz.startSession({
      selectedIds, selectedLevels, mode: activeMode,
      goalSize: quiz.meta?.goalSize ?? null,
      setKey: currentSetKey,
    })
  }

  function handleStartSmart(kind) {
    const meta = progress.questionMeta
    const hist = progress.questionHistory
    let pool = []
    if (kind === 'daily') pool = dailyChallenge(allQuestions, meta, hist)
    if (kind === 'due')   pool = dueQuestions(allQuestions, meta)
    if (kind === 'weak')  pool = weakQuestions(allQuestions, hist)
    if (kind === 'bookmarked') pool = bookmarkedQuestions(allQuestions, meta)
    if (kind === 'flagged')    pool = flaggedQuestions(allQuestions, meta)
    pool = pool.filter(q => q.modes?.includes(activeMode === 'stats' ? 'passive' : activeMode))
    if (pool.length === 0) return
    quiz.startSession({
      pool,
      mode: activeMode === 'stats' ? 'passive' : activeMode,
      setKey: `smart:${kind}`,
    })
    if (activeMode === 'stats') setActiveMode('passive')
    setSidebarOpen(false)
    setResumeSnapshot(null)
  }

  function handlePickSearchResult(q) {
    // Start a one-question session with this exact question
    quiz.startSession({
      pool: [q],
      mode: q.modes?.includes(activeMode) ? activeMode : (q.modes?.[0] ?? 'passive'),
      setKey: `search:${q.id}`,
    })
    setSearchQuery('')
    setSidebarOpen(false)
  }

  function handleResume() {
    if (!resumeSnapshot) return
    quiz.resumeSession(resumeSnapshot)
    setResumeSnapshot(null)
  }

  function handleSaveUserQuestion(q) {
    progress.saveUserQ(q).then(() => setEditorOpen(false))
  }

  // ── swipe gestures (mobile) ────────────────────────────────────────────
  const touchStart = useRef(null)
  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.t
    touchStart.current = null
    if (Math.abs(dy) > 60) return        // ignore vertical
    if (dt > 600) return                 // slow swipes = scrolling
    if (Math.abs(dx) < 80) return        // not far enough
    // left swipe: next question (only when revealed/checked)
    // We can't easily check from here, but we can dispatch a custom event the cards listen to.
    if (dx < 0) window.dispatchEvent(new CustomEvent('ui:swipe-next'))
    if (dx > 0) window.dispatchEvent(new CustomEvent('ui:swipe-skip'))
  }

  // Listen for swipe events and trigger nextQuestion/skip
  useEffect(() => {
    function onNext()  { if (quiz.sessionPool && !quiz.isComplete) quiz.nextQuestion() }
    function onSkip()  { if (quiz.sessionPool && !quiz.isComplete) quiz.skipQuestion() }
    window.addEventListener('ui:swipe-next', onNext)
    window.addEventListener('ui:swipe-skip', onSkip)
    return () => {
      window.removeEventListener('ui:swipe-next', onNext)
      window.removeEventListener('ui:swipe-skip', onSkip)
    }
  }, [quiz])

  function renderContent() {
    if (activeMode === 'stats') {
      return <StatsView
        progress={progress}
        currentSetKey={currentSetKey}
        onAddQuestion={() => { setEditorInitial(null); setEditorOpen(true) }}
      />
    }

    if (noneSelected && !quiz.sessionPool && !resumeSnapshot) return <EmptyState />

    if (quiz.sessionPool === null) {
      return (
        <SessionStart
          questionCount={availableCount}
          selectedLeafCount={selectedLeafCount}
          selectedLevels={selectedLevels}
          mode={activeMode}
          onStart={handleStartSession}
          hasInProgress={resumeChecked && !!resumeSnapshot}
          onResume={handleResume}
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
              setKey:     quiz.meta?.setKey ?? currentSetKey,
              mode:       quiz.meta?.mode ?? activeMode,
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

    if (!quiz.currentQuestion) return null
    const cardProps = {
      key: quiz.currentQuestion.id,
      question: quiz.currentQuestion,
      questionIndex: quiz.currentIndex,
      total: quiz.sessionPool.length,
      onAnswer: quiz.submitAnswer,
      onNext: quiz.nextQuestion,
      onSkip: quiz.skipQuestion,
      meta: progress.questionMeta[quiz.currentQuestion.id],
      onToggleBookmark: progress.toggleBookmark,
      onToggleFlag: progress.toggleFlag,
      onSetNote: progress.setNote,
    }
    const cardMode = quiz.meta?.mode ?? activeMode
    if (cardMode === 'active' && quiz.currentQuestion.modes?.includes('active')) {
      return <ActiveCard {...cardProps} />
    }
    return <PassiveCard {...cardProps} />
  }

  const inSession = quiz.sessionPool !== null && !quiz.isComplete
  const progressFrac = inSession ? (quiz.currentIndex + 1) / quiz.sessionPool.length : 0

  return (
    <div className="app" data-theme={theme} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Sidebar
        open={sidebarOpen}
        selectedIds={selectedIds}
        onToggleCategory={toggleCategory}
        selectedLevels={selectedLevels}
        onToggleLevel={toggleLevel}
        smartCounts={smartCounts}
        onStartSmart={handleStartSmart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onPickSearchResult={handlePickSearchResult}
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
            {activeMode !== 'stats' && (noneSelected ? quiz.sessionPool : true) && !noneSelected && (
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
      <InstallBanner />
      <QuestionEditor
        open={editorOpen}
        initial={editorInitial}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveUserQuestion}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">⊙</div>
      <div className="empty-state-title">No categories selected</div>
      <p className="empty-state-body">
        Choose one or more topics from the sidebar to load questions, or try a Smart Set
        like "Daily challenge" to jump right in.
      </p>
    </div>
  )
}

function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
