/**
 * Keyword search across questions with relevance ranking.
 *
 * Fields searched (weighted): question text and equation rank highest, then
 * active prompt / option text, then explanations. A whole-word or exact-phrase
 * match scores above a substring match, so a query like "Hooke's law" or
 * "Born rule" surfaces the card that is actually about that law first.
 */

function normalise(s) {
  return String(s ?? '').toLowerCase()
}

// Weighted field groups: [text, weight]
function questionFields(q) {
  return [
    [q.question, 10],
    [q.equation, 6],
    [q.active?.prompt, 5],
    [q.passive?.options?.join('   '), 4],
    [q.active?.pairs?.map(p => `${p.term} ${p.definition}`).join('   '), 4],
    [q.active?.steps?.map(s => s.text).join('   '), 3],
    [q.passive?.explanation, 2],
    [q.active?.explanation, 2],
    [Array.isArray(q.path) ? q.path.join(' ') : '', 3],
  ].filter(([t]) => t)
}

const fieldCache = new WeakMap()

function getFields(q) {
  let f = fieldCache.get(q)
  if (!f) {
    f = questionFields(q).map(([t, w]) => [normalise(t), w])
    fieldCache.set(q, f)
  }
  return f
}

function scoreQuestion(fields, tokens, phrase) {
  let score = 0
  // Every token must appear somewhere (AND semantics); track that.
  for (const tok of tokens) {
    let tokenScore = 0
    const wordRe = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, '')
    for (const [text, weight] of fields) {
      if (!text.includes(tok)) continue
      // word-boundary (prefix) match scores higher than mid-word substring
      tokenScore = Math.max(tokenScore, weight * (wordRe.test(text) ? 1 : 0.5))
    }
    if (tokenScore === 0) return -1 // token missing → exclude
    score += tokenScore
  }
  // Exact-phrase bonus (multi-word queries): big boost where the whole phrase
  // appears in a high-weight field.
  if (phrase && tokens.length > 1) {
    for (const [text, weight] of fields) {
      if (text.includes(phrase)) { score += weight * 3; break }
    }
  }
  return score
}

export function searchQuestions(allQuestions, queryRaw) {
  const query = normalise(queryRaw).trim()
  if (!query) return []
  const tokens = query.split(/\s+/).filter(Boolean)
  const scored = []
  for (const q of allQuestions) {
    const s = scoreQuestion(getFields(q), tokens, query)
    if (s >= 0) scored.push([s, q])
  }
  scored.sort((a, b) => b[0] - a[0])
  return scored.map(([, q]) => q)
}
