'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getMessages, subscribeToChannel, unsubscribeFromChannel, type Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'
import type { RealtimeChannel } from '@supabase/supabase-js'
import MessageItem from './MessageItem'

interface Props {
  channelId: string
  userId: string
  profilesMap: Record<string, UserProfile>
  replyTo?: Message | null
  onReply?: (message: Message) => void
}

export default function MessageList({ channelId, userId, profilesMap, onReply }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const realtimeRef = useRef<RealtimeChannel | null>(null)

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
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      if (isNearBottom.current) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    })
    realtimeRef.current = channel

    return () => {
      if (realtimeRef.current) {
        unsubscribeFromChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [channelId])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100

    // Load more when near top
    if (el.scrollTop < 50 && hasMore && !loadingMore && messages.length > 0) {
      setLoadingMore(true)
      const oldest = messages[0]?.created_at
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
      }).catch(() => setLoadingMore(false))
    }
  }, [channelId, hasMore, loadingMore, messages])

  return (
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {loadingMore && <div className="message-loading-more">加载更多...</div>}
      {loading ? (
        <div className="message-loading">加载消息中...</div>
      ) : messages.length === 0 ? (
        <div className="message-empty">还没有消息，说点什么吧</div>
      ) : (
        messages.map(msg => (
          <MessageItem
            key={msg.id}
            message={msg}
            profile={profilesMap[msg.user_id]}
            isOwn={msg.user_id === userId}
            replyMessage={msg.reply_to ? messages.find(m => m.id === msg.reply_to) : undefined}
            replyProfile={msg.reply_to ? profilesMap[messages.find(m => m.id === msg.reply_to)?.user_id ?? ''] : undefined}
            onReply={onReply}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
