'use client'
import type { Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'

interface Props {
  channelId: string
  userId: string
  profilesMap: Record<string, UserProfile>
  replyTo?: Message | null
  onReply?: (message: Message) => void
}

export default function MessageList({ channelId, userId, profilesMap }: Props) {
  return (
    <div className="message-list">
      <div className="message-empty">加载中...</div>
    </div>
  )
}
