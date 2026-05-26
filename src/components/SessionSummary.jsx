import { useEffect, useRef } from 'react'

function pct(n) { return Math.round(n * 100) }
function fmtTime(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function SessionSummary({ answers, pool, durationMs, onSave, onPlayAgain, onNewSession }) {
  const savedRef = useRef(false)

  // Save exactly once when the summary first mounts
  useEffect(() => {
    if (!savedRef.current && answers.length > 0) {
      savedRef.current = true
      onSave?.()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const correct  = answers.filter(a => a.correct).length
  const total    = answers.length
  const accuracy = total > 0 ? correct / total : 0

  const byLevel = {}
  answers.forEach(a => {
    const q = pool.find(q => q.id === a.questionId)
    if (!q) return
    if (!byLevel[q.level]) byLevel[q.level] = { correct: 0, total: 0 }
    byLevel[q.level].total++
    if (a.correct) byLevel[q.level].correct++
  })

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

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
        Session saved · visit the Stats tab to track progress over time
      </div>

      <div className="card-actions" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onNewSession}>← New session</button>
        <button className="btn btn-primary" onClick={onPlayAgain}>Play again</button>
      </div>
    </div>
  )
}
