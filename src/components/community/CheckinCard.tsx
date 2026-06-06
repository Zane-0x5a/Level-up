'use client'

import { ClipboardCheck } from 'lucide-react'
import {
  formatCheckinFocusMinutes,
  getCheckinDayLabel,
} from '@/lib/checkin-share'

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
  return (
    <div className="checkin-card">
      <div className="checkin-header">
        <span className="checkin-icon"><ClipboardCheck size={16} strokeWidth={2} /></span>
        <span className="checkin-date">{data.date ?? '今天'} 打卡</span>
      </div>
      <div className="checkin-stats">
        <div className="checkin-stat">
          <span className="checkin-stat-val">
            {formatCheckinFocusMinutes(data.focus_minutes ?? 0)}
          </span>
          <span className="checkin-stat-label">专注时长</span>
        </div>
        <div className="checkin-stat">
          <span className="checkin-stat-val">
            {getCheckinDayLabel(data.day_type)}
          </span>
          <span className="checkin-stat-label">日期类型</span>
        </div>
      </div>
      {data.note_snippet && <div className="checkin-note">{data.note_snippet}</div>}
    </div>
  )
}
