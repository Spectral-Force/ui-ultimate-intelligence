/**
 * GitHub-style activity heatmap — last 91 days (13 weeks).
 * Counts sessions per calendar day.
 */
const WEEKS = 13
const DAY_MS = 86400_000

function dayStart(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function ActivityHeatmap({ sessions }) {
  const today = dayStart(Date.now())
  const startDay = today - (WEEKS * 7 - 1) * DAY_MS

  // Count sessions per day
  const counts = new Map()
  for (const s of sessions) {
    const ds = dayStart(s.date)
    if (ds < startDay) continue
    counts.set(ds, (counts.get(ds) ?? 0) + 1)
  }

  // Compute streak (consecutive days from today backwards)
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = today - i * DAY_MS
    if (counts.get(d) > 0) streak++
    else if (i === 0) {} // allow today to be empty without breaking streak yet
    else break
  }

  // If today is empty, streak doesn't include today; check yesterday for live streak
  if (!counts.get(today)) {
    const y = today - DAY_MS
    if (counts.get(y) > 0) {
      let s = 0
      for (let i = 1; i < 365; i++) {
        if (counts.get(today - i * DAY_MS)) s++
        else break
      }
      streak = s
    } else streak = 0
  }

  // Build grid: each column = a week, each cell = a day
  const cells = []
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = startDay + i * DAY_MS
    cells.push({ date: d, count: counts.get(d) ?? 0 })
  }

  // Group into weeks (columns)
  const weeks = []
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * 7, (w + 1) * 7))
  }

  function intensity(n) {
    if (n === 0) return 0
    if (n === 1) return 1
    if (n <= 3) return 2
    if (n <= 6) return 3
    return 4
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-streak">
        <span className="heatmap-streak-num">{streak}</span>
        <span className="heatmap-streak-label">day streak</span>
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-col">
            {week.map(cell => (
              <div
                key={cell.date}
                className="heatmap-cell"
                data-level={intensity(cell.count)}
                title={`${new Date(cell.date).toLocaleDateString()}: ${cell.count} session${cell.count === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => <span key={l} className="heatmap-cell" data-level={l} />)}
        <span>More</span>
      </div>
    </div>
  )
}
