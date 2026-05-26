import { useState, useEffect } from 'react'

/**
 * Bookmark / flag / note toolbar shown on every question card.
 */
export default function QuestionActions({ question, meta, onToggleBookmark, onToggleFlag, onSetNote }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState(meta?.note ?? '')

  useEffect(() => { setNoteDraft(meta?.note ?? '') }, [meta?.note, question.id])

  const bookmarked = !!meta?.bookmarked
  const flagged    = !!meta?.flagged
  const hasNote    = !!(meta?.note && meta.note.trim().length > 0)

  function saveNote() {
    onSetNote?.(question.id, noteDraft.trim())
    setNoteOpen(false)
  }

  return (
    <div className="question-actions">
      <button
        className={`qa-btn${bookmarked ? ' qa-on' : ''}`}
        onClick={() => onToggleBookmark?.(question.id)}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
      >
        {bookmarked ? '★' : '☆'}
      </button>
      <button
        className={`qa-btn${flagged ? ' qa-on qa-flag' : ''}`}
        onClick={() => onToggleFlag?.(question.id)}
        title={flagged ? 'Remove flag' : 'Flag this question (ambiguous/wrong)'}
        aria-pressed={flagged}
        aria-label={flagged ? 'Remove flag' : 'Flag this question'}
      >
        ⚑
      </button>
      <button
        className={`qa-btn${hasNote ? ' qa-on' : ''}`}
        onClick={() => setNoteOpen(o => !o)}
        title={hasNote ? 'Edit note' : 'Add a note'}
        aria-label={hasNote ? 'Edit note' : 'Add a note'}
      >
        ✎
      </button>

      {noteOpen && (
        <div className="qa-note-panel">
          <textarea
            className="qa-note-textarea"
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder="Your note — only visible to you"
            rows={3}
            autoFocus
          />
          <div className="qa-note-actions">
            <button className="btn btn-ghost" onClick={() => setNoteOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNote}>Save note</button>
          </div>
        </div>
      )}
    </div>
  )
}
