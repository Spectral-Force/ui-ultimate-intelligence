import { LEVELS } from '../data/categories.js'
import LevelBadge from './LevelBadge.jsx'

export default function SessionStart({ questionCount, selectedIds, selectedLevels, mode, onStart }) {
  const hasQuestions = questionCount > 0

  return (
    <div className="question-card" style={{ textAlign: 'center', padding: '36px 28px' }}>

      {hasQuestions ? (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 16, opacity: 0.5 }}>⊙</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            Ready to begin
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{questionCount}</strong> questions available
            in <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size}</strong> {selectedIds.size === 1 ? 'category' : 'categories'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
            {[...selectedLevels].map(l => <LevelBadge key={l} level={l} />)}
          </div>

          <button className="btn btn-primary" onClick={onStart} style={{ padding: '10px 28px', fontSize: '0.9rem' }}>
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
            The selected {selectedIds.size === 1 ? 'category has' : 'categories have'} no questions yet
            for the active difficulty levels.
            Try enabling more levels, or use Claude Code to generate questions for this topic.
          </p>
        </>
      )}
    </div>
  )
}
