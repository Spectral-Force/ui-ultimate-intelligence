import { useState } from 'react'
import Math from './Math.jsx'
import LevelBadge from './LevelBadge.jsx'

const TOKENS = [
  { id: 't1', latex: 'F_{\\text{scatt}}', display: 'F_scatt' },
  { id: 't2', latex: '=',                 display: '=' },
  { id: 't3', latex: '\\hbar k',          display: 'ℏk' },
  { id: 't4', latex: '\\Gamma',           display: 'Γ' },
  { id: 't5', latex: '\\frac{s_0/2}{1 + s_0 + (2\\delta/\\Gamma)^2}', display: 's₀/2 / [...]' },
]

const SOLUTION = ['t1', 't2', 't3', 't4', 't5']

export default function MockActiveCard() {
  const [slots, setSlots] = useState(['t1', null, 't3', null, null])
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)

  const placedIds = new Set(slots.filter(Boolean))

  function handleTokenClick(tokenId) {
    if (checked) return
    setSelected(prev => prev === tokenId ? null : tokenId)
  }

  function handleSlotClick(slotIndex) {
    if (checked) return
    if (slots[slotIndex]) {
      const freed = slots[slotIndex]
      setSlots(prev => prev.map((s, i) => i === slotIndex ? null : s))
      setSelected(freed)
      return
    }
    if (selected && !placedIds.has(selected)) {
      setSlots(prev => prev.map((s, i) => i === slotIndex ? selected : s))
      setSelected(null)
    }
  }

  const isCorrect = slots.every((s, i) => s === SOLUTION[i])

  return (
    <div className="question-card">
      <div className="question-card-top">
        <span className="question-num">Question 1 of 20</span>
        <LevelBadge level="P" />
      </div>

      <p className="question-text">
        Arrange the terms to form the expression for the radiation pressure (scattering) force
        on a two-level atom in a near-resonant laser field.
      </p>
      <p className="question-subscript" style={{ marginBottom: 20 }}>
        Tap a token to select it, then tap a slot to place it. Tap a filled slot to return it.
      </p>

      <div className="active-zone-label">Available tokens</div>
      <div className="token-pool">
        {TOKENS.map(tok => (
          <span
            key={tok.id}
            className={`token${placedIds.has(tok.id) ? ' placed' : ''}${selected === tok.id ? ' selected' : ''}`}
            onClick={() => handleTokenClick(tok.id)}
            style={selected === tok.id ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' } : {}}
          >
            <Math latex={tok.latex} />
          </span>
        ))}
      </div>

      <div className="active-zone-label">Build your equation</div>
      <div className="equation-slots">
        {slots.map((slotId, i) => {
          const tok = TOKENS.find(t => t.id === slotId)
          const correct = checked && slotId === SOLUTION[i]
          const wrong   = checked && slotId && slotId !== SOLUTION[i]
          return (
            <span
              key={i}
              className={`eq-slot${tok ? ' filled' : ''}`}
              onClick={() => handleSlotClick(i)}
              style={
                correct ? { borderColor: 'var(--correct)', background: 'rgba(74,158,106,0.12)' }
                : wrong  ? { borderColor: 'var(--incorrect)', background: 'rgba(184,72,72,0.1)' }
                : tok && selected ? { borderColor: 'var(--accent-alt)' }
                : {}
              }
            >
              {tok ? <Math latex={tok.latex} /> : <span style={{ opacity: 0.35, fontSize: '0.75rem' }}>?</span>}
            </span>
          )
        })}
      </div>

      {checked && (
        <div className="explanation">
          <div className="explanation-label">{isCorrect ? 'Correct!' : 'Not quite'}</div>
          <p className="explanation-text">
            The scattering force is <Math latex="F_{\text{scatt}} = \hbar k \Gamma \frac{s_0/2}{1 + s_0 + (2\delta/\Gamma)^2}" />.
            It equals the photon momentum ℏk times the scattering rate, which saturates at Γ/2 for large s₀.
          </p>
        </div>
      )}

      <div className="card-actions">
        <button className="btn btn-ghost">Skip</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!checked && (
            <button
              className="btn btn-primary"
              onClick={() => setChecked(true)}
              disabled={slots.some(s => !s)}
              style={{ opacity: slots.some(s => !s) ? 0.45 : 1 }}
            >
              Check equation
            </button>
          )}
          {checked && (
            <button className="btn btn-next" onClick={() => { setChecked(false); setSlots(['t1', null, 't3', null, null]); setSelected(null) }}>
              Next question →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
