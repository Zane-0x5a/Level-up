'use client'

import { useState, useRef } from 'react'
import { sendTextMessage, type Message } from '@/lib/api/messages'

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

  return (
    <div className="chat-input-area">
      {replyTo && (
        <div className="chat-reply-bar">
          <span>回复 {replyTo.content?.slice(0, 30) ?? '消息'}</span>
          <button onClick={onClearReply}>×</button>
        </div>
      )}
      <div className="chat-input-row">
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
