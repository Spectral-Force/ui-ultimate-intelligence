import Dexie from 'dexie'

export const db = new Dexie('UltimateIntelligence')

db.version(1).stores({
  // completed sessions
  sessions: '++id, date, setKey, mode',
  // per-question lifetime stats
  questionHistory: 'questionId',
})

// ── helpers ──────────────────────────────────────────────

export async function persistSession(sessionData, answers) {
  await db.sessions.add(sessionData)

  // update per-question history
  for (const a of answers) {
    const existing = await db.questionHistory.get(a.questionId) ?? {
      questionId: a.questionId, seen: 0, correct: 0, lastSeen: 0,
    }
    await db.questionHistory.put({
      ...existing,
      seen:    existing.seen + 1,
      correct: existing.correct + (a.correct ? 1 : 0),
      lastSeen: Date.now(),
    })
  }
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
    exported: Date.now(),
    sessions,
    questionHistory: Object.fromEntries(histRows.map(r => [r.questionId, r])),
  }
}

export async function importData(payload) {
  if (payload.version !== 1) throw new Error(`Unknown export version: ${payload.version}`)
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
