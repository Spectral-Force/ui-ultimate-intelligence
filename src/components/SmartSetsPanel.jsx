/**
 * Surfaces the SRS-driven "smart sets":
 *   - Due for review
 *   - Practice weak topics
 *   - Daily challenge
 *   - Bookmarked
 *   - Flagged
 *
 * Each row launches a session via `onStartSmart(kind)`.
 */
export default function SmartSetsPanel({ counts, onStart }) {
  const items = [
    { id: 'daily',      label: 'Daily challenge', desc: '5 questions, picked for today', icon: '◉', count: counts.daily },
    { id: 'due',        label: 'Due for review',  desc: 'SRS-due + new',                 icon: '⏱', count: counts.due },
    { id: 'weak',       label: 'Practice weak topics', desc: 'Accuracy < 60%, ≥3 seen', icon: '⚠', count: counts.weak },
    { id: 'bookmarked', label: 'Bookmarks',       desc: 'Your saved questions',          icon: '★', count: counts.bookmarked },
    { id: 'flagged',    label: 'Flagged',         desc: 'Marked for review',             icon: '⚑', count: counts.flagged },
  ]

  return (
    <div className="smartsets">
      {items.map(it => {
        const disabled = !it.count
        return (
          <button
            key={it.id}
            className={`smartset-row${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onStart(it.id)}
            disabled={disabled}
            title={disabled ? 'Nothing in this set yet' : it.desc}
          >
            <span className="smartset-icon" aria-hidden="true">{it.icon}</span>
            <span className="smartset-body">
              <span className="smartset-label">{it.label}</span>
              <span className="smartset-desc">{it.desc}</span>
            </span>
            <span className="smartset-count">{it.count ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}
