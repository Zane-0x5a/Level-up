'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfile, type UserProfile } from '@/lib/api/user-profiles'
import { getAllProfiles } from '@/lib/api/user-profiles'
import { getChannels, type Channel } from '@/lib/api/channels'
import type { Message } from '@/lib/api/messages'
import NicknameModal from '@/components/community/NicknameModal'
import ChannelList from '@/components/community/ChannelList'
import MessageList from '@/components/community/MessageList'
import ChatInput from '@/components/community/ChatInput'
import './community.css'

export default function CommunityPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({})
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsNickname, setNeedsNickname] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const loadRequestIdRef = useRef(0)
  const loadedUserIdRef = useRef<string | null>(null)

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current
    if (!userId) {
      loadedUserIdRef.current = null
      setProfile(null)
      setProfilesMap({})
      setChannels([])
      setActiveChannelId(null)
      setNeedsNickname(false)
      setLoading(false)
      return
    }
    if (loadedUserIdRef.current !== userId) {
      setProfile(null)
      setProfilesMap({})
      setChannels([])
      setActiveChannelId(null)
      setReplyTo(null)
      setPendingMessage(null)
      setNeedsNickname(false)
      setLoading(true)
    }
    try {
      const [myProfile, allProfiles, allChannels] = await Promise.all([
        getProfile(userId),
        getAllProfiles(),
        getChannels(),
      ])
      if (loadRequestIdRef.current !== requestId) return
      loadedUserIdRef.current = userId

      if (!myProfile) {
        setNeedsNickname(true)
        setLoading(false)
        return
      }

      setProfile(myProfile)
      const map: Record<string, UserProfile> = {}
      allProfiles.forEach(p => { map[p.user_id] = p })
      setProfilesMap(map)
      setChannels(allChannels)

      setActiveChannelId(currentId => {
        if (allChannels.length === 0) return null
        return currentId && allChannels.some(channel => channel.id === currentId)
          ? currentId
          : allChannels[0].id
      })
    } catch (err) {
      if (loadRequestIdRef.current === requestId) {
        console.error('加载社群数据失败:', err)
      }
    } finally {
      if (loadRequestIdRef.current === requestId) setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  const handleNicknameComplete = () => {
    setNeedsNickname(false)
    loadData()
  }

  if (loading) {
    return <main className="community-page"><p className="community-loading">加载中...</p></main>
  }

  if (needsNickname && user) {
    return (
      <main className="community-page">
        <NicknameModal userId={user.id} onComplete={handleNicknameComplete} />
      </main>
    )
  }

  return (
    <main className="community-page">
      <div className="community-layout">
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          onSelect={(id: string) => {
            setActiveChannelId(id)
            setReplyTo(null)
            setPendingMessage(null)
          }}
          isAdmin={profile?.is_admin ?? false}
          userId={user?.id ?? ''}
          onChannelsChange={loadData}
        />
        <div className="community-main">
          {activeChannelId && user ? (
            <>
              <MessageList
                key={activeChannelId}
                channelId={activeChannelId}
                userId={user.id}
                isAdmin={profile?.is_admin ?? false}
                profilesMap={profilesMap}
                onReply={setReplyTo}
                pendingMessage={pendingMessage}
              />
              <ChatInput
                channelId={activeChannelId}
                userId={user.id}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onNewMessage={setPendingMessage}
              />
            </>
          ) : (
            <div className="community-empty">
              <p>还没有频道，请联系管理员创建</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
