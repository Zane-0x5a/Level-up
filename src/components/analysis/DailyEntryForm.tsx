'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import { getDailyRecord, upsertDailyRecord } from '@/lib/api/daily-records'
import { getTodayFocusSessions } from '@/lib/api/focus-sessions'
import { sendToFlomo } from '@/lib/flomo'

export default function DailyEntryForm() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [ibetter, setIbetter] = useState(0)
  const [note, setNote] = useState('')
  const [focusSummary, setFocusSummary] = useState({ inClass: 0, outClass: 0, entertainment: 0 })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const loadRecord = useCallback(async () => {
    const record = await getDailyRecord(date)
    if (record) {
      setDayType(record.day_type)
      setIbetter(record.ibetter_count ?? 0)
      setNote(record.note ?? '')
    } else {
      setDayType('study_day')
      setIbetter(0)
      setNote('')
    }
  }, [date])

  const loadFocus = useCallback(async () => {
    const sessions = await getTodayFocusSessions()
    const summary = { inClass: 0, outClass: 0, entertainment: 0 }
    for (const s of sessions) {
      if (s.category === 'in_class') summary.inClass += s.duration
      else if (s.category === 'out_class') summary.outClass += s.duration
      else summary.entertainment += s.duration
    }
    setFocusSummary(summary)
  }, [])

  useEffect(() => { loadRecord() }, [loadRecord])
  useEffect(() => { loadFocus() }, [loadFocus])

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertDailyRecord({ date, day_type: dayType, ibetter_count: ibetter, note })
    } finally {
      setSaving(false)
    }
  }

  const handleFlomo = async () => {
    if (!note.trim()) return
    setSending(true)
    try {
      const content = `#LevelUp ${date}\n日类型: ${dayType === 'study_day' ? '学习日' : '休假日'}\n${note}`
      await sendToFlomo(content)
    } catch {
      alert('发送失败，请检查 flomo API 配置')
    } finally {
      setSending(false)
    }
  }

  const totalFocus = focusSummary.inClass + focusSummary.outClass + focusSummary.entertainment

  return (
    <div className="glass-1 p-5 space-y-4 animate-in">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>每日录入</h2>

      {/* Date picker */}
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none"
        style={{
          background: 'var(--color-glass-input)',
          borderRadius: 'var(--radius-glass-xs)',
          color: 'var(--color-text)',
        }}
      />

      {/* Day type toggle */}
      <div className="flex gap-2">
        {(['study_day', 'rest_day'] as const).map(t => (
          <button
            key={t}
            onClick={() => setDayType(t)}
            className="flex-1 py-2 text-sm font-medium transition-all duration-300"
            style={{
              borderRadius: 'var(--radius-pill)',
              background: dayType === t ? 'var(--color-accent)' : 'var(--color-glass-3)',
              color: dayType === t ? '#fff' : 'var(--color-text-2)',
            }}
          >
            {t === 'study_day' ? '学习日' : '休假日'}
          </button>
        ))}
      </div>

      {/* iBetter count */}
      <div className="space-y-1">
        <label className="text-sm" style={{ color: 'var(--color-text-2)' }}>iBetter 打卡数</label>
        <input
          type="number"
          min={0}
          value={ibetter}
          onChange={e => setIbetter(parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--color-glass-input)',
            borderRadius: 'var(--radius-glass-xs)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* Focus summary (read-only) */}
      {totalFocus > 0 && (
        <div className="glass-3 p-3 space-y-1">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-2)' }}>今日专注汇总</p>
          <div className="flex gap-4 text-sm">
            <span style={{ color: 'var(--color-accent)' }}>课内 {focusSummary.inClass.toFixed(1)}h</span>
            <span style={{ color: 'var(--color-success)' }}>课外 {focusSummary.outClass.toFixed(1)}h</span>
            <span style={{ color: 'var(--color-amber)' }}>娱乐 {focusSummary.entertainment.toFixed(1)}h</span>
          </div>
        </div>
      )}

      {/* Note */}
      <textarea
        placeholder="今日总结..."
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm outline-none resize-none"
        style={{
          background: 'var(--color-glass-input)',
          borderRadius: 'var(--radius-glass-xs)',
          color: 'var(--color-text)',
        }}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-glass-sm)',
            transition: 'all 0.4s var(--ease-spring)',
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={handleFlomo}
          disabled={sending || !note.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{
            background: 'var(--color-success)',
            borderRadius: 'var(--radius-glass-sm)',
            color: '#fff',
            transition: 'all 0.4s var(--ease-spring)',
          }}
        >
          <Send size={14} />
          {sending ? '发送中...' : 'flomo'}
        </button>
      </div>
    </div>
  )
}
