import Math from './Math.jsx'

/**
 * Tokenise a string into alternating { text } and { math, display } segments.
 *  - $$...$$  → display math
 *  - $...$    → inline math
 *  - \$       → literal dollar sign (not a math delimiter)
 *
 * Escaped dollars are kept as text. Unmatched / unbalanced delimiters fall
 * through as plain text (we never throw).
 */
function tokenise(text) {
  const out = []
  let buf = ''
  let i = 0
  const flushText = () => { if (buf) { out.push({ kind: 'text', value: buf }); buf = '' } }

  while (i < text.length) {
    const ch = text[i]

    // Escaped dollar — \$ -> literal $
    if (ch === '\\' && text[i + 1] === '$') {
      buf += '$'
      i += 2
      continue
    }

    if (ch === '$') {
      // Display math?
      if (text[i + 1] === '$') {
        const end = text.indexOf('$$', i + 2)
        if (end !== -1) {
          flushText()
          out.push({ kind: 'math', value: text.slice(i + 2, end), display: true })
          i = end + 2
          continue
        }
        // Unmatched $$ — treat as literal
        buf += '$$'
        i += 2
        continue
      }
      // Inline math
      const end = text.indexOf('$', i + 1)
      if (end !== -1) {
        flushText()
        out.push({ kind: 'math', value: text.slice(i + 1, end), display: false })
        i = end + 1
        continue
      }
      // Unmatched $ — literal
      buf += '$'
      i += 1
      continue
    }

    buf += ch
    i += 1
  }
  flushText()
  return out
}

export default function RichText({ text }) {
  if (text == null || text === '') return null
  const parts = tokenise(String(text))
  return (
    <>
      {parts.map((p, i) =>
        p.kind === 'text'
          ? <span key={i}>{p.value}</span>
          : <Math key={i} latex={p.value} display={p.display} />
      )}
    </>
  )
}
