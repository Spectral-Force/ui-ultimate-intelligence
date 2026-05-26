/**
 * Inline confidence selector shown alongside "Check answer" — Low / Med / High.
 * Pure controlled UI; parent owns the value.
 */
const LEVELS = [
  { id: 'low',  label: 'Low',    dots: '·' },
  { id: 'med',  label: 'Medium', dots: '··' },
  { id: 'high', label: 'High',   dots: '···' },
]

export default function ConfidencePicker({ value, onChange, disabled }) {
  return (
    <div className="confidence-picker" role="radiogroup" aria-label="Confidence level">
      <span className="confidence-label">Confidence:</span>
      {LEVELS.map(l => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={value === l.id}
          disabled={disabled}
          className={`confidence-btn${value === l.id ? ' active' : ''}`}
          onClick={() => onChange?.(l.id)}
          title={l.label}
        >
          <span aria-hidden="true">{l.dots}</span> {l.label}
        </button>
      ))}
    </div>
  )
}
