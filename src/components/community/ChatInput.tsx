'use client'
import type { Message } from '@/lib/api/messages'

interface Props {
  channelId: string
  userId: string
  replyTo?: Message | null
  onClearReply?: () => void
}

export default function ChatInput({ channelId, userId }: Props) {
  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <textarea
          className="chat-textarea"
          placeholder="输入消息..."
          rows={1}
        />
        <button className="chat-send-btn" disabled>
          发送
        </button>
      </div>
    </div>
  )
}
