/**
 * Per-category mastery badges:
 *   U-mastered: >70% accuracy across ≥5 seen U-level questions in that category
 *   M-mastered: ditto at M
 *   P/A-mastered: ditto at P/A
 * Categories grouped by path[1].
 */
export default function MasteryBadges({ allQuestions, history, labelMap }) {
  const stats = {}  // { cat: { U: {seen, correct}, M, P, A } }
  for (const q of allQuestions) {
    const h = history[q.id]
    if (!h || h.seen === 0) continue
    const cat = q.path[1] ?? q.path[0]
    if (!stats[cat]) stats[cat] = {}
    if (!stats[cat][q.level]) stats[cat][q.level] = { seen: 0, correct: 0 }
    stats[cat][q.level].seen    += h.seen
    stats[cat][q.level].correct += h.correct
  }

  const rows = Object.entries(stats).map(([cat, byLvl]) => {
    const badges = ['U', 'M', 'P', 'A'].map(lvl => {
      const s = byLvl[lvl]
      if (!s || s.seen < 5) return { lvl, status: 'locked', acc: 0 }
      const acc = s.correct / s.seen
      const status = acc >= 0.7 ? 'mastered' : acc >= 0.5 ? 'practising' : 'learning'
      return { lvl, status, acc }
    })
    return { cat, label: labelMap[cat] ?? cat, badges }
  }).sort((a, b) => a.label.localeCompare(b.label))

  if (rows.length === 0) {
    return <div className="chart-placeholder-body">Answer at least 5 questions in a category to unlock mastery badges.</div>
  }

  return (
    <div className="mastery-list">
      {rows.map(r => (
        <div key={r.cat} className="mastery-row">
          <span className="mastery-label">{r.label}</span>
          <div className="mastery-badges">
            {r.badges.map(b => (
              <span
                key={b.lvl}
                className={`mastery-pill mastery-${b.status} mastery-lvl-${b.lvl}`}
                title={b.status === 'locked' ? 'Not enough data' : `${Math.round(b.acc * 100)}% accuracy`}
              >
                {b.lvl}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
