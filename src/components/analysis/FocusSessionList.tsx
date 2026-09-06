'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  addFocusSession,
  correctSubmittedFocusSession,
  deleteFocusSession,
  type FocusSession,
} from '@/lib/api/focus-sessions'
import { getFocusDurationHours } from '@/lib/focus-draft'
import WheelNumberInput from '../focus/WheelNumberInput'

type Props = {
  sessions: FocusSession[]
  onChanged: () => void
  date: string
  userId: string
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
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

export default function FocusSessionList({ sessions, onChanged, date, userId, disabled = false, onBusyChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [category, setCategory] = useState('in_class')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [newSessionId, setNewSessionId] = useState('')
  const isBusy = busyId !== null

  const startAdd = () => {
    setEditingId(null)
    setConfirmingDeleteId(null)
    setCategory('in_class')
    setHours('')
    setMinutes('')
    setError('')
    setNewSessionId(crypto.randomUUID())
    setAdding(true)
  }

  const startEdit = (session: FocusSession) => {
    setAdding(false)
    const fields = getDurationFields(session.duration)
    setEditingId(session.id)
    setConfirmingDeleteId(null)
    setCategory(session.category)
    setHours(fields.hours)
    setMinutes(fields.minutes)
    setError('')
  }

  const cancelEdit = () => {
    setAdding(false)
    setEditingId(null)
    setError('')
  }

  const addSession = async () => {
    const durationHours = getFocusDurationHours({ hours, minutes })
    if (isBusy || disabled) return
    if (durationHours === null) {
      setError('请输入大于 0 且不超过 8 小时的时长')
      return
    }
    setBusyId('new')
    onBusyChange?.(true)
    setError('')
    try {
      await addFocusSession(userId, category, durationHours, newSessionId, date)
      setAdding(false)
      await onChanged()
    } catch {
      setError('添加失败，请重试')
    } finally {
      setBusyId(null)
      onBusyChange?.(false)
    }
  }

  const saveEdit = async (session: FocusSession) => {
    const durationHours = getFocusDurationHours({ hours, minutes })
    if (durationHours === null) {
      setError('请输入有效的时长')
      return
    }

    setError('')
    setBusyId(session.id)
    onBusyChange?.(true)
    try {
      await correctSubmittedFocusSession(session.id, category, durationHours)
      setEditingId(null)
      await onChanged()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setBusyId(null)
      onBusyChange?.(false)
    }
  }

  const confirmDelete = async (session: FocusSession) => {
    setError('')
    setBusyId(session.id)
    onBusyChange?.(true)
    try {
      await deleteFocusSession(session.id)
      setConfirmingDeleteId(null)
      await onChanged()
    } catch {
      setError('删除失败，请重试')
    } finally {
      setBusyId(null)
      onBusyChange?.(false)
    }
  }

  const renderEditor = (session?: FocusSession) => (
    <form
      className="focus-session-editor"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isBusy && !disabled) void (session ? saveEdit(session) : addSession())
      }}
    >
      <div className="focus-session-editor-title">
        {session ? '修改专注记录' : '添加专注记录'}
        <time dateTime={date}>{date}</time>
      </div>
      <fieldset disabled={isBusy || disabled} className="focus-session-editor-fields" aria-label="专注记录详情">
        <div className="focus-session-category-field">
          <span className="focus-session-edit-caption">分类</span>
          <div className="session-end-pills" role="group" aria-label="分类">
          {CATEGORIES.map((item) => (
            <button key={item.value} type="button" aria-pressed={category === item.value}
              className={`pill${category === item.value ? ' active' : ''}`}
              onClick={() => setCategory(item.value)}>
              {item.label}
            </button>
          ))}
          </div>
        </div>
        <div className="focus-session-edit-fields">
          <label className="focus-session-edit-field">
            <span className="focus-session-edit-caption">小时</span>
            <WheelNumberInput min={0} max={8} placeholder="0" value={hours}
              onValueChange={setHours} onUserEdit={() => setError('')}
              className="field-input" ariaLabel="小时" disabled={isBusy || disabled} />
          </label>
          <label className="focus-session-edit-field">
            <span className="focus-session-edit-caption">分钟</span>
            <WheelNumberInput min={0} max={59} placeholder="0" value={minutes}
              onValueChange={setMinutes} onUserEdit={() => setError('')}
              className="field-input" ariaLabel="分钟" disabled={isBusy || disabled}
              dialStepDeg={9} dialLabelEvery={5} />
          </label>
        </div>
        <div className="focus-session-actions">
          <button type="submit" className="btn-warm focus-session-btn">
            {isBusy ? '保存中...' : session ? '保存修改' : '添加记录'}
          </button>
          <button type="button" className="btn-outline focus-session-btn" onClick={cancelEdit}>取消</button>
        </div>
      </fieldset>
      {error && <div role="alert" className="focus-session-error">{error}</div>}
    </form>
  )

  return (
    <div>
      <div className="focus-session-heading">
        <span className="entry-field-label">这一天的专注记录</span>
        {!adding && <button type="button" className="btn-outline focus-session-add"
          disabled={disabled || isBusy} onClick={startAdd}>
          <Plus size={16} aria-hidden="true" />添加记录
        </button>}
      </div>
      {adding && renderEditor()}
      {!adding && sessions.length === 0 && (
        <div className="focus-session-empty">{disabled ? '正在加载专注记录...' : '这一天还没有专注记录。'}</div>
      )}
      <div className="focus-session-list">
      {sessions.map((session) => {
        const isEditing = editingId === session.id
        const isConfirmingDelete = confirmingDeleteId === session.id
        const isBusy = busyId === session.id

        if (isEditing) {
          return <div key={session.id}>{renderEditor(session)}</div>
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
                  disabled={disabled || busyId !== null}
                >
                  修改
                </button>
                <button
                  type="button"
                  className="focus-session-link-btn"
                  onClick={() => {
                    setAdding(false)
                    setEditingId(null)
                    setConfirmingDeleteId(session.id)
                    setError('')
                  }}
                  disabled={disabled || busyId !== null}
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
    </div>
  )
}
