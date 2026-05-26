const MOCK_BARS = [38, 55, 48, 62, 74, 80, 76, 88]

export default function StatsPlaceholder() {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Sessions</div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-sub">No sessions yet</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Overall accuracy</div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-sub">Answer questions to track</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Best streak</div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-sub">Consecutive correct answers</div>
        </div>
      </div>

      <div className="chart-placeholder">
        <div className="chart-placeholder-title">Accuracy over time</div>
        <div className="chart-placeholder-body" style={{ flexDirection: 'column', gap: 8 }}>
          <div className="chart-mock-bars" style={{ width: '100%' }}>
            {MOCK_BARS.map((h, i) => (
              <div key={i} className="chart-mock-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
          <span style={{ fontSize: '0.75rem' }}>Complete a session to populate this chart</span>
        </div>
      </div>

      <div className="chart-placeholder">
        <div className="chart-placeholder-title">Consolidation runs</div>
        <div className="chart-placeholder-body">
          Once you exhaust a question set and replay it, each run will appear here so you can compare how your score improves across repetitions.
        </div>
      </div>

      <div className="chart-placeholder">
        <div className="chart-placeholder-title">Accuracy by category</div>
        <div className="chart-placeholder-body">
          Per-category breakdown appears here after your first session.
        </div>
      </div>
    </div>
  )
}
