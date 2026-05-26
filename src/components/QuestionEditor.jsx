import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/categories.js'

/**
 * In-app authoring of a new (or edit existing) user question.
 * Currently supports passive multiple-choice + optional figure (URL or inline SVG).
 */

function flattenLeaves(nodes, out = [], trail = []) {
  for (const n of nodes) {
    const next = [...trail, n.id]
    if (!n.children?.length) out.push({ leafId: n.id, label: n.label, path: next })
    else flattenLeaves(n.children, out, next)
  }
  return out
}
const LEAVES = flattenLeaves(CATEGORIES)

const LEVELS = [
  { id: 'U', label: 'Undergrad' },
  { id: 'M', label: "Master's"  },
  { id: 'P', label: 'PhD'       },
  { id: 'A', label: 'Academic'  },
]

function emptyDraft() {
  return {
    id: `usr-${Date.now().toString(36)}`,
    leafId: LEAVES[0]?.leafId ?? '',
    level: 'M',
    question: '',
    equation: '',
    figureUrl: '',
    options: ['', '', '', ''],
    correct: 0,
    multi: false,
    correctIndices: [],
    explanation: '',
  }
}

export default function QuestionEditor({ open, initial, onClose, onSave }) {
  const [draft, setDraft] = useState(emptyDraft)

  useEffect(() => {
    if (open) {
      if (initial) {
        // Convert stored shape back to draft
        const leaf = initial.path?.[initial.path.length - 1] ?? LEAVES[0].leafId
        setDraft({
          id: initial.id,
          leafId: leaf,
          level: initial.level ?? 'M',
          question: initial.question ?? '',
          equation: initial.equation ?? '',
          figureUrl: typeof initial.figure === 'string' ? initial.figure : (initial.figure?.src ?? ''),
          options: initial.passive?.options ?? ['', '', '', ''],
          correct: initial.passive?.correct ?? 0,
          multi: !!initial.passive?.multi,
          correctIndices: initial.passive?.correctIndices ?? [],
          explanation: initial.passive?.explanation ?? '',
        })
      } else {
        setDraft(emptyDraft())
      }
    }
  }, [open, initial])

  if (!open) return null

  const leaf = LEAVES.find(l => l.leafId === draft.leafId)
  const path = leaf?.path ?? ['physics', draft.leafId]
  const validOptions = draft.options.filter(o => o.trim().length > 0)
  const canSave = draft.question.trim().length > 0 && validOptions.length >= 2 && draft.explanation.trim().length > 0

  function update(key, value) { setDraft(d => ({ ...d, [key]: value })) }
  function updateOption(i, value) {
    setDraft(d => {
      const next = [...d.options]
      next[i] = value
      return { ...d, options: next }
    })
  }

  function handleSave() {
    if (!canSave) return
    const cleanOpts = draft.options.filter(o => o.trim().length > 0)
    const passive = {
      options: cleanOpts,
      explanation: draft.explanation.trim(),
    }
    if (draft.multi) {
      passive.multi = true
      passive.correctIndices = draft.correctIndices.filter(i => i < cleanOpts.length)
      passive.correct = passive.correctIndices[0] ?? 0
    } else {
      passive.correct = Math.min(draft.correct, cleanOpts.length - 1)
    }
    const out = {
      id: draft.id,
      path,
      level: draft.level,
      modes: ['passive'],
      question: draft.question.trim(),
      passive,
      userAuthored: true,
    }
    if (draft.equation.trim()) out.equation = draft.equation.trim()
    if (draft.figureUrl.trim()) out.figure = draft.figureUrl.trim()
    onSave(out)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial ? 'Edit question' : 'New question'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span>Topic</span>
            <select value={draft.leafId} onChange={e => update('leafId', e.target.value)}>
              {LEAVES.map(l => (
                <option key={l.leafId} value={l.leafId}>{l.label}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Level</span>
            <div className="field-radio-row">
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  type="button"
                  className={`field-radio${draft.level === l.id ? ' active' : ''}`}
                  onClick={() => update('level', l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span>Question</span>
            <textarea
              rows={3}
              value={draft.question}
              onChange={e => update('question', e.target.value)}
              placeholder="What is the Doppler limit for ⁸⁷Rb?"
            />
          </label>

          <label className="field">
            <span>Equation (LaTeX, optional)</span>
            <input
              type="text"
              value={draft.equation}
              onChange={e => update('equation', e.target.value)}
              placeholder="T_D = \frac{\hbar\Gamma}{2k_B}"
            />
          </label>

          <label className="field">
            <span>Figure URL or inline SVG (optional)</span>
            <input
              type="text"
              value={draft.figureUrl}
              onChange={e => update('figureUrl', e.target.value)}
              placeholder="https://… or <svg>…</svg>"
            />
          </label>

          <label className="field">
            <span>Multiple correct answers?</span>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={draft.multi}
                onChange={e => update('multi', e.target.checked)}
              />
              <span>Allow multiple correct options</span>
            </label>
          </label>

          <div className="field">
            <span>Options</span>
            {draft.options.map((opt, i) => (
              <div key={i} className="option-edit-row">
                {draft.multi ? (
                  <input
                    type="checkbox"
                    checked={draft.correctIndices.includes(i)}
                    onChange={(e) => {
                      setDraft(d => {
                        const ci = new Set(d.correctIndices)
                        e.target.checked ? ci.add(i) : ci.delete(i)
                        return { ...d, correctIndices: [...ci].sort((a, b) => a - b) }
                      })
                    }}
                  />
                ) : (
                  <input
                    type="radio"
                    name="correct-opt"
                    checked={draft.correct === i}
                    onChange={() => update('correct', i)}
                  />
                )}
                <input
                  type="text"
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => update('options', [...draft.options, ''])}
            >
              + Add option
            </button>
          </div>

          <label className="field">
            <span>Explanation</span>
            <textarea
              rows={4}
              value={draft.explanation}
              onChange={e => update('explanation', e.target.value)}
              placeholder="Why is this the correct answer? Use $...$ for inline math."
            />
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {initial ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </div>
    </div>
  )
}
