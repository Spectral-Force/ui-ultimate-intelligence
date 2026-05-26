import { useState, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { allQuestions } from '../questions/index.js'
import { CATEGORIES } from '../data/categories.js'

// ── colour helpers ────────────────────────────────────────────────────────────

function pct(n) { return Math.round(n * 100) }

function barColor(accuracy) {
  if (accuracy >= 0.8) return '#4a9e8e'
  if (accuracy >= 0.6) return '#c8913a'
  return '#c05048'
}

// Build id→label map from category tree
function buildLabelMap(nodes, map = {}) {
  nodes.forEach(n => {
    map[n.id] = n.label
    if (n.children) buildLabelMap(n.children, map)
  })
  return map
}
const LABEL_MAP = buildLabelMap(CATEGORIES)

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

function ChartShell({ title, children, empty, emptyMsg }) {
  return (
    <div className="chart-placeholder">
      <div className="chart-placeholder-title">{title}</div>
      {empty
        ? <div className="chart-placeholder-body">{emptyMsg}</div>
        : children}
    </div>
  )
}

const AXIS_STYLE  = { fontSize: 11, fill: 'var(--text-muted)' }
const TOOLTIP_STYLE = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  color: 'var(--text-primary)',
}

// ── accuracy over time ────────────────────────────────────────────────────────

function AccuracyHistory({ sessions }) {
  const data = sessions.slice(-15).map((s, i) => ({
    label: `#${i + 1}`,
    accuracy: pct(s.accuracy),
    raw: s.accuracy,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={v => [`${v}%`, 'Accuracy']}
          cursor={{ fill: 'var(--bg-hover)' }}
        />
        <ReferenceLine y={70} stroke="var(--border-strong)" strokeDasharray="3 3" />
        <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={barColor(d.raw)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── consolidation chart ───────────────────────────────────────────────────────

function ConsolidationChart({ runs }) {
  const data = runs.map((s, i) => ({
    run: `Run ${i + 1}`,
    accuracy: pct(s.accuracy),
    raw: s.accuracy,
    date: new Date(s.date).toLocaleDateString(),
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="run" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={v => [`${v}%`, 'Accuracy']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
          cursor={{ stroke: 'var(--border-strong)' }}
        />
        <ReferenceLine y={70} stroke="var(--border-strong)" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#4a9e8e"
          strokeWidth={2}
          dot={{ fill: '#4a9e8e', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── per-category bars (plain CSS) ─────────────────────────────────────────────

function CategoryBars({ catStats }) {
  const entries = Object.entries(catStats)
    .map(([cat, s]) => ({ cat, label: LABEL_MAP[cat] ?? cat, acc: s.correct / s.seen, seen: s.seen }))
    .sort((a, b) => b.acc - a.acc)

  if (entries.length === 0) return (
    <div className="chart-placeholder-body">Answer questions across multiple categories to see a breakdown.</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(({ cat, label, acc, seen }) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 160, flexShrink: 0 }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct(acc)}%`, background: barColor(acc), borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 42, textAlign: 'right' }}>
            {pct(acc)}%
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 48, textAlign: 'right' }}>
            ({seen} seen)
          </span>
        </div>
      ))}
    </div>
  )
}

// ── data panel ────────────────────────────────────────────────────────────────

function DataPanel({ exportProgress, importProgress }) {
  const [status, setStatus] = useState(null)
  const [busy, setBusy]     = useState(false)
  const fileRef = useRef(null)

  async function handleExport() {
    if (busy) return
    setBusy(true)
    try {
      const data = await exportProgress()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ui-progress-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ ok: true, msg: `Exported ${data.sessions?.length ?? 0} sessions.` })
    } catch (e) {
      setStatus({ ok: false, msg: `Export failed: ${e.message}` })
    } finally {
      setBusy(false)
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || busy) { e.target.value = ''; return }
    setBusy(true)
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await importProgress(payload)
      setStatus({ ok: true, msg: `Imported ${payload.sessions?.length ?? 0} sessions successfully.` })
    } catch (e) {
      setStatus({ ok: false, msg: `Import failed: ${e.message}` })
    } finally {
      e.target.value = ''
      setBusy(false)
    }
  }

  return (
    <div className="chart-placeholder">
      <div className="chart-placeholder-title">Data</div>
      <div className="data-panel-actions">
        <button className="btn btn-ghost" onClick={handleExport} disabled={busy}>
          {busy ? 'Working…' : 'Export JSON'}
        </button>
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Working…' : 'Import JSON'}
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
      {status && (
        <div className={`data-panel-status${status.ok ? ' ok' : ' err'}`}>{status.msg}</div>
      )}
    </div>
  )
}

// ── main export ───────────────────────────────────────────────────────────────

export default function StatsView({ progress, currentSetKey, activeMode }) {
  const {
    totalSessions,
    overallAccuracy,
    bestAccuracy,
    sessions,
    consolidationRuns,
    categoryStats,
    exportProgress,
    importProgress,
    loaded,
    loadError,
  } = progress

  // currentSetKey is already mode-prefixed by App.jsx (e.g. "passive:..."),
  // so we don't need to pass mode separately — same key implies same mode.
  const catStats  = categoryStats(allQuestions)
  const consRuns  = currentSetKey ? consolidationRuns(currentSetKey) : []
  const recentSessions = sessions.slice(-15)

  if (!loaded) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</div>
  }

  if (loadError) {
    return (
      <div className="error-boundary" style={{ margin: '20px 0' }}>
        <div className="error-boundary-icon">⚠</div>
        <div className="error-boundary-title">Couldn't load progress data</div>
        <p className="error-boundary-body">
          The local progress database failed to load. This can happen in private-browsing
          mode or if storage is full.
        </p>
        <pre className="error-boundary-detail">{String(loadError.message ?? loadError)}</pre>
      </div>
    )
  }

  return (
    <div>
      {/* ── overview cards ── */}
      <div className="stats-grid">
        <StatCard
          label="Sessions"
          value={totalSessions || '—'}
          sub={totalSessions ? `${totalSessions} completed` : 'No sessions yet'}
        />
        <StatCard
          label="Overall accuracy"
          value={overallAccuracy !== null ? `${pct(overallAccuracy)}%` : '—'}
          sub={overallAccuracy !== null ? 'across all sessions' : 'Answer questions to track'}
        />
        <StatCard
          label="Best session"
          value={bestAccuracy !== null ? `${pct(bestAccuracy)}%` : '—'}
          sub={bestAccuracy !== null ? 'personal best' : 'No sessions yet'}
        />
      </div>

      {/* ── accuracy history ── */}
      <ChartShell
        title={`Accuracy over time${recentSessions.length > 0 ? ` (last ${recentSessions.length} sessions)` : ''}`}
        empty={recentSessions.length === 0}
        emptyMsg="Complete a session to see your accuracy history here."
      >
        <AccuracyHistory sessions={recentSessions} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Dashed line at 70% · teal = ≥80% · amber = 60–80% · coral = &lt;60%
        </div>
      </ChartShell>

      {/* ── consolidation ── */}
      <ChartShell
        title={`Consolidation — same set, repeated${consRuns.length > 0 ? ` (${consRuns.length} runs)` : ''}`}
        empty={consRuns.length < 2}
        emptyMsg={
          currentSetKey
            ? consRuns.length === 1
              ? 'One run recorded for this set. Play it again to start tracking consolidation.'
              : 'Select categories above, complete a session, then repeat it to see your consolidation curve here.'
            : 'Select categories, complete a session, then replay the same set to compare runs.'
        }
      >
        <ConsolidationChart runs={consRuns} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Each point is a completed session of the same question set
        </div>
      </ChartShell>

      {/* ── per-category ── */}
      <ChartShell
        title="Accuracy by topic"
        empty={Object.keys(catStats).length === 0}
        emptyMsg="Answer questions across different categories to see a per-topic breakdown."
      >
        <CategoryBars catStats={catStats} />
      </ChartShell>

      {/* ── data export/import ── */}
      <DataPanel exportProgress={exportProgress} importProgress={importProgress} />
    </div>
  )
}
