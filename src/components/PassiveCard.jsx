import { useState, useMemo } from 'react'
import MathDisplay from './Math.jsx'
import RichText from './RichText.jsx'
import LevelBadge from './LevelBadge.jsx'
import Figure from './Figure.jsx'
import HintBlock from './HintBlock.jsx'
import ConfidencePicker from './ConfidencePicker.jsx'
import QuestionActions from './QuestionActions.jsx'

function shuffleOptions(options, correctSet) {
  const indexed = options.map((text, i) => ({ text, isCorrect: correctSet.has(i) }))
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
  }
  return indexed
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

export default function PassiveCard({
  question, questionIndex, total,
  onAnswer, onNext, onSkip,
  meta, onToggleBookmark, onToggleFlag, onSetNote,
}) {
  const passive = question.passive
  const multi = !!passive.multi
  const correctSet = useMemo(() => new Set(
    multi ? (passive.correctIndices ?? []) : [passive.correct],
  ), [passive, multi])

  const [opts] = useState(() => shuffleOptions(passive.options, correctSet))
  const [selected,   setSelected]   = useState(() => new Set()) // indices into shuffled opts
  const [revealed,   setRevealed]   = useState(false)
  const [confidence, setConfidence] = useState(null)
  const [usedHint,   setUsedHint]   = useState(false)

  function toggleSelect(idx) {
    if (revealed) return
    setSelected(prev => {
      const next = new Set(prev)
      if (multi) {
        next.has(idx) ? next.delete(idx) : next.add(idx)
      } else {
        next.clear()
        next.add(idx)
      }
      return next
    })
  }

  function handleCheck() {
    if (selected.size === 0) return
    const userCorrectSet = new Set(
      [...selected].filter(i => opts[i].isCorrect),
    )
    const allCorrectSelected = new Set(
      opts.map((o, i) => o.isCorrect ? i : null).filter(i => i !== null),
    )
    const correct = multi
      ? setsEqual(selected, allCorrectSelected)
      : (opts[[...selected][0]]?.isCorrect ?? false)
    onAnswer({ correct, confidence, usedHint })
    setRevealed(true)
    // void unused warnings for static analyser
    void userCorrectSet
  }

  function handleNext() {
    setSelected(new Set())
    setRevealed(false)
    setConfidence(null)
    setUsedHint(false)
    onNext()
  }

  const someCorrectChosen = [...selected].some(i => opts[i].isCorrect)
  const allCorrectChosen  = opts.every((o, i) => !o.isCorrect || selected.has(i))
  const isCorrect = revealed && (multi ? (someCorrectChosen && allCorrectChosen && [...selected].every(i => opts[i].isCorrect)) : opts[[...selected][0]]?.isCorrect)

  function optionClass(idx) {
    if (!revealed) return selected.has(idx) ? 'option-item selected' : 'option-item'
    if (opts[idx].isCorrect) return 'option-item correct'
    if (selected.has(idx))   return 'option-item incorrect'
    return 'option-item'
  }

  return (
    <div className="question-card">
      <div className="question-card-top">
        <span className="question-num">Question {questionIndex + 1} of {total}</span>
        <LevelBadge level={question.level} />
      </div>

      <QuestionActions
        question={question}
        meta={meta}
        onToggleBookmark={onToggleBookmark}
        onToggleFlag={onToggleFlag}
        onSetNote={onSetNote}
      />

      <p className="question-text"><RichText text={question.question} /></p>

      {question.equation && (
        <div className="question-math">
          <MathDisplay latex={question.equation} display />
        </div>
      )}

      {question.figure && <Figure figure={question.figure} />}

      {multi && (
        <div className="multi-hint">Select all that apply</div>
      )}

      <ul className={`options-list${multi ? ' options-multi' : ''}`} role={multi ? 'group' : 'radiogroup'} aria-label="Answer options">
        {opts.map((opt, idx) => (
          <li
            key={idx}
            className={optionClass(idx)}
            onClick={() => toggleSelect(idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleSelect(idx)
              }
            }}
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={selected.has(idx)}
            aria-disabled={revealed}
            tabIndex={revealed ? -1 : 0}
          >
            <span className={multi ? 'option-checkbox' : 'option-radio'} aria-hidden="true" />
            <span className="option-text">
              <RichText text={opt.text} />
            </span>
          </li>
        ))}
      </ul>

      {!revealed && (
        <>
          <HintBlock sourceText={passive.explanation} onReveal={() => setUsedHint(true)} />
          <ConfidencePicker value={confidence} onChange={setConfidence} disabled={revealed} />
        </>
      )}

      {revealed && (
        <div className="explanation">
          <div className="explanation-label">{isCorrect ? 'Correct' : 'Incorrect'}</div>
          <p className="explanation-text"><RichText text={passive.explanation} /></p>
        </div>
      )}

      <div className="card-actions">
        <button className="btn btn-ghost" onClick={onSkip}>Skip</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed && (
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={selected.size === 0}
              style={{ opacity: selected.size > 0 ? 1 : 0.45 }}
            >
              Check answer
            </button>
          )}
          {revealed && (
            <button className="btn btn-next" onClick={handleNext}>Next question →</button>
          )}
        </div>
      </div>
    </div>
  )
}
