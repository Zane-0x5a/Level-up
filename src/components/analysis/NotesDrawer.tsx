'use client'

type Record = {
  date: string
  day_type: string
  note: string | null
}

type Props = {
  records: Record[]
  onDeleteNote?: (date: string) => void
}

export default function NotesDrawer({ records, onDeleteNote }: Props) {
  const withNotes = records.filter(r => r.note?.trim())

  return (
    <div className="history-grid">
      {withNotes.map(r => (
        <div key={r.date} className="float-card glow-neutral history-card">
          {onDeleteNote && (
            <button
              className="history-delete"
              onClick={() => onDeleteNote(r.date)}
              aria-label="删除记录"
            >
              ×
            </button>
          )}
          <div className="history-date">{r.date}</div>
          <span className={`history-tag ${r.day_type === 'study_day' ? 'study' : 'rest'}`}>
            {r.day_type === 'study_day' ? '学习日' : '休假日'}
          </span>
          <p className="history-summary">{r.note}</p>
        </div>
      ))}

      {withNotes.length === 0 && (
        <div className="history-empty">还没有总结记录</div>
      )}
    </div>
  )
}
