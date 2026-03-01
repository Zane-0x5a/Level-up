'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDailyRecord, upsertDailyRecord } from '@/lib/api/daily-records'
import { getTodayFocusSessions } from '@/lib/api/focus-sessions'
import { sendToFlomo } from '@/lib/flomo'

export default function DailyEntryForm() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [focusIn, setFocusIn] = useState(0)
  const [focusOut, setFocusOut] = useState(0)
  const [entertainment, setEntertainment] = useState(0)
  const [ibetter, setIbetter] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadRecord = useCallback(async () => {
    try {
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
    } catch {
      // ignore load errors
    }
  }, [date])

  const loadFocus = useCallback(async () => {
    try {
      const sessions = await getTodayFocusSessions()
      let inC = 0, outC = 0, ent = 0
      for (const s of sessions) {
        if (s.category === 'in_class') inC += s.duration
        else if (s.category === 'out_class') outC += s.duration
        else ent += s.duration
      }
      setFocusIn(inC)
      setFocusOut(outC)
      setEntertainment(ent)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { loadRecord() }, [loadRecord])
  useEffect(() => { loadFocus() }, [loadFocus])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await upsertDailyRecord({ date, day_type: dayType, ibetter_count: ibetter, note })
      setStatus({ type: 'success', msg: '已保存' })
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus({ type: 'error', msg: '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  const handleFlomo = async () => {
    if (!note.trim()) return
    setSending(true)
    setStatus(null)
    try {
      const content = `#LevelUp ${date}\n日类型: ${dayType === 'study_day' ? '学习日' : '休假日'}\n课内: ${focusIn.toFixed(1)}h | 课外: ${focusOut.toFixed(1)}h | 娱乐: ${entertainment.toFixed(1)}h\niBetter: ${ibetter}\n\n${note}`
      await sendToFlomo(content)
      setStatus({ type: 'success', msg: '已发送到 flomo' })
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus({ type: 'error', msg: '发送失败，请检查 flomo 配置' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="float-card glow-neutral">
      {/* Section header */}
      <div className="sec-head">
        <span className="sec-dot sky" />
        <span className="sec-name">每日记录</span>
      </div>

      {/* Date + Day type row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="field-input"
          style={{ maxWidth: 180 }}
        />
        <div className="entry-day-pills" style={{ marginBottom: 0 }}>
          {(['study_day', 'rest_day'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDayType(t)}
              className={`pill${dayType === t ? ' active' : ''}`}
            >
              {t === 'study_day' ? '学习日' : '休假日'}
            </button>
          ))}
        </div>
      </div>

      {/* 4-column input grid */}
      <div className="entry-input-grid">
        <div className="entry-field">
          <label className="entry-field-label">课内投入 (h)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={focusIn}
            onChange={e => setFocusIn(parseFloat(e.target.value) || 0)}
            className="field-input"
            readOnly
          />
        </div>
        <div className="entry-field">
          <label className="entry-field-label">课外投入 (h)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={focusOut}
            onChange={e => setFocusOut(parseFloat(e.target.value) || 0)}
            className="field-input"
            readOnly
          />
        </div>
        <div className="entry-field">
          <label className="entry-field-label">娱乐消费 (h)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={entertainment}
            onChange={e => setEntertainment(parseFloat(e.target.value) || 0)}
            className="field-input"
            readOnly
          />
        </div>
        <div className="entry-field">
          <label className="entry-field-label">iBetter</label>
          <input
            type="number"
            min={0}
            value={ibetter}
            onChange={e => setIbetter(parseInt(e.target.value) || 0)}
            className="field-input"
          />
        </div>
      </div>

      {/* Summary textarea */}
      <textarea
        placeholder="今日总结..."
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        className="field-textarea"
      />

      {/* Actions */}
      <div className="entry-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-warm"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? '保存中...' : '保存记录'}
        </button>
        <button
          onClick={handleFlomo}
          disabled={sending || !note.trim()}
          className="btn-outline"
          style={{ opacity: (sending || !note.trim()) ? 0.5 : 1 }}
        >
          {sending ? '发送中...' : '发送到 flomo →'}
        </button>
        {status && (
          <span className={`entry-status ${status.type}`}>{status.msg}</span>
        )}
      </div>
    </div>
  )
}
