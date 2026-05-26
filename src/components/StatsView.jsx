import { useState, useRef, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { useAllQuestions } from '../hooks/useAllQuestions.js'
import { CATEGORIES } from '../data/categories.js'
import ActivityHeatmap from './ActivityHeatmap.jsx'
import ForgettingCurve from './ForgettingCurve.jsx'
import MasteryBadges from './MasteryBadges.jsx'
import FlaggedList from './FlaggedList.jsx'

function pct(n) { return Math.round(n * 100) }

function barColor(accuracy) {
  if (accuracy >= 0.8) return '#4a9e8e'
  if (accuracy >= 0.6) return '#c8913a'
  return '#c05048'
}

function buildLabelMap(nodes, map = {}) {
  nodes.forEach(n => {
    map[n.id] = n.label
    if (n.children) buildLabelMap(n.children, map)
  })
  return map
}
const LABEL_MAP = buildLabelMap(CATEGORIES)

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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 160, flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct(acc)}%`, background: barColor(acc), borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 42, textAlign: 'right' }}>{pct(acc)}%</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 48, textAlign: 'right' }}>({seen} seen)</span>
        </div>
      ))}
    </div>
  )
}

/** Passive vs Active accuracy comparison from sessions. */
function ModeCompare({ sessions }) {
  const grouped = { passive: { acc: 0, n: 0 }, active: { acc: 0, n: 0 } }
  for (const s of sessions) {
    if (!grouped[s.mode]) continue
    grouped[s.mode].acc += s.accuracy
    grouped[s.mode].n   += 1
  }
  const data = ['passive', 'active'].map(m => ({
    mode: m === 'passive' ? 'Passive' : 'Active',
    accuracy: grouped[m].n > 0 ? pct(grouped[m].acc / grouped[m].n) : 0,
    sessions: grouped[m].n,
  }))
  if (data.every(d => d.sessions === 0)) {
    return <div className="chart-placeholder-body">Complete sessions in both modes to compare.</div>
  }
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="mode" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, _, p) => [`${v}%`, `${p.payload.sessions} sessions`]} cursor={{ fill: 'var(--bg-hover)' }} />
        <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={barColor(d.accuracy / 100)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Per-question quality stats: hardest, most skipped, most flagged. */
function QuestionQualityList({ allQuestions, history, meta }) {
  const items = []
  for (const q of allQuestions) {
    const h = history[q.id]; const m = meta[q.id]
    if (!h || h.seen < 2) continue
    const acc = h.correct / h.seen
    const skipRate = h.skipped ? h.skipped / (h.seen + h.skipped) : 0
    items.push({
      q,
      acc,
      seen: h.seen,
      skipRate,
      flagged: !!m?.flagged,
      score: (1 - acc) + skipRate * 0.5 + (m?.flagged ? 0.3 : 0),
    })
  }
  items.sort((a, b) => b.score - a.score)
  const top = items.slice(0, 8)
  if (top.length === 0) {
    return <div className="chart-placeholder-body">Not enough data yet. Answer more questions to see which ones trip you up most.</div>
  }
  return (
    <ul className="quality-list">
      {top.map(({ q, acc, seen, skipRate, flagged }) => (
        <li key={q.id} className="quality-item">
          <div className="quality-meta">
            <span className={`level-badge ${q.level}`}>{q.level}</span>
            {flagged && <span className="quality-tag">⚑</span>}
            <span className="quality-cat">{LABEL_MAP[q.path[1]] ?? q.path[1]}</span>
          </div>
          <div className="quality-text">{String(q.question).slice(0, 110)}{q.question.length > 110 ? '…' : ''}</div>
          <div className="quality-stats">
            <span>{pct(acc)}% accuracy</span>
            <span>·</span>
            <span>{seen} seen</span>
            {skipRate > 0 && <><span>·</span><span>{pct(skipRate)}% skipped</span></>}
          </div>
        </li>
      ))}
    </ul>
  )
}

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
    } finally { setBusy(false) }
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
        <button className="btn btn-ghost" onClick={handleExport} disabled={busy}>{busy ? 'Working…' : 'Export JSON'}</button>
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? 'Working…' : 'Import JSON'}</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
      {status && <div className={`data-panel-status${status.ok ? ' ok' : ' err'}`}>{status.msg}</div>}
    </div>
  )
}

// ── main export ──────────────────────────────────────────────────────────────

export default function StatsView({ progress, currentSetKey, onAddQuestion }) {
  const allQuestions = useAllQuestions()
  const {
    totalSessions, overallAccuracy, bestAccuracy,
    sessions, consolidationRuns, categoryStats,
    questionHistory, questionMeta,
    exportProgress, importProgress,
    toggleFlag,
    loaded, loadError,
  } = progress

  const catStats  = useMemo(() => categoryStats(allQuestions), [categoryStats, allQuestions])
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
        <p className="error-boundary-body">Storage failed to load. This can happen in private-browsing mode.</p>
        <pre className="error-boundary-detail">{String(loadError.message ?? loadError)}</pre>
      </div>
    )
  }

  return (
    <div>
      <div className="stats-grid">
        <StatCard label="Sessions"          value={totalSessions || '—'} sub={totalSessions ? `${totalSessions} completed` : 'No sessions yet'} />
        <StatCard label="Overall accuracy"  value={overallAccuracy !== null ? `${pct(overallAccuracy)}%` : '—'} sub={overallAccuracy !== null ? 'across all sessions' : 'Answer questions to track'} />
        <StatCard label="Best session"      value={bestAccuracy !== null ? `${pct(bestAccuracy)}%` : '—'} sub={bestAccuracy !== null ? 'personal best' : 'No sessions yet'} />
      </div>

      <ChartShell title="Activity">
        <ActivityHeatmap sessions={sessions} />
      </ChartShell>

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

      <ChartShell
        title={`Consolidation — same set, repeated${consRuns.length > 0 ? ` (${consRuns.length} runs)` : ''}`}
        empty={consRuns.length < 2}
        emptyMsg={currentSetKey
          ? consRuns.length === 1
            ? 'One run recorded for this set. Play it again to start tracking consolidation.'
            : 'Select categories above, complete a session, then repeat it to see your consolidation curve here.'
          : 'Select categories, complete a session, then replay the same set to compare runs.'}
      >
        <ConsolidationChart runs={consRuns} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Each point is a completed session of the same question set
        </div>
      </ChartShell>

      <ChartShell title="Passive vs Active accuracy">
        <ModeCompare sessions={sessions} />
      </ChartShell>

      <ChartShell title="Estimated retention by topic">
        <ForgettingCurve allQuestions={allQuestions} questionMeta={questionMeta} labelMap={LABEL_MAP} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Modelled from spaced-repetition interval and time since last seen
        </div>
      </ChartShell>

      <ChartShell title="Mastery by topic & level">
        <MasteryBadges allQuestions={allQuestions} history={questionHistory} labelMap={LABEL_MAP} />
      </ChartShell>

      <ChartShell title="Accuracy by topic"
        empty={Object.keys(catStats).length === 0}
        emptyMsg="Answer questions across different categories to see a per-topic breakdown.">
        <CategoryBars catStats={catStats} />
      </ChartShell>

      <ChartShell title="Questions that trip you up">
        <QuestionQualityList allQuestions={allQuestions} history={questionHistory} meta={questionMeta} />
      </ChartShell>

      <ChartShell title="Flagged & noted questions">
        <FlaggedList
          allQuestions={allQuestions}
          questionMeta={questionMeta}
          onUnflag={toggleFlag}
        />
      </ChartShell>

      {onAddQuestion && (
        <div className="chart-placeholder">
          <div className="chart-placeholder-title">Author your own questions</div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Add a question to your personal bank. It'll appear alongside the built-in questions wherever the topic and level match.
          </p>
          <button className="btn btn-primary" onClick={onAddQuestion}>+ Add question</button>
        </div>
      )}

      <DataPanel exportProgress={exportProgress} importProgress={importProgress} />
    </div>
  )
}
