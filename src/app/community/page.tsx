'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfile, type UserProfile } from '@/lib/api/user-profiles'
import { getAllProfiles } from '@/lib/api/user-profiles'
import { getChannels, type Channel } from '@/lib/api/channels'
import NicknameModal from '@/components/community/NicknameModal'
import ChannelList from '@/components/community/ChannelList'
import MessageList from '@/components/community/MessageList'
import ChatInput from '@/components/community/ChatInput'
import './community.css'

export default function CommunityPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({})
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsNickname, setNeedsNickname] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [myProfile, allProfiles, allChannels] = await Promise.all([
        getProfile(user.id),
        getAllProfiles(),
        getChannels(),
      ])

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

      if (allChannels.length > 0) {
        const stillExists = activeChannelId && allChannels.some(ch => ch.id === activeChannelId)
        if (!stillExists) {
          setActiveChannelId(allChannels[0].id)
        }
      } else {
        setActiveChannelId(null)
      }
    } catch (err) {
      console.error('加载社群数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeChannelId])

  useEffect(() => { loadData() }, [loadData])

  const handleNicknameComplete = (nickname: string) => {
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
          onSelect={setActiveChannelId}
          isAdmin={profile?.is_admin ?? false}
          userId={user?.id ?? ''}
          onChannelsChange={loadData}
        />
        <div className="community-main">
          {activeChannelId && user ? (
            <>
              <MessageList
                channelId={activeChannelId}
                userId={user.id}
                profilesMap={profilesMap}
              />
              <ChatInput
                channelId={activeChannelId}
                userId={user.id}
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
