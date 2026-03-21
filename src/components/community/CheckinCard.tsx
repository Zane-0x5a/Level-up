'use client'

interface CheckinData {
  date?: string
  day_type?: string
  focus_minutes?: number
  note_snippet?: string
}

interface Props {
  data: CheckinData
}

export default function CheckinCard({ data }: Props) {
  const dayLabel = data.day_type === 'rest_day' ? '假期' : '上学日'
  const hours = data.focus_minutes ? Math.floor(data.focus_minutes / 60) : 0
  const mins = data.focus_minutes ? data.focus_minutes % 60 : 0

  return (
    <div className="checkin-card">
      <div className="checkin-header">
        <span className="checkin-icon">📋</span>
        <span className="checkin-date">{data.date ?? '今日'} 打卡</span>
      </div>
      <div className="checkin-stats">
        <div className="checkin-stat">
          <span className="checkin-stat-val">{hours}h{mins > 0 ? `${mins}m` : ''}</span>
          <span className="checkin-stat-label">专注时长</span>
        </div>
        <div className="checkin-stat">
          <span className="checkin-stat-val">{dayLabel}</span>
          <span className="checkin-stat-label">日类型</span>
        </div>
      </div>
      {data.note_snippet && (
        <div className="checkin-note">{data.note_snippet}</div>
      )}
    </div>
  )
}
