'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  addFocusSession,
  correctSubmittedFocusSession,
  getLastFocusCategory,
  type FocusSession,
} from '@/lib/api/focus-sessions'
import {
  clearFocusDraft,
  DEFAULT_FOCUS_DRAFT,
  getFocusDurationHours,
  readFocusDraft,
  writeFocusDraft,
} from '@/lib/focus-draft'
import {
  FOCUS_TIMER_MIN_FOCUS_MS,
  consumeFocusTimer,
  readFocusElapsed,
} from '@/lib/focus-timer'

type Props = {
  onComplete: () => void
  onSkip: () => void
}

type SessionEndPanelContentProps = Props & {
  userId: string | null
}

const CATEGORIES = [
  { value: 'in_class', label: '课内学习' },
  { value: 'out_class', label: '课外学习' },
  { value: 'entertainment', label: '娱乐消费' },
]

const SUBMITTED_SESSION_PREFIX = 'focus-last-submitted-session'

function getInitialDraft(userId: string | null) {
  return userId ? readFocusDraft(userId) : DEFAULT_FOCUS_DRAFT
}

function getSubmittedSessionKey(userId: string) {
  return `${SUBMITTED_SESSION_PREFIX}:${userId}`
}

function readSubmittedSession(userId: string | null): FocusSession | null {
  if (!userId || typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(getSubmittedSessionKey(userId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<FocusSession>
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.user_id !== 'string' ||
      typeof parsed.category !== 'string' ||
      typeof parsed.duration !== 'number' ||
      typeof parsed.date !== 'string' ||
      typeof parsed.created_at !== 'string'
    ) {
      return null
    }

    return parsed as FocusSession
  } catch {
    return null
  }
}

function writeSubmittedSession(userId: string, session: FocusSession) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(
    getSubmittedSessionKey(userId),
    JSON.stringify(session)
  )
}

function clearSubmittedSession(userId: string | null) {
  if (!userId || typeof window === 'undefined') return

  window.sessionStorage.removeItem(getSubmittedSessionKey(userId))
}

function getDraftFromDuration(durationHours: number) {
  const totalMinutes = Math.round(durationHours * 60)

  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  }
}

function formatDuration(durationHours: number) {
  const { hours, minutes } = getDraftFromDuration(durationHours)
  const hourValue = Number(hours)
  const minuteValue = Number(minutes)
  const parts = []

  if (hourValue > 0) {
    parts.push(`${hourValue}小时`)
  }

  if (minuteValue > 0) {
    parts.push(`${minuteValue}分钟`)
  }

  return parts.join('') || '0分钟'
}

function getCategoryLabel(category: string) {
  return CATEGORIES.find(item => item.value === category)?.label ?? category
}

function SessionEndPanelContent({
  userId,
  onComplete,
  onSkip,
}: SessionEndPanelContentProps) {
  const [category, setCategory] = useState(() => getInitialDraft(userId).category)
  const [hours, setHours] = useState(() => getInitialDraft(userId).hours)
  const [minutes, setMinutes] = useState(() => getInitialDraft(userId).minutes)
  const [submittedSession, setSubmittedSession] = useState<FocusSession | null>(
    () => readSubmittedSession(userId)
  )
  const [isEditingSubmittedSession, setIsEditingSubmittedSession] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [autoCommitting, setAutoCommitting] = useState(() => {
    if (!userId || readSubmittedSession(userId)) return false
    const elapsed = readFocusElapsed()
    return elapsed !== null && elapsed >= FOCUS_TIMER_MIN_FOCUS_MS
  })
  const autoCommitRanRef = useRef(false)
  const isShowingConfirmation =
    submittedSession !== null && !isEditingSubmittedSession

  useEffect(() => {
    if (!userId || submittedSession) return

    writeFocusDraft(userId, { category, hours, minutes })
  }, [category, hours, minutes, submittedSession, userId])

  useEffect(() => {
    if (!userId) return
    if (autoCommitRanRef.current) return
    autoCommitRanRef.current = true

    void (async () => {
      const elapsedMs = consumeFocusTimer()
      if (elapsedMs === null) {
        setAutoCommitting(false)
        return
      }

      // Cross-tab guard: if another tab already wrote the submitted session
      // for this user (e.g., user has /focus open in two tabs and exited in
      // tab A), don't double-insert.
      if (readSubmittedSession(userId)) {
        const existing = readSubmittedSession(userId)
        if (existing) {
          setSubmittedSession(existing)
          setIsEditingSubmittedSession(false)
        }
        setAutoCommitting(false)
        return
      }

      try {
        const lastCategory = await getLastFocusCategory(userId).catch(() => null)
        const draft = readFocusDraft(userId)
        const finalCategory =
          lastCategory ?? draft.category ?? DEFAULT_FOCUS_DRAFT.category
        const durationHours = elapsedMs / (1000 * 60 * 60)
        const session = await addFocusSession(userId, finalCategory, durationHours)
        clearFocusDraft(userId)
        writeSubmittedSession(userId, session)
        setSubmittedSession(session)
        setIsEditingSubmittedSession(false)
        setAutoCommitting(false)
      } catch {
        // Auto-commit failed (network / RLS / migration drift). Pre-fill the
        // duration & category so the user can manually confirm — the timer
        // is already consumed at this point.
        const prefilled = getDraftFromDuration(elapsedMs / (1000 * 60 * 60))
        setHours(prefilled.hours)
        setMinutes(prefilled.minutes)
        const lastCategory = await getLastFocusCategory(userId).catch(() => null)
        if (lastCategory) setCategory(lastCategory)
        setError('自动记录失败，请手动确认或更正')
        setAutoCommitting(false)
      }
    })()
  }, [userId])

  const handleDone = () => {
    clearSubmittedSession(userId)
    setSubmittedSession(null)
    setIsEditingSubmittedSession(false)
    onComplete()
  }

  const handleSkipPanel = () => {
    if (userId) {
      clearFocusDraft(userId)
    }
    clearSubmittedSession(userId)
    setSubmittedSession(null)
    setIsEditingSubmittedSession(false)
    onSkip()
  }

  const handleEditSubmittedSession = () => {
    if (!submittedSession) return

    const nextDraft = getDraftFromDuration(submittedSession.duration)
    setCategory(submittedSession.category)
    setHours(nextDraft.hours)
    setMinutes(nextDraft.minutes)
    setError('')
    setIsEditingSubmittedSession(true)
  }

  const handleCancelEdit = () => {
    if (!submittedSession) return

    const nextDraft = getDraftFromDuration(submittedSession.duration)
    setCategory(submittedSession.category)
    setHours(nextDraft.hours)
    setMinutes(nextDraft.minutes)
    setError('')
    setIsEditingSubmittedSession(false)
  }

  const handleSubmit = async () => {
    if (!userId) return
    const durationHours = getFocusDurationHours({ hours, minutes })

    if (durationHours === null) {
      setError('请输入有效的时长')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const nextSession =
        submittedSession && isEditingSubmittedSession
          ? await correctSubmittedFocusSession(
              submittedSession.id,
              category,
              durationHours
            )
          : await addFocusSession(userId, category, durationHours)
      clearFocusDraft(userId)
      writeSubmittedSession(userId, nextSession)
      setSubmittedSession(nextSession)
      setIsEditingSubmittedSession(false)
      setSubmitting(false)
    } catch (err) {
      console.error('专注记录保存失败:', err)
      setError('保存失败，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div className="session-end-backdrop">
      <div className="session-end-card float-card glow-coral">
        <div className="session-end-title">
          {autoCommitting
            ? '正在记录本次专注'
            : isShowingConfirmation
              ? '已记录本次专注'
              : isEditingSubmittedSession
                ? '更正刚刚记录'
                : '记录本次专注'}
        </div>

        {autoCommitting ? (
          <div className="session-end-label" style={{ marginBottom: 16 }}>
            正在根据计时器写入这次的专注记录...
          </div>
        ) : isShowingConfirmation && submittedSession ? (
          <>
            <div className="session-end-label">刚刚保存的记录</div>
            <div className="session-end-duration">
              <div className="session-end-label">{getCategoryLabel(submittedSession.category)}</div>
              <div className="session-end-label">{formatDuration(submittedSession.duration)}</div>
            </div>

            <div className="session-end-actions">
              <button
                className="btn-warm"
                onClick={handleDone}
              >
                完成
              </button>
              <button
                className="btn-outline"
                onClick={handleEditSubmittedSession}
              >
                更正刚刚记录
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Category pills */}
            <div className="session-end-label">专注类型</div>
            <div className="session-end-pills">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  className={`pill${category === c.value ? ' active' : ''}`}
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Duration input */}
            <div className="session-end-duration">
              <div className="session-end-label">时长</div>
              <div className="session-end-duration-fields">
                <label className="session-end-duration-field">
                  <span className="session-end-duration-caption">小时</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={hours}
                    onChange={e => {
                      setHours(e.target.value)
                      setError('')
                    }}
                    className="field-input"
                  />
                </label>
                <label className="session-end-duration-field">
                  <span className="session-end-duration-caption">分钟</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="59"
                    placeholder="30"
                    value={minutes}
                    onChange={e => {
                      setMinutes(e.target.value)
                      setError('')
                    }}
                    className="field-input"
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="session-end-actions">
              <button
                className="btn-warm"
                onClick={handleSubmit}
                disabled={submitting || (!hours.trim() && !minutes.trim())}
              >
                {submitting
                  ? isEditingSubmittedSession
                    ? '保存更正中...'
                    : '保存中...'
                  : isEditingSubmittedSession
                    ? '保存更正'
                    : '确认记录'}
              </button>
              <button
                className="btn-outline"
                onClick={isEditingSubmittedSession ? handleCancelEdit : handleSkipPanel}
              >
                {isEditingSubmittedSession ? '返回确认' : '跳过'}
              </button>
            </div>
          </>
        )}

        {error && <div className="session-end-error">{error}</div>}
      </div>
    </div>
  )
}

export default function SessionEndPanel(props: Props) {
  const { user } = useAuth()

  return (
    <SessionEndPanelContent
      key={user?.id ?? 'anon'}
      userId={user?.id ?? null}
      {...props}
    />
  )
}
