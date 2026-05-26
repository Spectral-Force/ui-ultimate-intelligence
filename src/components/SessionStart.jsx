import { useState } from 'react'
import LevelBadge from './LevelBadge.jsx'

const GOAL_OPTIONS = [
  { id: null, label: 'All available' },
  { id: 5,    label: '5 questions'   },
  { id: 10,   label: '10 questions'  },
  { id: 20,   label: '20 questions'  },
  { id: 50,   label: '50 questions'  },
]

export default function SessionStart({
  questionCount, selectedLeafCount, selectedLevels, mode,
  onStart, hasInProgress, onResume,
}) {
  const [goal, setGoal] = useState(null)
  const hasQuestions = questionCount > 0
  const topicCount = selectedLeafCount ?? 0

  return (
    <div className="question-card" style={{ textAlign: 'center', padding: '36px 28px' }}>

      {hasInProgress && (
        <div className="resume-banner" role="status">
          <div className="resume-banner-title">You have an unfinished session</div>
          <button className="btn btn-primary" onClick={onResume}>Resume →</button>
        </div>
      )}

      {hasQuestions ? (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 16, opacity: 0.5 }}>⊙</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            Ready to begin
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{questionCount}</strong> questions available
            {topicCount > 0 && <> in <strong style={{ color: 'var(--text-primary)' }}>{topicCount}</strong> {topicCount === 1 ? 'topic' : 'topics'}</>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {[...selectedLevels].map(l => <LevelBadge key={l} level={l} />)}
          </div>

          <div className="session-goal">
            <span className="session-goal-label">Session length</span>
            <div className="session-goal-options">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={String(opt.id)}
                  className={`session-goal-btn${goal === opt.id ? ' active' : ''}`}
                  onClick={() => setGoal(opt.id)}
                  disabled={opt.id !== null && opt.id > questionCount}
                  title={opt.id !== null && opt.id > questionCount ? 'Not enough questions in pool' : null}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onStart(goal)}
            style={{ padding: '10px 28px', fontSize: '0.9rem', marginTop: 10 }}
          >
            Start session →
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 16, opacity: 0.35 }}>📚</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            No questions available
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto', lineHeight: 1.65 }}>
            The selected {topicCount === 1 ? 'topic has' : 'topics have'} no questions yet
            for the active difficulty levels.
            Try enabling more levels, or use Claude Code to generate questions for this topic.
          </p>
        </>
      )}
    </div>
  )
}
