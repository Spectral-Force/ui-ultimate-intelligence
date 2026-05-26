import { useState } from 'react'
import RichText from './RichText.jsx'

/**
 * Show-on-demand hint — derived from the first sentence(s) of the explanation.
 * Tracks whether the user revealed it (parent stores the flag).
 */
function deriveHint(text) {
  if (!text) return ''
  // First sentence, capped at ~180 chars.
  const sentence = String(text).split(/(?<=[.!?])\s/)[0] ?? text
  return sentence.length > 180 ? sentence.slice(0, 178).trim() + '…' : sentence
}

export default function HintBlock({ sourceText, onReveal }) {
  const [revealed, setRevealed] = useState(false)
  const hint = deriveHint(sourceText)
  if (!hint) return null

  if (!revealed) {
    return (
      <button
        type="button"
        className="hint-toggle"
        onClick={() => { setRevealed(true); onReveal?.() }}
      >
        💡 Show hint
      </button>
    )
  }
  return (
    <div className="hint-block" role="note">
      <span className="hint-label">Hint</span>
      <span className="hint-text"><RichText text={hint} /></span>
    </div>
  )
}
