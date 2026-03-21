'use client'

import { useState } from 'react'
import type { Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'
import CheckinCard from './CheckinCard'
import DeleteConfirmDialog from './DeleteConfirmDialog'

interface Props {
  message: Message
  profile?: UserProfile
  isOwn: boolean
  isAdmin: boolean
  replyMessage?: Message
  replyProfile?: UserProfile
  onReply?: (message: Message) => void
  onImageClick?: (url: string) => void
  onDelete?: (messageId: string) => Promise<void>
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return isToday ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

export default function MessageItem({ message, profile, isOwn, isAdmin, replyMessage, replyProfile, onReply, onImageClick, onDelete }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const nickname = profile?.nickname ?? '未知用户'
  const initial = nickname[0]?.toUpperCase() ?? '?'

  const canDelete = () => {
    if (isAdmin) return true
    if (!isOwn) return false
    const elapsed = (Date.now() - new Date(message.created_at).getTime()) / 1000 / 60
    return elapsed <= 3
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(message.id)
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('删除失败:', err)
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
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
        {canDelete() && onDelete && (
          <button className="msg-delete-btn" onClick={() => setShowDeleteDialog(true)}>
            删除
          </button>
        )}
      </div>
    </div>

    {showDeleteDialog && (
      <DeleteConfirmDialog
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleting}
      />
    )}
  </>
  )
}
