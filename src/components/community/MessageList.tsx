'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getMessages, subscribeToChannel, unsubscribeFromChannel, deleteMessage, type Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'
import type { RealtimeChannel } from '@supabase/supabase-js'
import MessageItem from './MessageItem'
import ImagePreview from './ImagePreview'

interface Props {
  channelId: string
  userId: string
  isAdmin: boolean
  profilesMap: Record<string, UserProfile>
  onReply?: (message: Message) => void
  pendingMessage?: Message | null
}

export default function MessageList({ channelId, userId, isAdmin, profilesMap, onReply, pendingMessage }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const realtimeRef = useRef<RealtimeChannel | null>(null)
  const messagesRef = useRef<Message[]>([])
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  messagesRef.current = messages
  loadingMoreRef.current = loadingMore
  hasMoreRef.current = hasMore

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId, userId, isAdmin)
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  // Load initial messages
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setLoading(true)
    setHasMore(true)

    getMessages(channelId).then(msgs => {
      if (cancelled) return
      setMessages(msgs)
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
    }).catch(err => {
      console.error('加载消息失败:', err)
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [channelId])

  // Realtime subscription
  useEffect(() => {
    const channel = subscribeToChannel(channelId, (newMsg) => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === newMsg.id)
        if (idx !== -1) {
          // Replace existing entry (e.g. checkin with stale null data now has full data)
          const updated = [...prev]
          updated[idx] = newMsg
          return updated
        }
        return [...prev, newMsg]
      })
      if (isNearBottom.current) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    })

    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      const deletedId = payload.old.id
      setMessages(prev => prev.filter(m => m.id !== deletedId))
    })

    realtimeRef.current = channel

    return () => {
      if (realtimeRef.current) {
        unsubscribeFromChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [channelId])

  // Insert pending message from parent (e.g. optimistic checkin)
  useEffect(() => {
    if (!pendingMessage) return
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === pendingMessage.id)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = pendingMessage
        return updated
      }
      return [...prev, pendingMessage]
    })
    if (isNearBottom.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [pendingMessage])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100

    // Load more when near top
    if (el.scrollTop < 50 && hasMoreRef.current && !loadingMoreRef.current && messagesRef.current.length > 0) {
      setLoadingMore(true)
      loadingMoreRef.current = true
      const oldest = messagesRef.current[0]?.created_at
      const prevHeight = el.scrollHeight
      getMessages(channelId, oldest).then(older => {
        if (older.length < 50) setHasMore(false)
        if (older.length > 0) {
          setMessages(prev => [...older, ...prev])
          // Preserve scroll position
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight - prevHeight
          })
        }
        setLoadingMore(false)
        loadingMoreRef.current = false
      }).catch(() => {
        setLoadingMore(false)
        loadingMoreRef.current = false
      })
    }
  }, [channelId])

  return (
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {loadingMore && <div className="message-loading-more">加载更多...</div>}
      {loading ? (
        <div className="message-loading">加载消息中...</div>
      ) : messages.length === 0 ? (
        <div className="message-empty">还没有消息，说点什么吧</div>
      ) : (
        messages.map(msg => {
          const replied = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : undefined
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              profile={profilesMap[msg.user_id]}
              isOwn={msg.user_id === userId}
              isAdmin={isAdmin}
              replyMessage={replied}
              replyProfile={replied ? profilesMap[replied.user_id] : undefined}
              onReply={onReply}
              onImageClick={setPreviewImage}
              onDelete={handleDelete}
            />
          )
        })
      )}
      <div ref={bottomRef} />
      {previewImage && <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  )
}
