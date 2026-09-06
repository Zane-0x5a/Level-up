'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDailyRecord,
  upsertDailyRecord,
  type ProgressLevel,
  type StateLabel,
} from '@/lib/api/daily-records'
import { getTodayFocusSessions, type FocusSession } from '@/lib/api/focus-sessions'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
  hasReliableGrowthPreferences,
  type GrowthPreferences,
} from '@/lib/api/growth-preferences'
import { sendToFlomo } from '@/lib/flomo'
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  clearDailyEntryDraft,
  getDailyEntryScope,
  readDailyEntryDraftSnapshot,
  resolveDailyEntryFields,
  shouldPersistDailyEntryDraft,
  writeDailyEntryDraft,
} from '@/lib/daily-entry-draft'
import FocusSessionList from './FocusSessionList'
import WheelNumberInput from '../focus/WheelNumberInput'
import { getLocalDateString } from '@/lib/local-date'

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

// Session durations accumulate in float math; keep displayed/saved hours at 2 decimals.
const round2 = (value: number) => Math.round(value * 100) / 100

// The input keeps '' when untouched; a blank field persists as 0.
function parseHabitCheckinCount(value: string): number {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export default function DailyEntryForm({ onSave }: { onSave?: () => void }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [date, setDate] = useState(() => getLocalDateString())
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [focusIn, setFocusIn] = useState(0)
  const [focusOut, setFocusOut] = useState(0)
  const [entertainment, setEntertainment] = useState(0)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [habitCheckins, setHabitCheckins] = useState('')
  const [progressLevel, setProgressLevel] = useState<ProgressLevel | null>(null)
  const [progressNote, setProgressNote] = useState('')
  const [stateLabel, setStateLabel] = useState<StateLabel | null>(null)
  const [preferences, setPreferences] = useState<Omit<GrowthPreferences, 'user_id'>>(
    DEFAULT_GROWTH_PREFERENCES
  )
  const [preferencesUserId, setPreferencesUserId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [hydratedScope, setHydratedScope] = useState<string | null>(null)
  const [focusLoadedScope, setFocusLoadedScope] = useState<string | null>(null)
  const [dirtyScope, setDirtyScope] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sessionBusy, setSessionBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const recordRequestIdRef = useRef(0)
  const focusRequestIdRef = useRef(0)
  const preferencesRequestIdRef = useRef(0)

  const entryScope = userId ? getDailyEntryScope(userId, date) : null
  const isEntryReady = entryScope !== null && hydratedScope === entryScope
  const isFocusReady = entryScope !== null && focusLoadedScope === entryScope
  const arePreferencesReady = userId !== null && preferencesUserId === userId
  const canSubmitEntry = isEntryReady && isFocusReady && arePreferencesReady && !sessionBusy
  const editingDisabled = saving || !isEntryReady

  const applyEntryFields = useCallback((fields: typeof DEFAULT_DAILY_ENTRY_DRAFT) => {
    setDayType(fields.dayType)
    setHabitCheckins(fields.habitCheckins)
    setProgressLevel(fields.progressLevel)
    setProgressNote(fields.progressNote)
    setStateLabel(fields.stateLabel)
    setNote(fields.note)
  }, [])

  const currentDraft = useCallback(
    () => ({
      dayType,
      habitCheckins,
      note,
      progressLevel,
      progressNote,
      stateLabel,
    }),
    [dayType, habitCheckins, note, progressLevel, progressNote, stateLabel]
  )

  const markEntryDirty = useCallback(() => {
    if (entryScope && hydratedScope === entryScope) {
      setDirtyScope(entryScope)
    }
  }, [entryScope, hydratedScope])

  const loadPreferences = useCallback(async () => {
    const requestId = ++preferencesRequestIdRef.current
    if (!userId) {
      setPreferences(DEFAULT_GROWTH_PREFERENCES)
      return
    }
    try {
      const data = await getGrowthPreferences(userId)
      if (preferencesRequestIdRef.current !== requestId) return
      setPreferences({
        enable_habit_checkins: data.enable_habit_checkins,
        enable_progress_tracking: data.enable_progress_tracking,
        enable_state_tracking: data.enable_state_tracking,
        enable_focus_timer: data.enable_focus_timer,
        enable_motion_detection: data.enable_motion_detection,
      })
      if (hasReliableGrowthPreferences(userId)) {
        setPreferencesUserId(userId)
      } else {
        setStatus({ type: 'error', msg: '成长追踪设置加载失败，暂不能保存' })
      }
    } catch {
      if (preferencesRequestIdRef.current === requestId) {
        setPreferences(DEFAULT_GROWTH_PREFERENCES)
      }
    }
  }, [userId])

  const loadRecord = useCallback(async () => {
    if (!userId || !entryScope) return
    const requestId = ++recordRequestIdRef.current

    setHydratedScope(null)
    setDirtyScope(null)
    setStatus(null)
    applyEntryFields(DEFAULT_DAILY_ENTRY_DRAFT)

    try {
      const record = await getDailyRecord(userId, date)
      if (recordRequestIdRef.current !== requestId) return

      const draft = readDailyEntryDraftSnapshot(userId, date)
      applyEntryFields(resolveDailyEntryFields(record, draft))
      setHydratedScope(entryScope)
    } catch {
      if (recordRequestIdRef.current !== requestId) return
      const draft = readDailyEntryDraftSnapshot(userId, date)
      if (draft?.source === 'user-edit') {
        applyEntryFields(draft.values)
        setHydratedScope(entryScope)
        setStatus({ type: 'error', msg: '云端记录加载失败，已恢复本地草稿' })
      } else {
        setStatus({ type: 'error', msg: '记录加载失败，请切换日期后重试' })
      }
    }
  }, [applyEntryFields, date, entryScope, userId])

  const loadFocus = useCallback(async () => {
    if (!userId) return
    const requestId = ++focusRequestIdRef.current

    try {
      const sessions = await getTodayFocusSessions(userId, date)
      if (focusRequestIdRef.current !== requestId) return

      let inClass = 0
      let outClass = 0
      let fun = 0

      for (const session of sessions) {
        if (session.category === 'in_class') inClass += session.duration
        else if (session.category === 'out_class') outClass += session.duration
        else fun += session.duration
      }

      setSessions(sessions)
      setFocusIn(round2(inClass))
      setFocusOut(round2(outClass))
      setEntertainment(round2(fun))
      if (entryScope) setFocusLoadedScope(entryScope)
    } catch {
      if (focusRequestIdRef.current !== requestId) return
      setStatus({ type: 'error', msg: '专注记录加载失败，暂不能保存这一天' })
    }
  }, [date, entryScope, userId])

  useEffect(() => {
    void loadPreferences()
    return () => {
      preferencesRequestIdRef.current += 1
    }
  }, [loadPreferences])

  useEffect(() => {
    void loadRecord()

    return () => {
      recordRequestIdRef.current += 1
    }
  }, [loadRecord])

  useEffect(() => {
    setFocusLoadedScope(null)
    setSessions([])
    setFocusIn(0)
    setFocusOut(0)
    setEntertainment(0)
    void loadFocus()

    return () => {
      focusRequestIdRef.current += 1
    }
  }, [loadFocus])

  // Persist only explicit edits for the fully hydrated (user, date) scope.
  // A boolean hydration flag is insufficient here: during a date switch the
  // previous date can still be "hydrated" for one render and contaminate the
  // new date's localStorage bucket before Supabase responds.
  useEffect(() => {
    if (
      !userId ||
      !entryScope ||
      !shouldPersistDailyEntryDraft(entryScope, hydratedScope, dirtyScope)
    ) {
      return
    }

    const handle = setTimeout(() => {
      writeDailyEntryDraft(userId, date, currentDraft())
    }, 300)

    return () => clearTimeout(handle)
  }, [
    userId,
    date,
    entryScope,
    hydratedScope,
    dirtyScope,
    dayType,
    habitCheckins,
    note,
    progressLevel,
    progressNote,
    stateLabel,
    currentDraft,
  ])

  const handleDateChange = (nextDate: string) => {
    if (
      userId &&
      entryScope &&
      shouldPersistDailyEntryDraft(entryScope, hydratedScope, dirtyScope)
    ) {
      // Flush the old date before the debounce cleanup runs so rapid date
      // switches cannot lose the user's latest unsaved keystrokes.
      writeDailyEntryDraft(userId, date, currentDraft())
    }

    setHydratedScope(null)
    setDirtyScope(null)
    setStatus(null)
    setDate(nextDate)
  }

  const handleSave = async () => {
    if (!userId || !canSubmitEntry) return
    setSaving(true)
    setStatus(null)

    try {
      await upsertDailyRecord(userId, {
        date,
        day_type: dayType,
        ibetter_count: preferences.enable_habit_checkins
          ? parseHabitCheckinCount(habitCheckins)
          : 0,
        note,
        focus_in_class: focusIn,
        focus_out_class: focusOut,
        entertainment,
        progress_level: preferences.enable_progress_tracking ? progressLevel : null,
        progress_note: preferences.enable_progress_tracking ? progressNote.trim() || null : null,
        state_label: preferences.enable_state_tracking ? stateLabel : null,
      })

      clearDailyEntryDraft(userId, date)
      setDirtyScope(null)
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
    if (!userId || !canSubmitEntry || !note.trim()) return

    setSending(true)
    setStatus(null)

    try {
      const optionalLines = [
        preferences.enable_habit_checkins
          ? `习惯打卡数: ${parseHabitCheckinCount(habitCheckins)}`
          : null,
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
    <div className="float-card glow-neutral" aria-busy={Boolean(userId) && !canSubmitEntry}>
      <div className="sec-head">
        <span className="sec-dot sky" />
        <span className="sec-name">每日记录</span>
      </div>

      <div className="entry-date-row">
        <input
          type="date"
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
          disabled={saving || sessionBusy}
          aria-label="记录日期"
          className="field-input"
          style={{ maxWidth: 180 }}
        />
        <div className="entry-day-pills" style={{ marginBottom: 0 }}>
          {(['study_day', 'rest_day'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                markEntryDirty()
                setDayType(type)
              }}
              disabled={editingDisabled}
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
            <WheelNumberInput
              min={0}
              max={99}
              placeholder="0"
              value={habitCheckins}
              onValueChange={setHabitCheckins}
              onUserEdit={markEntryDirty}
              className="field-input"
              ariaLabel="习惯打卡数"
              disabled={editingDisabled}
            />
          </div>
        )}
      </div>

      <div className="focus-session-block">
        <FocusSessionList key={entryScope} sessions={sessions} onChanged={loadFocus}
          date={date} userId={userId ?? ''} disabled={saving || !isFocusReady}
          onBusyChange={setSessionBusy} />
      </div>

      {preferences.enable_progress_tracking && (
        <div className="entry-advanced-block">
          <label className="entry-field-label">今日主线推进</label>
          <div className="entry-choice-row">
            {PROGRESS_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  markEntryDirty()
                  setProgressLevel(option.value)
                }}
                disabled={editingDisabled}
                className={`pill${progressLevel === option.value ? ' active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            placeholder="今天最重要的一步..."
            value={progressNote}
            onChange={(event) => {
              markEntryDirty()
              setProgressNote(event.target.value)
            }}
            disabled={editingDisabled}
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
                onClick={() => {
                  markEntryDirty()
                  setStateLabel(option.value)
                }}
                disabled={editingDisabled}
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
        onChange={(event) => {
          markEntryDirty()
          setNote(event.target.value)
        }}
        disabled={editingDisabled}
        rows={3}
        className="field-textarea"
      />

      <div className="entry-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !canSubmitEntry}
          className="btn-warm"
          style={{ opacity: saving || !canSubmitEntry ? 0.6 : 1 }}
        >
          {saving ? '保存中...' : '保存记录'}
        </button>
        <button
          type="button"
          onClick={handleFlomo}
          disabled={sending || !canSubmitEntry || !note.trim()}
          className="btn-outline"
          style={{ opacity: sending || !canSubmitEntry || !note.trim() ? 0.5 : 1 }}
        >
          {sending ? '发送中...' : '发送到 flomo ->'}
        </button>
        {status && <span className={`entry-status ${status.type}`}>{status.msg}</span>}
      </div>
    </div>
  )
}
