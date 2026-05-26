'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDailyRecord,
  upsertDailyRecord,
  type ProgressLevel,
  type StateLabel,
} from '@/lib/api/daily-records'
import { getTodayFocusSessions } from '@/lib/api/focus-sessions'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
  type GrowthPreferences,
} from '@/lib/api/growth-preferences'
import { sendToFlomo } from '@/lib/flomo'
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  clearDailyEntryDraft,
  readDailyEntryDraft,
  writeDailyEntryDraft,
} from '@/lib/daily-entry-draft'

const PROGRESS_LEVEL_OPTIONS: Array<{ value: ProgressLevel; label: string }> = [
  { value: 'slight', label: '靠近了一点' },
  { value: 'solid', label: '推进明显' },
  { value: 'breakthrough', label: '有突破' },
]

const STATE_LABEL_OPTIONS: Array<{ value: StateLabel; label: string }> = [
  { value: 'recovering', label: '恢复中' },
  { value: 'steady', label: '稳住了' },
  { value: 'good', label: '状态不错' },
  { value: 'energized', label: '很有能量' },
]

export default function DailyEntryForm({ onSave }: { onSave?: () => void }) {
  const { user } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [focusIn, setFocusIn] = useState(0)
  const [focusOut, setFocusOut] = useState(0)
  const [entertainment, setEntertainment] = useState(0)
  const [habitCheckins, setHabitCheckins] = useState(0)
  const [progressLevel, setProgressLevel] = useState<ProgressLevel | null>(null)
  const [progressNote, setProgressNote] = useState('')
  const [stateLabel, setStateLabel] = useState<StateLabel | null>(null)
  const [preferences, setPreferences] = useState<Omit<GrowthPreferences, 'user_id'>>(
    DEFAULT_GROWTH_PREFERENCES
  )
  const [note, setNote] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadPreferences = useCallback(async () => {
    if (!user) return
    try {
      const data = await getGrowthPreferences(user.id)
      setPreferences({
        enable_habit_checkins: data.enable_habit_checkins,
        enable_progress_tracking: data.enable_progress_tracking,
        enable_state_tracking: data.enable_state_tracking,
        enable_focus_timer: data.enable_focus_timer,
        enable_motion_detection: data.enable_motion_detection,
      })
    } catch {
      setPreferences(DEFAULT_GROWTH_PREFERENCES)
    }
  }, [user])

  const loadRecord = useCallback(async () => {
    if (!user) return
    try {
      const record = await getDailyRecord(user.id, date)
      if (record) {
        setDayType(record.day_type)
        setHabitCheckins(record.ibetter_count ?? 0)
        setProgressLevel(record.progress_level ?? null)
        setProgressNote(record.progress_note ?? '')
        setStateLabel(record.state_label ?? null)
        setNote(record.note ?? '')
      } else {
        setDayType(DEFAULT_DAILY_ENTRY_DRAFT.dayType)
        setHabitCheckins(DEFAULT_DAILY_ENTRY_DRAFT.habitCheckins)
        setProgressLevel(DEFAULT_DAILY_ENTRY_DRAFT.progressLevel)
        setProgressNote(DEFAULT_DAILY_ENTRY_DRAFT.progressNote)
        setStateLabel(DEFAULT_DAILY_ENTRY_DRAFT.stateLabel)
        setNote(DEFAULT_DAILY_ENTRY_DRAFT.note)
      }

      // Restore draft on top — represents the user's latest unsaved intent
      // and wins over whatever the server returned.
      const draft = readDailyEntryDraft(user.id, date)
      if (draft) {
        setDayType(draft.dayType)
        setHabitCheckins(draft.habitCheckins)
        setProgressLevel(draft.progressLevel)
        setProgressNote(draft.progressNote)
        setStateLabel(draft.stateLabel)
        setNote(draft.note)
      }
    } catch {
      // Ignore load errors and keep current local state.
    } finally {
      // Only after hydration finishes can we safely persist drafts —
      // otherwise the initial default values would race the async load
      // and overwrite a previously-saved draft with empty fields.
      setIsHydrated(true)
    }
  }, [date, user])

  const loadFocus = useCallback(async () => {
    if (!user) return
    try {
      const sessions = await getTodayFocusSessions(user.id, date)
      let inClass = 0
      let outClass = 0
      let fun = 0

      for (const session of sessions) {
        if (session.category === 'in_class') inClass += session.duration
        else if (session.category === 'out_class') outClass += session.duration
        else fun += session.duration
      }

      setFocusIn(inClass)
      setFocusOut(outClass)
      setEntertainment(fun)
    } catch {
      // Ignore load errors and keep the existing numbers.
    }
  }, [date, user])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  useEffect(() => {
    setIsHydrated(false)
    loadRecord()
  }, [loadRecord])

  useEffect(() => {
    loadFocus()
  }, [loadFocus])

  // Persist the in-progress form as a localStorage draft per (userId, date).
  // Debounced 300ms; cleared on successful save. Skip until loadRecord
  // finishes — otherwise the default empty state on mount would race the
  // async load and overwrite a previously-saved draft.
  useEffect(() => {
    if (!user || !isHydrated) return

    const handle = setTimeout(() => {
      writeDailyEntryDraft(user.id, date, {
        dayType,
        habitCheckins,
        note,
        progressLevel,
        progressNote,
        stateLabel,
      })
    }, 300)

    return () => clearTimeout(handle)
  }, [
    user,
    date,
    isHydrated,
    dayType,
    habitCheckins,
    note,
    progressLevel,
    progressNote,
    stateLabel,
  ])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setStatus(null)

    try {
      await upsertDailyRecord(user.id, {
        date,
        day_type: dayType,
        ibetter_count: preferences.enable_habit_checkins ? habitCheckins : 0,
        note,
        focus_in_class: focusIn,
        focus_out_class: focusOut,
        entertainment,
        progress_level: preferences.enable_progress_tracking ? progressLevel : null,
        progress_note: preferences.enable_progress_tracking ? progressNote.trim() || null : null,
        state_label: preferences.enable_state_tracking ? stateLabel : null,
      })

      clearDailyEntryDraft(user.id, date)
      onSave?.()
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
      const optionalLines = [
        preferences.enable_habit_checkins ? `习惯打卡数: ${habitCheckins}` : null,
        preferences.enable_progress_tracking && progressLevel
          ? `主线推进: ${PROGRESS_LEVEL_OPTIONS.find((option) => option.value === progressLevel)?.label ?? progressLevel}`
          : null,
        preferences.enable_progress_tracking && progressNote.trim()
          ? `最重要的一步: ${progressNote.trim()}`
          : null,
        preferences.enable_state_tracking && stateLabel
          ? `状态标签: ${STATE_LABEL_OPTIONS.find((option) => option.value === stateLabel)?.label ?? stateLabel}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')

      const content = [
        `#LevelUp ${date}`,
        `日类型: ${dayType === 'study_day' ? '学习日' : '休息日'}`,
        `课内: ${focusIn.toFixed(1)}h | 课外: ${focusOut.toFixed(1)}h | 娱乐: ${entertainment.toFixed(1)}h`,
        optionalLines,
        '',
        note,
      ]
        .filter(Boolean)
        .join('\n')

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
      <div className="sec-head">
        <span className="sec-dot sky" />
        <span className="sec-name">每日记录</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="field-input"
          style={{ maxWidth: 180 }}
        />
        <div className="entry-day-pills" style={{ marginBottom: 0 }}>
          {(['study_day', 'rest_day'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDayType(type)}
              className={`pill${dayType === type ? ' active' : ''}`}
            >
              {type === 'study_day' ? '学习日' : '休息日'}
            </button>
          ))}
        </div>
      </div>

      <div className="entry-input-grid">
        <div className="entry-field">
          <label className="entry-field-label">课内投入 (h)</label>
          <input type="number" min={0} step={0.1} value={focusIn} className="field-input" readOnly />
        </div>
        <div className="entry-field">
          <label className="entry-field-label">课外投入 (h)</label>
          <input type="number" min={0} step={0.1} value={focusOut} className="field-input" readOnly />
        </div>
        <div className="entry-field">
          <label className="entry-field-label">娱乐消耗 (h)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={entertainment}
            className="field-input"
            readOnly
          />
        </div>
        {preferences.enable_habit_checkins && (
          <div className="entry-field">
            <label className="entry-field-label">习惯打卡数</label>
            <input
              type="number"
              min={0}
              value={habitCheckins}
              onChange={(event) => setHabitCheckins(parseInt(event.target.value, 10) || 0)}
              className="field-input"
            />
          </div>
        )}
      </div>

      {preferences.enable_progress_tracking && (
        <div className="entry-advanced-block">
          <label className="entry-field-label">今日主线推进</label>
          <div className="entry-choice-row">
            {PROGRESS_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setProgressLevel(option.value)}
                className={`pill${progressLevel === option.value ? ' active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            placeholder="今天最重要的一步..."
            value={progressNote}
            onChange={(event) => setProgressNote(event.target.value)}
            rows={2}
            className="field-textarea"
          />
        </div>
      )}

      {preferences.enable_state_tracking && (
        <div className="entry-advanced-block">
          <label className="entry-field-label">今日状态标签</label>
          <div className="entry-choice-row">
            {STATE_LABEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStateLabel(option.value)}
                className={`pill${stateLabel === option.value ? ' active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        placeholder="今天的总结、感受或提醒..."
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        className="field-textarea"
      />

      <div className="entry-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-warm"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? '保存中...' : '保存记录'}
        </button>
        <button
          type="button"
          onClick={handleFlomo}
          disabled={sending || !note.trim()}
          className="btn-outline"
          style={{ opacity: sending || !note.trim() ? 0.5 : 1 }}
        >
          {sending ? '发送中...' : '发送到 flomo ->'}
        </button>
        {status && <span className={`entry-status ${status.type}`}>{status.msg}</span>}
      </div>
    </div>
  )
}
