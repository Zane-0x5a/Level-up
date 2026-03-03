'use client'

import { useState, useRef } from 'react'
import { sendTextMessage, sendImageMessage, type Message } from '@/lib/api/messages'

interface Props {
  channelId: string
  userId: string
  replyTo?: Message | null
  onClearReply?: () => void
}

export default function ChatInput({ channelId, userId, replyTo, onClearReply }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
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

  return (
    <div className="chat-input-area">
      {replyTo && (
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
