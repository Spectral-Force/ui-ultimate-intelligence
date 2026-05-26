import Dexie from 'dexie'

export const db = new Dexie('UltimateIntelligence')

db.version(1).stores({
  // completed sessions
  sessions: '++id, date, setKey, mode',
  // per-question lifetime stats
  questionHistory: 'questionId',
})

const SCHEMA_VERSION = 2

// ── helpers ──────────────────────────────────────────────

export async function persistSession(sessionData, answers) {
  await db.transaction('rw', db.sessions, db.questionHistory, async () => {
    await db.sessions.add({ schemaVersion: SCHEMA_VERSION, ...sessionData })

    // batch-load existing history rows so we can update them in one bulkPut
    const ids = [...new Set(answers.map(a => a.questionId))]
    const existing = await db.questionHistory.bulkGet(ids)
    const map = new Map()
    ids.forEach((id, i) => {
      map.set(id, existing[i] ?? { questionId: id, seen: 0, correct: 0, skipped: 0, lastSeen: 0 })
    })

    const now = Date.now()
    for (const a of answers) {
      const row = map.get(a.questionId)
      row.seen    += 1
      row.correct += a.correct ? 1 : 0
      row.skipped += a.skipped ? 1 : 0
      row.lastSeen = now
      row.schemaVersion = SCHEMA_VERSION
    }
    await db.questionHistory.bulkPut([...map.values()])
  })
}

export async function loadAllSessions() {
  return db.sessions.orderBy('date').toArray()
}

export async function loadQuestionHistory() {
  const rows = await db.questionHistory.toArray()
  return Object.fromEntries(rows.map(r => [r.questionId, r]))
}

export async function exportData() {
  const [sessions, histRows] = await Promise.all([
    db.sessions.toArray(),
    db.questionHistory.toArray(),
  ])
  return {
    version: 1,
    schemaVersion: SCHEMA_VERSION,
    exported: Date.now(),
    sessions,
    questionHistory: Object.fromEntries(histRows.map(r => [r.questionId, r])),
  }
}

export async function importData(payload) {
  if (payload.version !== 1) throw new Error(`Unknown export version: ${payload.version}`)
  if (!Array.isArray(payload.sessions)) throw new Error('Export payload: sessions must be an array')
  if (payload.questionHistory && typeof payload.questionHistory !== 'object') {
    throw new Error('Export payload: questionHistory must be an object')
  }
  await db.transaction('rw', db.sessions, db.questionHistory, async () => {
    await db.sessions.clear()
    await db.questionHistory.clear()
    if (payload.sessions?.length) {
      await db.sessions.bulkAdd(payload.sessions.map(({ id, ...rest }) => rest))
    }
    if (payload.questionHistory) {
      await db.questionHistory.bulkPut(Object.values(payload.questionHistory))
    }
  })
}
