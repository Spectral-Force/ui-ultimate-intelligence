/**
 * Simple keyword search across questions.
 * Matches against question, equation, passive.options, passive.explanation,
 * active.prompt, active.explanation.
 */

function normalise(s) {
  return String(s ?? '').toLowerCase()
}

function questionHaystack(q) {
  const parts = [
    q.question,
    q.equation,
    q.passive?.explanation,
    q.passive?.options?.join(' '),
    q.active?.prompt,
    q.active?.explanation,
    q.active?.pairs?.map(p => `${p.term} ${p.definition}`).join(' '),
    q.active?.steps?.map(s => s.text).join(' '),
    q.active?.tokens?.map(t => t.latex).join(' '),
  ]
  return normalise(parts.filter(Boolean).join('   '))
}

const haystackCache = new WeakMap()

export function searchQuestions(allQuestions, queryRaw) {
  const query = normalise(queryRaw).trim()
  if (!query) return []
  // Split into AND tokens
  const tokens = query.split(/\s+/).filter(Boolean)
  return allQuestions.filter(q => {
    let hay = haystackCache.get(q)
    if (!hay) {
      hay = questionHaystack(q)
      haystackCache.set(q, hay)
    }
    return tokens.every(t => hay.includes(t))
  })
}
