'use client'

import { useState } from 'react'
import {
  correctSubmittedFocusSession,
  deleteFocusSession,
  type FocusSession,
} from '@/lib/api/focus-sessions'
import { getFocusDurationHours } from '@/lib/focus-draft'

type Props = {
  sessions: FocusSession[]
  onChanged: () => void
}

const CATEGORIES = [
  { value: 'in_class', label: '课内学习' },
  { value: 'out_class', label: '课外学习' },
  { value: 'entertainment', label: '娱乐消费' },
]

function getCategoryLabel(category: string) {
  return CATEGORIES.find((item) => item.value === category)?.label ?? category
}

function getDurationFields(durationHours: number) {
  const totalMinutes = Math.round(durationHours * 60)
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  }
}

function formatDuration(durationHours: number) {
  const { hours, minutes } = getDurationFields(durationHours)
  const hourValue = Number(hours)
  const minuteValue = Number(minutes)
  const parts = []

  if (hourValue > 0) parts.push(`${hourValue}小时`)
  if (minuteValue > 0) parts.push(`${minuteValue}分钟`)

  return parts.join('') || '0分钟'
}

function formatTime(createdAt: string) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function FocusSessionList({ sessions, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [category, setCategory] = useState('in_class')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startEdit = (session: FocusSession) => {
    const fields = getDurationFields(session.duration)
    setEditingId(session.id)
    setConfirmingDeleteId(null)
    setCategory(session.category)
    setHours(fields.hours)
    setMinutes(fields.minutes)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError('')
  }

  const saveEdit = async (session: FocusSession) => {
    const durationHours = getFocusDurationHours({ hours, minutes })
    if (durationHours === null) {
      setError('请输入有效的时长')
      return
    }

    setError('')
    setBusyId(session.id)
    try {
      await correctSubmittedFocusSession(session.id, category, durationHours)
      setEditingId(null)
      onChanged()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async (session: FocusSession) => {
    setError('')
    setBusyId(session.id)
    try {
      await deleteFocusSession(session.id)
      setConfirmingDeleteId(null)
      onChanged()
    } catch {
      setError('删除失败，请重试')
    } finally {
      setBusyId(null)
    }
  }

  if (sessions.length === 0) {
    return <div className="focus-session-empty">这一天还没有专注记录。</div>
  }

  return (
    <div className="focus-session-list">
      {sessions.map((session) => {
        const isEditing = editingId === session.id
        const isConfirmingDelete = confirmingDeleteId === session.id
        const isBusy = busyId === session.id

        if (isEditing) {
          return (
            <div key={session.id} className="focus-session-row editing">
              <div className="session-end-pills">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`pill${category === c.value ? ' active' : ''}`}
                    onClick={() => setCategory(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="focus-session-edit-fields">
                <label className="focus-session-edit-field">
                  <span className="focus-session-edit-caption">小时</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={hours}
                    onChange={(e) => {
                      setHours(e.target.value)
                      setError('')
                    }}
                    className="field-input"
                  />
                </label>
                <label className="focus-session-edit-field">
                  <span className="focus-session-edit-caption">分钟</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="59"
                    placeholder="30"
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(e.target.value)
                      setError('')
                    }}
                    className="field-input"
                  />
                </label>
              </div>
              <div className="focus-session-actions">
                <button
                  type="button"
                  className="btn-warm focus-session-btn"
                  onClick={() => saveEdit(session)}
                  disabled={isBusy}
                >
                  {isBusy ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  className="btn-outline focus-session-btn"
                  onClick={cancelEdit}
                  disabled={isBusy}
                >
                  取消
                </button>
              </div>
              {error && <div className="focus-session-error">{error}</div>}
            </div>
          )
        }

        return (
          <div key={session.id} className="focus-session-row">
            <div className="focus-session-info">
              <span className="focus-session-category">
                {getCategoryLabel(session.category)}
              </span>
              <span className="focus-session-duration">
                {formatDuration(session.duration)}
              </span>
              {formatTime(session.created_at) && (
                <span className="focus-session-time">
                  {formatTime(session.created_at)}
                </span>
              )}
            </div>

            {isConfirmingDelete ? (
              <div className="focus-session-actions">
                <span className="focus-session-confirm-text">确认删除？</span>
                <button
                  type="button"
                  className="btn-warm focus-session-btn danger"
                  onClick={() => confirmDelete(session)}
                  disabled={isBusy}
                >
                  {isBusy ? '删除中...' : '删除'}
                </button>
                <button
                  type="button"
                  className="btn-outline focus-session-btn"
                  onClick={() => setConfirmingDeleteId(null)}
                  disabled={isBusy}
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="focus-session-actions">
                <button
                  type="button"
                  className="btn-outline focus-session-btn"
                  onClick={() => startEdit(session)}
                >
                  修改
                </button>
                <button
                  type="button"
                  className="focus-session-link-btn"
                  onClick={() => {
                    setConfirmingDeleteId(session.id)
                    setError('')
                  }}
                >
                  删除
                </button>
              </div>
            )}

            {error && isConfirmingDelete && (
              <div className="focus-session-error">{error}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
