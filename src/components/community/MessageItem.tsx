'use client'

import type { Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'
import CheckinCard from './CheckinCard'

interface Props {
  message: Message
  profile?: UserProfile
  isOwn: boolean
  replyMessage?: Message
  replyProfile?: UserProfile
  onReply?: (message: Message) => void
  onImageClick?: (url: string) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return isToday ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

export default function MessageItem({ message, profile, isOwn, replyMessage, replyProfile, onReply, onImageClick }: Props) {
  const nickname = profile?.nickname ?? '未知用户'
  const initial = nickname[0]?.toUpperCase() ?? '?'

  return (
    <div className={`msg-item${isOwn ? ' own' : ''}`}>
      <div className="msg-avatar" title={nickname}>{initial}</div>
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-nickname">{nickname}</span>
          <span className="msg-time">{formatTime(message.created_at)}</span>
        </div>

        {/* Reply quote */}
        {replyMessage && (
          <div className="msg-reply-quote">
            <span className="msg-reply-author">{replyProfile?.nickname ?? '未知用户'}</span>
            <span className="msg-reply-text">
              {replyMessage.message_type === 'text'
                ? (replyMessage.content ?? '').slice(0, 60)
                : replyMessage.message_type === 'image' ? '[图片]' : '[打卡]'}
            </span>
          </div>
        )}

        {/* Content by type */}
        {message.message_type === 'text' && (
          <div className="msg-text">{message.content}</div>
        )}
        {message.message_type === 'image' && (
          <div className="msg-image-wrap">
            <img
              src={message.image_url ?? ''}
              alt=""
              className="msg-image"
              loading="lazy"
              onClick={() => onImageClick?.(message.image_url ?? '')}
            />
          </div>
        )}
        {message.message_type === 'checkin' && message.checkin_data && (
          <div className="msg-checkin-card">
            <CheckinCard data={message.checkin_data as any} />
          </div>
        )}

        {/* Reply action */}
        {onReply && (
          <button className="msg-reply-btn" onClick={() => onReply(message)}>回复</button>
        )}
      </div>
    </div>
  )
}
