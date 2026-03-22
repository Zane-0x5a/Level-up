'use client'

import { useState, useRef } from 'react'
import { sendTextMessage, sendImageMessage, sendCheckinMessage, type Message } from '@/lib/api/messages'
import { getDailyRecord } from '@/lib/api/daily-records'
import { getTodayFocusSessions } from '@/lib/api/focus-sessions'

interface Props {
  channelId: string
  userId: string
  replyTo?: Message | null
  onClearReply?: () => void
  onNewMessage?: (message: Message) => void
}

interface CheckinDialogState {
  date: string
  dayType: string
  focusMinutes: number
  noteSnippet?: string
}

export default function ChatInput({ channelId, userId, replyTo, onClearReply, onNewMessage }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [checkinDialog, setCheckinDialog] = useState<CheckinDialogState | null>(null)
  const [includeNote, setIncludeNote] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await sendTextMessage(channelId, userId, trimmed, replyTo?.id)
      setText('')
      onClearReply?.()
      inputRef.current?.focus()
    } catch (err) {
      console.error('发送失败:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    try {
      await sendImageMessage(channelId, userId, file)
    } catch (err) {
      console.error('图片发送失败:', err)
    } finally {
      setSending(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleCheckin = async () => {
    if (sending) return
    setSending(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [record, sessions] = await Promise.all([
        getDailyRecord(userId, today),
        getTodayFocusSessions(userId),
      ])
      const focusMinutes = Math.round(sessions.reduce((sum: number, s: any) => sum + (s.duration ?? 0), 0) / 60)
      setCheckinDialog({
        date: today,
        dayType: record?.day_type ?? 'study_day',
        focusMinutes,
        noteSnippet: record?.note ? record.note.slice(0, 50) : undefined,
      })
      setIncludeNote(false)
    } catch (err) {
      console.error('获取打卡数据失败:', err)
    } finally {
      setSending(false)
    }
  }

  const handleCheckinConfirm = async () => {
    if (!checkinDialog) return
    setSending(true)
    try {
      const msg = await sendCheckinMessage(channelId, userId, {
        date: checkinDialog.date,
        day_type: checkinDialog.dayType,
        focus_minutes: checkinDialog.focusMinutes,
        note_snippet: includeNote ? checkinDialog.noteSnippet : undefined,
      })
      onNewMessage?.(msg)
      setCheckinDialog(null)
    } catch (err) {
      console.error('打卡失败:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-input-area">
      {checkinDialog && (
        <div className="checkin-privacy-overlay" onClick={() => setCheckinDialog(null)}>
          <div className="checkin-privacy-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="checkin-privacy-title">分享打卡</h3>
            <div className="checkin-privacy-preview">
              <div className="checkin-privacy-row">
                <span className="checkin-privacy-label">专注时长</span>
                <span className="checkin-privacy-val">
                  {Math.floor(checkinDialog.focusMinutes / 60)}h
                  {checkinDialog.focusMinutes % 60 > 0 ? `${checkinDialog.focusMinutes % 60}m` : ''}
                </span>
              </div>
              <div className="checkin-privacy-row">
                <span className="checkin-privacy-label">日类型</span>
                <span className="checkin-privacy-val">
                  {checkinDialog.dayType === 'rest_day' ? '假期' : '上学日'}
                </span>
              </div>
            </div>
            {checkinDialog.noteSnippet && (
              <label className="checkin-privacy-toggle">
                <input
                  type="checkbox"
                  checked={includeNote}
                  onChange={e => setIncludeNote(e.target.checked)}
                />
                <span>附带今日总结</span>
                {includeNote && (
                  <p className="checkin-privacy-note-preview">{checkinDialog.noteSnippet}{checkinDialog.noteSnippet.length >= 50 ? '…' : ''}</p>
                )}
              </label>
            )}
            <div className="checkin-privacy-actions">
              <button className="checkin-privacy-cancel" onClick={() => setCheckinDialog(null)}>取消</button>
              <button className="checkin-privacy-confirm" onClick={handleCheckinConfirm} disabled={sending}>
                {sending ? '发送中...' : '发布打卡'}
              </button>
            </div>
          </div>
        </div>
      )}

        <div className="chat-reply-bar">
          <span>回复 {replyTo.content?.slice(0, 30) ?? '消息'}</span>
          <button onClick={onClearReply}>×</button>
        </div>
      )}
      <div className="chat-input-row">
        <button
          className="chat-action-btn"
          onClick={() => imageInputRef.current?.click()}
          title="发送图片"
          disabled={sending}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <button className="chat-action-btn" onClick={handleCheckin} title="打卡分享" disabled={sending}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </button>
        <textarea
          ref={inputRef}
          className="chat-textarea"
          placeholder="输入消息..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          发送
        </button>
      </div>
    </div>
  )
}
