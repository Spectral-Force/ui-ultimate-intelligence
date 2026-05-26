import { useState } from 'react'
import MathDisplay from './Math.jsx'
import RichText from './RichText.jsx'
import LevelBadge from './LevelBadge.jsx'

function shuffleOptions(options, correctIdx) {
  const indexed = options.map((text, i) => ({ text, isCorrect: i === correctIdx }))
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
  }
  return indexed
}

export default function PassiveCard({ question, questionIndex, total, onAnswer, onNext, onSkip }) {
  const [opts] = useState(() => shuffleOptions(question.passive.options, question.passive.correct))
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function handleSelect(idx) {
    if (revealed) return
    setSelected(idx)
  }

  function handleCheck() {
    if (selected === null) return
    onAnswer(opts[selected].isCorrect)
    setRevealed(true)
  }

  function handleNext() {
    setSelected(null)
    setRevealed(false)
    onNext()
  }

  const isCorrect = revealed && selected !== null && opts[selected].isCorrect

  function optionClass(idx) {
    if (!revealed) return selected === idx ? 'option-item selected' : 'option-item'
    if (opts[idx].isCorrect) return 'option-item correct'
    if (idx === selected) return 'option-item incorrect'
    return 'option-item'
  }

  return (
    <div className="question-card">
      <div className="question-card-top">
        <span className="question-num">Question {questionIndex + 1} of {total}</span>
        <LevelBadge level={question.level} />
      </div>

      <p className="question-text">
        <RichText text={question.question} />
      </p>

      {question.equation && (
        <div className="question-math">
          <MathDisplay latex={question.equation} display />
        </div>
      )}

      <ul className="options-list" role="radiogroup" aria-label="Answer options">
        {opts.map((opt, idx) => (
          <li
            key={idx}
            className={optionClass(idx)}
            onClick={() => handleSelect(idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSelect(idx)
              }
            }}
            role="radio"
            aria-checked={selected === idx}
            aria-disabled={revealed}
            tabIndex={revealed ? -1 : 0}
          >
            <span className="option-radio" aria-hidden="true" />
            <span className="option-text">
              <RichText text={opt.text} />
            </span>
          </li>
        ))}
      </ul>

      {revealed && (
        <div className="explanation">
          <div className="explanation-label">{isCorrect ? 'Correct' : 'Incorrect'}</div>
          <p className="explanation-text">
            <RichText text={question.passive.explanation} />
          </p>
        </div>
      )}

      <div className="card-actions">
        <button className="btn btn-ghost" onClick={onSkip}>Skip</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed && (
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={selected === null}
              style={{ opacity: selected !== null ? 1 : 0.45 }}
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
