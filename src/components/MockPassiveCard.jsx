import { useState } from 'react'
import Math from './Math.jsx'
import LevelBadge from './LevelBadge.jsx'

const QUESTION = {
  level: 'P',
  number: 1,
  total: 20,
  text: 'The Doppler cooling limit for a two-level atom arises from competition between the cooling force and momentum diffusion due to spontaneous emission. The Doppler temperature is:',
  equation: 'T_D = \\frac{\\hbar\\Gamma}{2k_B}',
  subscript: 'For ⁸⁷Rb with Γ/2π = 6.07 MHz, what is the approximate Doppler temperature?',
  options: [
    { id: 'a', text: '145 μK', correct: true },
    { id: 'b', text: '1.45 mK' },
    { id: 'c', text: '14.5 μK' },
    { id: 'd', text: '580 nK' },
  ],
  explanation:
    'Substituting Γ/2π = 6.07 MHz gives T_D = ℏ·(2π·6.07×10⁶)/(2k_B) ≈ 145 μK. This is the fundamental limit of Doppler cooling; sub-Doppler mechanisms (Sisyphus cooling) are needed to go lower.',
}

export default function MockPassiveCard() {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function handleSelect(id) {
    if (revealed) return
    setSelected(id)
  }

  function handleCheck() {
    if (selected) setRevealed(true)
  }

  function handleNext() {
    setSelected(null)
    setRevealed(false)
  }

  function optionClass(opt) {
    if (!revealed) return selected === opt.id ? 'option-item selected' : 'option-item'
    if (opt.correct) return 'option-item correct'
    if (opt.id === selected && !opt.correct) return 'option-item incorrect'
    return 'option-item'
  }

  return (
    <div className="question-card">
      <div className="question-card-top">
        <span className="question-num">Question {QUESTION.number} of {QUESTION.total}</span>
        <LevelBadge level={QUESTION.level} />
      </div>

      <p className="question-text">{QUESTION.text}</p>

      <div className="question-math">
        <Math latex={QUESTION.equation} display />
      </div>

      <p className="question-subscript">{QUESTION.subscript}</p>

      <ul className="options-list">
        {QUESTION.options.map(opt => (
          <li
            key={opt.id}
            className={optionClass(opt)}
            onClick={() => handleSelect(opt.id)}
          >
            <span className="option-radio" />
            <span className="option-text">{opt.text}</span>
          </li>
        ))}
      </ul>

      {revealed && (
        <div className="explanation">
          <div className="explanation-label">Explanation</div>
          <p className="explanation-text">{QUESTION.explanation}</p>
        </div>
      )}

      <div className="card-actions">
        <button className="btn btn-ghost" onClick={handleNext}>Skip</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed && (
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={!selected}
              style={{ opacity: selected ? 1 : 0.45 }}
            >
              Check answer
            </button>
          )}
          {revealed && (
            <button className="btn btn-next" onClick={handleNext}>
              Next question →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
