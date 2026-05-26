import { useEffect, useRef, useState } from 'react'
import RichText from './RichText.jsx'
import MathDisplay from './Math.jsx'

function pct(n) { return Math.round(n * 100) }
function fmtTime(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function SessionSummary({ answers, pool, durationMs, onSave, onPlayAgain, onNewSession }) {
  const savedRef = useRef(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  // Save exactly once when the summary first mounts
  useEffect(() => {
    if (!savedRef.current && answers.length > 0) {
      savedRef.current = true
      onSave?.()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const correct  = answers.filter(a => a.correct).length
  const skipped  = answers.filter(a => a.skipped).length
  const total    = answers.length
  const accuracy = total > 0 ? correct / total : 0

  // Build a quick id→question map once (avoids O(n²) find in render)
  const poolById = new Map(pool.map(q => [q.id, q]))

  // Group results by level for the bars
  const byLevel = {}
  answers.forEach(a => {
    const q = poolById.get(a.questionId)
    if (!q) return
    if (!byLevel[q.level]) byLevel[q.level] = { correct: 0, total: 0 }
    byLevel[q.level].total++
    if (a.correct) byLevel[q.level].correct++
  })

  // Wrong + skipped answers — what the "Review" expander shows
  const reviewItems = answers
    .map((a, i) => ({ a, q: poolById.get(a.questionId), idx: i }))
    .filter(({ a }) => !a.correct)

  const LEVEL_LABELS = { U: 'Undergrad', M: "Master's", P: 'PhD', A: 'Academic' }
  const grade = accuracy >= 0.9 ? 'Excellent' : accuracy >= 0.7 ? 'Good' : accuracy >= 0.5 ? 'Developing' : 'Keep practising'

  return (
    <div className="question-card" style={{ padding: '32px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          {pct(accuracy)}%
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 6 }}>
          {grade}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Correct',  value: `${correct} / ${total}` },
          { label: 'Accuracy', value: `${pct(accuracy)}%` },
          { label: 'Time',     value: fmtTime(durationMs) },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card" style={{ textAlign: 'center', padding: '12px' }}>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{ fontSize: '1.15rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {skipped > 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: -10, marginBottom: 14 }}>
          {skipped} {skipped === 1 ? 'question' : 'questions'} skipped
        </div>
      )}

      {Object.keys(byLevel).length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <div className="sidebar-section-label" style={{ marginBottom: 10 }}>By level</div>
          {Object.entries(byLevel).map(([lvl, stats]) => (
            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`level-badge ${lvl}`} style={{ minWidth: 80, justifyContent: 'center' }}>
                {LEVEL_LABELS[lvl]}
              </span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct(stats.correct / stats.total)}%`, background: 'var(--accent)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>
                {pct(stats.correct / stats.total)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── review wrong-answers (I7) ── */}
      {reviewItems.length > 0 && (
        <div className="review-section">
          <button
            className="review-toggle"
            onClick={() => setReviewOpen(o => !o)}
            aria-expanded={reviewOpen}
          >
            <span className="review-toggle-arrow" data-open={reviewOpen}>▶</span>
            Review {reviewItems.length} missed {reviewItems.length === 1 ? 'question' : 'questions'}
          </button>
          {reviewOpen && (
            <ol className="review-list">
              {reviewItems.map(({ a, q, idx }) => q && (
                <li key={`${a.questionId}-${idx}`} className="review-item">
                  <div className="review-item-head">
                    <span className={`level-badge ${q.level}`} style={{ marginRight: 8 }}>{LEVEL_LABELS[q.level] ?? q.level}</span>
                    <span className="review-item-tag">
                      {a.skipped ? 'Skipped' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="review-item-q"><RichText text={q.question} /></p>
                  {q.equation && (
                    <div className="review-item-eq"><MathDisplay latex={q.equation} display /></div>
                  )}
                  {/* Show the canonical correct answer for passive questions */}
                  {q.passive?.options && typeof q.passive.correct === 'number' && (
                    <div className="review-item-answer">
                      <span className="review-item-label">Correct answer:</span>
                      <span className="review-item-text"><RichText text={q.passive.options[q.passive.correct]} /></span>
                    </div>
                  )}
                  {(q.passive?.explanation || q.active?.explanation) && (
                    <p className="review-item-exp">
                      <RichText text={q.passive?.explanation ?? q.active?.explanation} />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: '18px 0 20px' }}>
        Session saved · visit the Stats tab to track progress over time
      </div>

      <div className="card-actions" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onNewSession}>← New session</button>
        <button className="btn btn-primary" onClick={onPlayAgain}>Play again</button>
      </div>
    </div>
  )
}
