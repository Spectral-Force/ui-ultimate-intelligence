import RichText from './RichText.jsx'

/**
 * List of flagged / annotated questions for review.
 * Used in StatsView; lets the user clear flags or jump to the editor.
 */
export default function FlaggedList({ allQuestions, questionMeta, onUnflag, onEdit }) {
  const items = allQuestions
    .map(q => ({ q, m: questionMeta[q.id] }))
    .filter(({ m }) => m && (m.flagged || (m.note && m.note.trim().length > 0)))

  if (items.length === 0) {
    return <div className="chart-placeholder-body">No flagged questions or notes yet. Tap the ⚑ or ✎ icon on any question.</div>
  }

  return (
    <ul className="flagged-list">
      {items.map(({ q, m }) => (
        <li key={q.id} className="flagged-item">
          <div className="flagged-item-head">
            {m.flagged && <span className="flagged-tag">⚑ Flagged</span>}
            {m.note && <span className="flagged-tag flagged-tag-note">✎ Note</span>}
            <span className="flagged-meta">{q.level} · {q.path[1] ?? q.path[0]}</span>
          </div>
          <div className="flagged-question"><RichText text={q.question} /></div>
          {m.note && <div className="flagged-note"><RichText text={m.note} /></div>}
          <div className="flagged-actions">
            {m.flagged && (
              <button className="btn btn-ghost btn-small" onClick={() => onUnflag(q.id)}>Clear flag</button>
            )}
            {q.userAuthored && onEdit && (
              <button className="btn btn-ghost btn-small" onClick={() => onEdit(q)}>Edit</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
