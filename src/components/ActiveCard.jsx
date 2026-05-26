import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import MathDisplay from './Math.jsx'
import RichText from './RichText.jsx'
import LevelBadge from './LevelBadge.jsx'

// ── helpers ───────────────────────────────────────────────────────────────────

const PAIR_COLORS = [
  { bg: 'var(--badge-u-bg)', border: 'var(--badge-u-border)', color: 'var(--badge-u-text)' },
  { bg: 'var(--badge-m-bg)', border: 'var(--badge-m-border)', color: 'var(--badge-m-text)' },
  { bg: 'var(--badge-p-bg)', border: 'var(--badge-p-border)', color: 'var(--badge-p-text)' },
  { bg: 'var(--badge-a-bg)', border: 'var(--badge-a-border)', color: 'var(--badge-a-text)' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── EquationOrder ─────────────────────────────────────────────────────────────
// Tap a token to select it, tap a slot to place it. Tap a filled slot to return it.

const EquationOrder = forwardRef(function EquationOrder({ active, checked, onReadyChange }, ref) {
  const [slots, setSlots] = useState(() => Array(active.solution.length).fill(null))
  const [selected, setSelected] = useState(null)

  const placedIds = new Set(slots.filter(Boolean))

  useEffect(() => { onReadyChange(slots.every(Boolean)) }, [slots])

  useImperativeHandle(ref, () => ({
    evaluate: () => slots.every((s, i) => s === active.solution[i]),
  }), [slots, active.solution])

  function handleTokenClick(id) {
    if (checked) return
    setSelected(p => p === id ? null : id)
  }

  function handleSlotClick(i) {
    if (checked) return
    if (slots[i]) {
      const freed = slots[i]
      setSlots(p => p.map((s, j) => j === i ? null : s))
      setSelected(freed)
    } else if (selected && !placedIds.has(selected)) {
      setSlots(p => p.map((s, j) => j === i ? selected : s))
      setSelected(null)
    }
  }

  const tokenMap = Object.fromEntries(active.tokens.map(t => [t.id, t]))

  return (
    <>
      <div className="active-zone-label">Available tokens</div>
      <div className="token-pool">
        {active.tokens.map(tok => (
          <span
            key={tok.id}
            className={`token${placedIds.has(tok.id) ? ' placed' : ''}${selected === tok.id ? ' token-sel' : ''}`}
            onClick={() => handleTokenClick(tok.id)}
          >
            <MathDisplay latex={tok.latex} />
          </span>
        ))}
      </div>
      <div className="active-zone-label">Your answer</div>
      <div className="equation-slots">
        {slots.map((id, i) => {
          const tok = tokenMap[id]
          const ok  = checked && id === active.solution[i]
          const err = checked && id && id !== active.solution[i]
          return (
            <span
              key={i}
              className={`eq-slot${tok ? ' filled' : ''}${ok ? ' slot-ok' : ''}${err ? ' slot-err' : ''}`}
              onClick={() => handleSlotClick(i)}
            >
              {tok ? <MathDisplay latex={tok.latex} /> : <span className="slot-ph">?</span>}
            </span>
          )
        })}
      </div>
    </>
  )
})

// ── TermMatch ─────────────────────────────────────────────────────────────────
// Tap a term (left), then tap a definition (right) to pair them.
// Tap a paired item to unpair and re-select.

const TermMatch = forwardRef(function TermMatch({ active, checked, onReadyChange }, ref) {
  const [pairs, setPairs]           = useState({}) // { termId: defId }
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [shuffledDefs]              = useState(() => shuffle(active.pairs))

  const pairCount = Object.keys(pairs).length

  useEffect(() => { onReadyChange(pairCount === active.pairs.length) }, [pairCount])

  useImperativeHandle(ref, () => ({
    evaluate: () => active.pairs.every(p => pairs[p.id] === p.id),
  }), [pairs, active.pairs])

  // Assign a stable color index per term as pairs are formed
  const pairColorIndex = {}
  Object.keys(pairs).forEach((termId, i) => { pairColorIndex[termId] = i % PAIR_COLORS.length })

  function pairStyle(termId, isPaired) {
    if (!isPaired) return {}
    const ci = pairColorIndex[termId] ?? 0
    const ok  = checked && pairs[termId] === termId
    const err = checked && pairs[termId] !== termId
    if (ok)  return { background: 'rgba(74,158,106,0.12)', borderColor: 'var(--correct)',   color: 'var(--correct)' }
    if (err) return { background: 'rgba(184,72,72,0.1)',    borderColor: 'var(--incorrect)', color: 'var(--incorrect)' }
    return { background: PAIR_COLORS[ci].bg, borderColor: PAIR_COLORS[ci].border, color: PAIR_COLORS[ci].color }
  }

  function handleTermClick(termId) {
    if (checked) return
    if (pairs[termId] !== undefined) {
      setPairs(p => { const n = { ...p }; delete n[termId]; return n })
      setSelectedTerm(termId)
    } else {
      setSelectedTerm(p => p === termId ? null : termId)
    }
  }

  function handleDefClick(defId) {
    if (checked) return
    if (!selectedTerm) {
      const existingTerm = Object.entries(pairs).find(([, v]) => v === defId)?.[0]
      if (existingTerm) {
        setPairs(p => { const n = { ...p }; delete n[existingTerm]; return n })
        setSelectedTerm(existingTerm)
      }
      return
    }
    setPairs(p => {
      const n = { ...p }
      const displaced = Object.entries(n).find(([, v]) => v === defId)?.[0]
      if (displaced) delete n[displaced]
      n[selectedTerm] = defId
      return n
    })
    setSelectedTerm(null)
  }

  return (
    <div className="term-match">
      <div className="term-match-cols">
        <div className="term-match-col">
          {active.pairs.map(p => {
            const isPaired = pairs[p.id] !== undefined
            return (
              <span
                key={p.id}
                className={`term-item${selectedTerm === p.id ? ' term-sel' : ''}${isPaired ? ' term-paired' : ''}`}
                style={pairStyle(p.id, isPaired)}
                onClick={() => handleTermClick(p.id)}
              >
                <RichText text={p.term} />
              </span>
            )
          })}
        </div>
        <div className="term-match-col">
          {shuffledDefs.map(p => {
            const pairedTerm = Object.entries(pairs).find(([, v]) => v === p.id)?.[0]
            const isPaired   = pairedTerm !== undefined
            const ci = pairColorIndex[pairedTerm] ?? 0
            const ok  = checked && isPaired && pairs[pairedTerm] === pairedTerm
            const err = checked && isPaired && pairs[pairedTerm] !== pairedTerm
            const style = checked && isPaired
              ? ok
                ? { background: 'rgba(74,158,106,0.12)', borderColor: 'var(--correct)',   color: 'var(--correct)' }
                : { background: 'rgba(184,72,72,0.1)',    borderColor: 'var(--incorrect)', color: 'var(--incorrect)' }
              : isPaired
                ? { background: PAIR_COLORS[ci].bg, borderColor: PAIR_COLORS[ci].border, color: PAIR_COLORS[ci].color }
                : {}
            return (
              <span
                key={p.id}
                className={`term-item def-item${isPaired ? ' term-paired' : ''}`}
                style={style}
                onClick={() => handleDefClick(p.id)}
              >
                <RichText text={p.definition} />
              </span>
            )
          })}
        </div>
      </div>
      {!checked && (
        <p className="active-hint">Tap a term on the left, then tap its matching definition on the right.</p>
      )}
    </div>
  )
})

// ── StepOrder ─────────────────────────────────────────────────────────────────
// Tap a step to select it, tap another to swap positions.

const StepOrder = forwardRef(function StepOrder({ active, checked, onReadyChange }, ref) {
  const [order, setOrder]     = useState(() => shuffle(active.solution))
  const [selected, setSelected] = useState(null)

  useEffect(() => { onReadyChange(true) }, [])

  useImperativeHandle(ref, () => ({
    evaluate: () => order.every((s, i) => s === active.solution[i]),
  }), [order, active.solution])

  function handleClick(stepId) {
    if (checked) return
    if (!selected) {
      setSelected(stepId)
    } else if (selected === stepId) {
      setSelected(null)
    } else {
      setOrder(o => {
        const n = [...o]
        const a = n.indexOf(selected)
        const b = n.indexOf(stepId)
        ;[n[a], n[b]] = [n[b], n[a]]
        return n
      })
      setSelected(null)
    }
  }

  const stepMap = Object.fromEntries(active.steps.map(s => [s.id, s]))

  return (
    <div className="step-list">
      <p className="active-hint">
        {checked ? null : 'Tap a step to select it (highlighted), then tap another to swap their positions.'}
      </p>
      {order.map((id, i) => {
        const step = stepMap[id]
        const ok   = checked && id === active.solution[i]
        const err  = checked && id !== active.solution[i]
        return (
          <div
            key={id}
            className={`step-item${selected === id ? ' step-sel' : ''}${ok ? ' step-ok' : ''}${err ? ' step-err' : ''}`}
            onClick={() => handleClick(id)}
          >
            <span className="step-num">{i + 1}</span>
            <span className="step-text"><RichText text={step.text} /></span>
          </div>
        )
      })}
    </div>
  )
})

// ── FillBlanks ────────────────────────────────────────────────────────────────
// Tap a token to select it, then tap a blank slot to fill it.
// Tap a filled slot to return its token to the pool.

const FillBlanks = forwardRef(function FillBlanks({ active, checked, onReadyChange }, ref) {
  const blankCount = active.solution.length
  const [fills, setFills]     = useState(() => Array(blankCount).fill(null))
  const [selected, setSelected] = useState(null)

  const placedIds = new Set(fills.filter(Boolean))

  useEffect(() => { onReadyChange(fills.every(Boolean)) }, [fills])

  useImperativeHandle(ref, () => ({
    evaluate: () => fills.every((f, i) => f === active.solution[i]),
  }), [fills, active.solution])

  function handleTokenClick(id) {
    if (checked) return
    setSelected(p => p === id ? null : id)
  }

  function handleBlankClick(blankIdx) {
    if (checked) return
    if (fills[blankIdx]) {
      setFills(p => p.map((f, i) => i === blankIdx ? null : f))
    } else if (selected) {
      setFills(p => p.map((f, i) => i === blankIdx ? selected : f))
      setSelected(null)
    }
  }

  const tokenMap = Object.fromEntries(active.tokens.map(t => [t.id, t]))

  let blankIdx = 0
  const templateParts = active.template.map((seg, i) => {
    if (seg === null) {
      const idx = blankIdx++
      const tok  = fills[idx] ? tokenMap[fills[idx]] : null
      const ok   = checked && fills[idx] === active.solution[idx]
      const err  = checked && fills[idx] && fills[idx] !== active.solution[idx]
      return (
        <span
          key={i}
          className={`eq-slot${tok ? ' filled' : ''}${ok ? ' slot-ok' : ''}${err ? ' slot-err' : ''}`}
          style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 3px', cursor: 'pointer' }}
          onClick={() => handleBlankClick(idx)}
        >
          {tok ? <MathDisplay latex={tok.latex} /> : <span className="slot-ph">?</span>}
        </span>
      )
    }
    return <span key={i} className="fill-seg"><RichText text={seg} /></span>
  })

  return (
    <>
      <div className="fill-template">{templateParts}</div>
      <div className="active-zone-label" style={{ marginTop: 20 }}>Available tokens</div>
      <div className="token-pool">
        {active.tokens.map(tok => (
          <span
            key={tok.id}
            className={`token${placedIds.has(tok.id) ? ' placed' : ''}${selected === tok.id ? ' token-sel' : ''}`}
            onClick={() => handleTokenClick(tok.id)}
          >
            <MathDisplay latex={tok.latex} />
          </span>
        ))}
      </div>
    </>
  )
})

// ── type map ──────────────────────────────────────────────────────────────────

const TYPE_MAP = {
  'equation-order': EquationOrder,
  'term-match':     TermMatch,
  'step-order':     StepOrder,
  'fill-blanks':    FillBlanks,
}

// ── main export ───────────────────────────────────────────────────────────────

export default function ActiveCard({ question, questionIndex, total, onAnswer, onNext, onSkip }) {
  const [checked,   setChecked]   = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [canCheck,  setCanCheck]  = useState(false)
  const subRef = useRef(null)

  const SubComp = TYPE_MAP[question.active?.type]

  function handleCheck() {
    if (!subRef.current) return
    const correct = subRef.current.evaluate()
    setIsCorrect(correct)
    setChecked(true)
    onAnswer(correct)
  }

  return (
    <div className="question-card">
      <div className="question-card-top">
        <span className="question-num">Question {questionIndex + 1} of {total}</span>
        <LevelBadge level={question.level} />
      </div>

      <p className="question-text"><RichText text={question.question} /></p>

      {question.active?.prompt && (
        <p className="question-subscript" style={{ marginBottom: 20 }}>
          {question.active.prompt}
        </p>
      )}

      {SubComp
        ? <SubComp ref={subRef} active={question.active} checked={checked} onReadyChange={setCanCheck} />
        : <div className="chart-placeholder-body">Unknown question type: {question.active?.type}</div>
      }

      {checked && (
        <div className="explanation">
          <div className="explanation-label">{isCorrect ? 'Correct!' : 'Not quite'}</div>
          <p className="explanation-text"><RichText text={question.active?.explanation} /></p>
        </div>
      )}

      <div className="card-actions">
        <button className="btn btn-ghost" onClick={onSkip}>Skip</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!checked && (
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={!canCheck}
              style={{ opacity: canCheck ? 1 : 0.45 }}
            >
              Check answer
            </button>
          )}
          {checked && (
            <button className="btn btn-next" onClick={onNext}>Next question →</button>
          )}
        </div>
      </div>
    </div>
  )
}
