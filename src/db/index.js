import Dexie from 'dexie'

export const db = new Dexie('UltimateIntelligence')

// v1: original
db.version(1).stores({
  sessions: '++id, date, setKey, mode',
  questionHistory: 'questionId',
})

// v3: add questionMeta (SRS, bookmarks, flags, notes, hints, confidence)
//     add userQuestions for in-app authored questions
//     add inProgress for pause/resume
db.version(3).stores({
  sessions: '++id, date, setKey, mode',
  questionHistory: 'questionId',
  questionMeta: 'questionId, nextDue, bookmarked, flagged',
  userQuestions: 'id, createdAt',
  inProgress: 'id', // singleton at id="current"
})

const SCHEMA_VERSION = 3

// ── helpers ──────────────────────────────────────────────

export async function persistSession(sessionData, answers) {
  await db.transaction('rw', db.sessions, db.questionHistory, async () => {
    await db.sessions.add({ schemaVersion: SCHEMA_VERSION, ...sessionData })

    const ids = [...new Set(answers.map(a => a.questionId))]
    const existing = await db.questionHistory.bulkGet(ids)
    const map = new Map()
    ids.forEach((id, i) => {
      map.set(id, existing[i] ?? {
        questionId: id, seen: 0, correct: 0, skipped: 0, hintsUsed: 0, lastSeen: 0,
      })
    })

    const now = Date.now()
    for (const a of answers) {
      const row = map.get(a.questionId)
      row.seen     += 1
      row.correct  += a.correct ? 1 : 0
      row.skipped  += a.skipped ? 1 : 0
      row.hintsUsed = (row.hintsUsed ?? 0) + (a.usedHint ? 1 : 0)
      row.lastSeen  = now
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

// ── question meta (SRS + flags + bookmarks + notes + confidence) ─────────────

export async function loadQuestionMeta() {
  const rows = await db.questionMeta.toArray()
  return Object.fromEntries(rows.map(r => [r.questionId, r]))
}

export async function getQuestionMeta(questionId) {
  return (await db.questionMeta.get(questionId)) ?? null
}

export async function setQuestionMetaFields(questionId, fields) {
  const existing = await db.questionMeta.get(questionId)
  const row = { questionId, ...(existing ?? {}), ...fields }
  await db.questionMeta.put(row)
  return row
}

export async function toggleBookmark(questionId) {
  const m = await getQuestionMeta(questionId)
  return setQuestionMetaFields(questionId, { bookmarked: !m?.bookmarked })
}

export async function toggleFlag(questionId) {
  const m = await getQuestionMeta(questionId)
  return setQuestionMetaFields(questionId, { flagged: !m?.flagged })
}

export async function setNote(questionId, note) {
  return setQuestionMetaFields(questionId, { note })
}

export async function bulkUpdateMeta(updates) {
  if (!updates.length) return
  await db.transaction('rw', db.questionMeta, async () => {
    const ids = updates.map(u => u.questionId)
    const existing = await db.questionMeta.bulkGet(ids)
    const rows = updates.map((u, i) => ({ ...(existing[i] ?? {}), questionId: u.questionId, ...u.fields }))
    await db.questionMeta.bulkPut(rows)
  })
}

// ── user-authored questions ──────────────────────────────────────────────────

export async function loadUserQuestions() {
  return db.userQuestions.toArray()
}

export async function saveUserQuestion(q) {
  const row = { ...q, createdAt: q.createdAt ?? Date.now(), userAuthored: true }
  await db.userQuestions.put(row)
  return row
}

export async function deleteUserQuestion(id) {
  await db.userQuestions.delete(id)
}

// ── in-progress session (pause/resume) ───────────────────────────────────────

export async function saveInProgress(snapshot) {
  await db.inProgress.put({ id: 'current', ...snapshot, savedAt: Date.now() })
}

export async function loadInProgress() {
  return db.inProgress.get('current')
}

export async function clearInProgress() {
  await db.inProgress.delete('current')
}

// ── export / import ──────────────────────────────────────────────────────────

export async function exportData() {
  const [sessions, histRows, metaRows, userQs] = await Promise.all([
    db.sessions.toArray(),
    db.questionHistory.toArray(),
    db.questionMeta.toArray(),
    db.userQuestions.toArray(),
  ])
  return {
    version: 2,
    schemaVersion: SCHEMA_VERSION,
    exported: Date.now(),
    sessions,
    questionHistory: Object.fromEntries(histRows.map(r => [r.questionId, r])),
    questionMeta: Object.fromEntries(metaRows.map(r => [r.questionId, r])),
    userQuestions: userQs,
  }
}

export async function importData(payload) {
  if (payload.version !== 1 && payload.version !== 2) {
    throw new Error(`Unknown export version: ${payload.version}`)
  }
  if (!Array.isArray(payload.sessions)) throw new Error('Export payload: sessions must be an array')

  await db.transaction('rw',
    db.sessions, db.questionHistory, db.questionMeta, db.userQuestions,
    async () => {
      await db.sessions.clear()
      await db.questionHistory.clear()
      await db.questionMeta.clear()
      await db.userQuestions.clear()

      if (payload.sessions?.length) {
        await db.sessions.bulkAdd(payload.sessions.map(({ id, ...rest }) => rest))
      }
      if (payload.questionHistory) {
        await db.questionHistory.bulkPut(Object.values(payload.questionHistory))
      }
      if (payload.questionMeta) {
        await db.questionMeta.bulkPut(Object.values(payload.questionMeta))
      }
      if (Array.isArray(payload.userQuestions)) {
        await db.userQuestions.bulkPut(payload.userQuestions)
      }
    },
  )
}
