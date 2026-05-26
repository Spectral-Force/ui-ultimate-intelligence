import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { retentionEstimate } from '../lib/srs.js'

const AXIS_STYLE  = { fontSize: 11, fill: 'var(--text-muted)' }
const TOOLTIP_STYLE = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  color: 'var(--text-primary)',
}

/**
 * Plots estimated retention probability per category, based on SRS state.
 * X axis: category label; Y axis: average current retention (0..100).
 */
export default function ForgettingCurve({ allQuestions, questionMeta, labelMap }) {
  const groups = {}
  const now = Date.now()
  for (const q of allQuestions) {
    const m = questionMeta[q.id]
    if (!m || !m.lastSeen) continue
    const r = retentionEstimate({ lastSeen: m.lastSeen, interval: m.interval ?? 1 }, now)
    if (r == null) continue
    const cat = q.path[1] ?? q.path[0]
    if (!groups[cat]) groups[cat] = { sum: 0, n: 0 }
    groups[cat].sum += r
    groups[cat].n   += 1
  }
  const data = Object.entries(groups).map(([cat, { sum, n }]) => ({
    cat: labelMap[cat] ?? cat,
    retention: Math.round((sum / n) * 100),
  })).sort((a, b) => a.retention - b.retention)

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 24 }}>
        <XAxis
          dataKey="cat"
          tick={{ ...AXIS_STYLE, angle: -30, textAnchor: 'end' }}
          interval={0}
          axisLine={false}
          tickLine={false}
          height={50}
        />
        <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Retention']} />
        <ReferenceLine y={50} stroke="var(--border-strong)" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="retention" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
