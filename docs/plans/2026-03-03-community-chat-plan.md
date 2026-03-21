# Community Chat Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. For all frontend UI tasks (Tasks 3-10), REQUIRED SUB-SKILL: Use frontend-design:frontend-design skill before writing any component code.

**Goal:** Add a community chat module with multi-channel messaging, image sharing, check-in data cards, and reply/quote functionality.

**Architecture:** Supabase Realtime (Postgres Changes CDC) for live messaging. Three new tables (user_profiles, channels, messages) with RLS. Chat images stored in Supabase Storage. Entry via homepage card, navigates to `/community` page with channel sidebar + message stream layout.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Realtime + Storage), vanilla CSS (L-Drift design system)

---

## Task 1: Database Migration — Tables, RLS, Storage

**Context:** All SQL runs via Supabase Dashboard or MCP tool. No local migration files needed (project uses Supabase-managed migrations).

**Step 1: Create user_profiles table**

```sql
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "authenticated users can read profiles"
  on user_profiles for select to authenticated using (true);

create policy "users can insert own profile"
  on user_profiles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users can update own profile"
  on user_profiles for update to authenticated
  using (auth.uid() = user_id);
```

**Step 2: Create channels table**

```sql
create table channels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table channels enable row level security;

create policy "authenticated users can read channels"
  on channels for select to authenticated using (true);

create policy "admins can create channels"
  on channels for insert to authenticated
  with check (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );

create policy "admins can delete channels"
  on channels for delete to authenticated
  using (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );

create policy "admins can update channels"
  on channels for update to authenticated
  using (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );
```

**Step 3: Create messages table**

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text,
  message_type text default 'text' not null,
  image_url text,
  checkin_data jsonb,
  reply_to uuid references messages(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_messages_channel_created on messages(channel_id, created_at desc);

alter table messages enable row level security;

create policy "authenticated users can read messages"
  on messages for select to authenticated using (true);

create policy "users can insert own messages"
  on messages for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users can delete own messages"
  on messages for delete to authenticated
  using (auth.uid() = user_id);
```

**Step 4: Enable Realtime for messages table**

In Supabase Dashboard: Database → Replication → enable `messages` table for INSERT events.

Or via SQL:
```sql
alter publication supabase_realtime add table messages;
```

**Step 5: Create chat-images Storage bucket**

In Supabase Dashboard: Storage → New bucket → name: `chat-images`, Public: true.

Then add RLS policies:
```sql
create policy "authenticated users can upload chat images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated users can read chat images"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-images');
```

**Step 6: Verify**

Query each table to confirm creation:
```sql
select * from user_profiles limit 0;
select * from channels limit 0;
select * from messages limit 0;
```

**Step 7: Commit** — No code files changed in this task. Proceed to next task.

---

## Task 2: API Layer — user-profiles.ts, channels.ts, messages.ts

**Files:**
- Create: `src/lib/api/user-profiles.ts`
- Create: `src/lib/api/channels.ts`
- Create: `src/lib/api/messages.ts`

**Step 1: Create user-profiles.ts**

```ts
// src/lib/api/user-profiles.ts
import { supabase } from '@/lib/supabase'

export type UserProfile = {
  user_id: string
  nickname: string
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function createProfile(userId: string, nickname: string): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId, nickname })
  if (error) throw error
}

export async function updateProfile(userId: string, updates: { nickname?: string; avatar_url?: string }): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
  if (error) throw error
}
```

**Step 2: Create channels.ts**

```ts
// src/lib/api/channels.ts
import { supabase } from '@/lib/supabase'

export type Channel = {
  id: string
  name: string
  description: string | null
  created_by: string
  sort_order: number
  created_at: string
}

export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createChannel(name: string, userId: string, description?: string): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .insert({ name, created_by: userId, description })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChannel(channelId: string): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)
  if (error) throw error
}
```

**Step 3: Create messages.ts**

```ts
// src/lib/api/messages.ts
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type Message = {
  id: string
  channel_id: string
  user_id: string
  content: string | null
  message_type: 'text' | 'image' | 'checkin'
  image_url: string | null
  checkin_data: Record<string, unknown> | null
  reply_to: string | null
  created_at: string
}

const PAGE_SIZE = 50

export async function getMessages(channelId: string, before?: string): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reverse()
}

export async function sendTextMessage(channelId: string, userId: string, content: string, replyTo?: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      content,
      message_type: 'text',
      reply_to: replyTo ?? null,
    })
  if (error) throw error
}

export async function sendImageMessage(channelId: string, userId: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop() || 'png'
  const safeName = `${Date.now()}.${ext}`
  const filePath = `${userId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(filePath, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath)

  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      message_type: 'image',
      image_url: urlData.publicUrl,
    })
  if (error) throw error
}

export async function sendCheckinMessage(
  channelId: string,
  userId: string,
  checkinData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      message_type: 'checkin',
      checkin_data: checkinData,
    })
  if (error) throw error
}

export function subscribeToChannel(
  channelId: string,
  onNewMessage: (message: Message) => void
): RealtimeChannel {
  return supabase
    .channel(`channel-${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message)
      }
    )
    .subscribe()
}

export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}
```

**Step 4: Verify imports compile**

Run: `npx next build` (or just check that `next dev` doesn't error on import)

**Step 5: Commit**

```bash
git add src/lib/api/user-profiles.ts src/lib/api/channels.ts src/lib/api/messages.ts
git commit -m "feat(community): add API layer for profiles, channels, messages"
```

---

## Task 3: Nickname System — NicknameModal + Settings Integration

> **REQUIRED:** Use frontend-design skill before creating UI components.

**Files:**
- Create: `src/components/community/NicknameModal.tsx`
- Modify: `src/app/settings/page.tsx` — add nickname section
- Modify: `src/app/settings/settings.css` — add nickname styles

**Step 1: Create NicknameModal component**

Create `src/components/community/NicknameModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createProfile } from '@/lib/api/user-profiles'

interface Props {
  userId: string
  onComplete: (nickname: string) => void
}

export default function NicknameModal({ userId, onComplete }: Props) {
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError('')
    try {
      await createProfile(userId, trimmed)
      onComplete(trimmed)
    } catch (err) {
      console.error('创建昵称失败:', err)
      setError('设置失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="nickname-overlay">
      <div className="nickname-modal float-card glow-coral anim">
        <h2 className="nickname-title">设置你的昵称</h2>
        <p className="nickname-desc">进入社群前，请先设置一个昵称</p>
        <input
          className="field-input"
          type="text"
          placeholder="输入昵称..."
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          maxLength={20}
        />
        {error && <div className="nickname-error">{error}</div>}
        <button
          className="btn-warm"
          onClick={handleSubmit}
          disabled={!nickname.trim() || submitting}
        >
          {submitting ? '请稍候...' : '确认'}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Add nickname section to settings page**

In `src/app/settings/page.tsx`, add a "昵称" section in the Account area. Import `getProfile`, `updateProfile` from `@/lib/api/user-profiles`. Show current nickname with an edit button.

Add before the logout button in the Account section:
```tsx
// State
const [nickname, setNickname] = useState('')
const [editingNickname, setEditingNickname] = useState(false)
const [nicknameInput, setNicknameInput] = useState('')

// Load profile in existing loadMedia or new useEffect
useEffect(() => {
  if (!user) return
  getProfile(user.id).then(p => {
    if (p) setNickname(p.nickname)
  }).catch(() => {})
}, [user])

// Save handler
const saveNickname = async () => {
  if (!user || !nicknameInput.trim()) return
  try {
    await updateProfile(user.id, { nickname: nicknameInput.trim() })
    setNickname(nicknameInput.trim())
    setEditingNickname(false)
  } catch { setError('昵称更新失败') }
}
```

UI in the Account section:
```tsx
<div className="nickname-row">
  <span className="nickname-label">昵称：</span>
  {editingNickname ? (
    <div className="nickname-edit-row">
      <input
        className="field-input"
        value={nicknameInput}
        onChange={e => setNicknameInput(e.target.value)}
        maxLength={20}
      />
      <button className="btn-warm" onClick={saveNickname}>保存</button>
      <button className="btn-outline" onClick={() => setEditingNickname(false)}>取消</button>
    </div>
  ) : (
    <div className="nickname-display">
      <span>{nickname || '未设置'}</span>
      <button className="btn-outline" onClick={() => { setNicknameInput(nickname); setEditingNickname(true) }}>修改</button>
    </div>
  )}
</div>
```

**Step 3: Add CSS for NicknameModal and settings nickname section**

Add to `src/app/settings/settings.css` the nickname row styles. Create community CSS later in Task 4 for the modal overlay.

**Step 4: Verify** — Open settings page, confirm nickname section renders.

**Step 5: Commit**

```bash
git add src/components/community/NicknameModal.tsx src/app/settings/page.tsx src/app/settings/settings.css
git commit -m "feat(community): add nickname system with modal and settings integration"
```

---

## Task 4: Community Page Shell + Routing

> **REQUIRED:** Use frontend-design skill for page layout design.

**Files:**
- Create: `src/app/community/page.tsx`
- Create: `src/app/community/community.css`

**Step 1: Create community page shell**

```tsx
// src/app/community/page.tsx
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

      if (allChannels.length > 0 && !activeChannelId) {
        setActiveChannelId(allChannels[0].id)
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
```

**Step 2: Create community.css**

Use frontend-design skill here to create the CSS. Key layout:
- `.community-page` — full height, no scroll on page itself
- `.community-layout` — flex row, desktop: sidebar 220px + main fill
- `.community-main` — flex column, message list scrolls, input fixed at bottom
- Mobile (<900px): sidebar becomes horizontal tab strip

**Step 3: Create placeholder components**

Create minimal placeholder files for `ChannelList.tsx`, `MessageList.tsx`, `ChatInput.tsx` in `src/components/community/` so the page compiles. Just export empty divs for now.

**Step 4: Verify** — Navigate to `/community`, page should render.

**Step 5: Commit**

```bash
git add src/app/community/ src/components/community/
git commit -m "feat(community): add community page shell with routing"
```

---

## Task 5: Channel List + Admin Management

> **REQUIRED:** Use frontend-design skill for ChannelList UI.

**Files:**
- Create/Replace: `src/components/community/ChannelList.tsx`

**Step 1: Implement ChannelList**

```tsx
// src/components/community/ChannelList.tsx
'use client'

import { useState } from 'react'
import { createChannel, deleteChannel, type Channel } from '@/lib/api/channels'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelect: (id: string) => void
  isAdmin: boolean
  userId: string
  onChannelsChange: () => void
}

export default function ChannelList({ channels, activeChannelId, onSelect, isAdmin, userId, onChannelsChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await createChannel(newName.trim(), userId)
      setNewName('')
      setAdding(false)
      onChannelsChange()
    } catch (err) {
      console.error('创建频道失败:', err)
    }
  }

  const handleDelete = async (channelId: string) => {
    try {
      await deleteChannel(channelId)
      onChannelsChange()
    } catch (err) {
      console.error('删除频道失败:', err)
    }
  }

  return (
    <aside className="channel-sidebar">
      <div className="channel-header">
        <span className="channel-header-title">频道</span>
        {isAdmin && (
          <button className="channel-add-btn" onClick={() => setAdding(!adding)}>+</button>
        )}
      </div>
      {adding && (
        <div className="channel-add-form">
          <input
            className="field-input"
            placeholder="频道名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <div className="channel-add-btns">
            <button className="btn-warm" onClick={handleAdd} disabled={!newName.trim()}>创建</button>
            <button className="btn-outline" onClick={() => setAdding(false)}>取消</button>
          </div>
        </div>
      )}
      <div className="channel-list">
        {channels.map(ch => (
          <div
            key={ch.id}
            className={`channel-item${ch.id === activeChannelId ? ' active' : ''}`}
            onClick={() => onSelect(ch.id)}
          >
            <span className="channel-hash">#</span>
            <span className="channel-name">{ch.name}</span>
            {isAdmin && (
              <button
                className="channel-delete-btn"
                onClick={e => { e.stopPropagation(); handleDelete(ch.id) }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
```

**Step 2: Add CSS for channel sidebar**

In `src/app/community/community.css` — style the sidebar, channel items, active state, add form. Mobile: horizontal scrolling tabs strip.

**Step 3: Verify** — Admin user sees "+" button, can create and delete channels.

**Step 4: Commit**

```bash
git add src/components/community/ChannelList.tsx src/app/community/community.css
git commit -m "feat(community): add channel list with admin management"
```

---

## Task 6: Message List + Text Sending + Realtime

> **REQUIRED:** Use frontend-design skill for MessageList and MessageItem UI.

**Files:**
- Create/Replace: `src/components/community/MessageList.tsx`
- Create: `src/components/community/MessageItem.tsx`
- Create/Replace: `src/components/community/ChatInput.tsx`

**Step 1: Implement MessageList**

Key behaviors:
- Load initial 50 messages on mount
- Subscribe to Realtime INSERT events
- Auto-scroll to bottom on new messages (unless user has scrolled up)
- Load older messages when scrolling to top
- Clean up subscription on unmount or channel switch

```tsx
// src/components/community/MessageList.tsx
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
      setMessages(prev => [...prev, newMsg])
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
```

**Step 2: Implement MessageItem**

```tsx
// src/components/community/MessageItem.tsx
'use client'

import type { Message } from '@/lib/api/messages'
import type { UserProfile } from '@/lib/api/user-profiles'

interface Props {
  message: Message
  profile?: UserProfile
  isOwn: boolean
  replyMessage?: Message
  replyProfile?: UserProfile
  onReply?: (message: Message) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return isToday ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

export default function MessageItem({ message, profile, isOwn, replyMessage, replyProfile, onReply }: Props) {
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
            />
          </div>
        )}
        {message.message_type === 'checkin' && (
          <div className="msg-checkin-card">
            {/* CheckinCard rendered inline — see Task 8 */}
            <div className="checkin-placeholder">打卡数据</div>
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
```

**Step 3: Implement ChatInput (text only first)**

```tsx
// src/components/community/ChatInput.tsx
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
```

**Step 4: Wire up reply state in community page**

In `src/app/community/page.tsx`, add `replyTo` state and pass to MessageList + ChatInput.

**Step 5: Add CSS for messages and chat input** — Use frontend-design skill.

**Step 6: Verify** — Open two browser tabs, send a message in one, see it appear in the other via Realtime.

**Step 7: Commit**

```bash
git add src/components/community/MessageList.tsx src/components/community/MessageItem.tsx src/components/community/ChatInput.tsx src/app/community/
git commit -m "feat(community): add message list with realtime + text sending"
```

---

## Task 7: Image Messages

**Files:**
- Modify: `src/components/community/ChatInput.tsx` — add image upload button
- Create: `src/components/community/ImagePreview.tsx` — fullscreen image preview

**Step 1: Add image upload to ChatInput**

Add a file input (hidden) + image button. On file select, call `sendImageMessage`.

```tsx
// Add to ChatInput:
const imageInputRef = useRef<HTMLInputElement>(null)

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

// In the chat-input-row, before the textarea:
<button className="chat-action-btn" onClick={() => imageInputRef.current?.click()} title="发送图片">
  {/* Image icon SVG */}
</button>
<input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
```

**Step 2: Create ImagePreview**

A simple fullscreen overlay that shows the clicked image. Click to dismiss.

```tsx
// src/components/community/ImagePreview.tsx
'use client'

interface Props {
  src: string
  onClose: () => void
}

export default function ImagePreview({ src, onClose }: Props) {
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <img src={src} alt="" className="image-preview-img" />
    </div>
  )
}
```

**Step 3: Wire image click in MessageItem to open ImagePreview**

Lift preview state to community page or use local state in MessageList.

**Step 4: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add image message upload and preview"
```

---

## Task 8: Check-in Sharing

> **REQUIRED:** Use frontend-design skill for CheckinCard design.

**Files:**
- Create: `src/components/community/CheckinCard.tsx`
- Modify: `src/components/community/ChatInput.tsx` — add checkin button
- Modify: `src/components/community/MessageItem.tsx` — render CheckinCard

**Step 1: Create CheckinCard**

Renders `checkin_data` as a styled summary card. Fields: day_type, focus_minutes, note_snippet, date.

```tsx
// src/components/community/CheckinCard.tsx
'use client'

interface CheckinData {
  date?: string
  day_type?: string
  focus_minutes?: number
  note_snippet?: string
}

interface Props {
  data: CheckinData
}

export default function CheckinCard({ data }: Props) {
  const dayLabel = data.day_type === 'rest_day' ? '假期' : '上学日'
  const hours = data.focus_minutes ? Math.floor(data.focus_minutes / 60) : 0
  const mins = data.focus_minutes ? data.focus_minutes % 60 : 0

  return (
    <div className="checkin-card">
      <div className="checkin-header">
        <span className="checkin-icon">📋</span>
        <span className="checkin-date">{data.date ?? '今日'} 打卡</span>
      </div>
      <div className="checkin-stats">
        <div className="checkin-stat">
          <span className="checkin-stat-val">{hours}h{mins > 0 ? `${mins}m` : ''}</span>
          <span className="checkin-stat-label">专注时长</span>
        </div>
        <div className="checkin-stat">
          <span className="checkin-stat-val">{dayLabel}</span>
          <span className="checkin-stat-label">日类型</span>
        </div>
      </div>
      {data.note_snippet && (
        <div className="checkin-note">{data.note_snippet}</div>
      )}
    </div>
  )
}
```

**Step 2: Add checkin button to ChatInput**

On click:
1. Call `getDailyRecord(userId, today)` and `getTodayFocusSessions(userId)`
2. Compute total focus minutes from sessions
3. Call `sendCheckinMessage` with assembled data

```tsx
const handleCheckin = async () => {
  setSending(true)
  try {
    const today = new Date().toISOString().split('T')[0]
    const [record, sessions] = await Promise.all([
      getDailyRecord(userId, today),
      getTodayFocusSessions(userId),
    ])
    const focusMinutes = sessions.reduce((sum: number, s: any) => sum + (s.duration ?? 0), 0)
    await sendCheckinMessage(channelId, userId, {
      date: today,
      day_type: record?.day_type ?? 'study_day',
      focus_minutes: focusMinutes,
      note_snippet: record?.note ? record.note.slice(0, 50) : undefined,
    })
  } catch (err) {
    console.error('打卡失败:', err)
  } finally {
    setSending(false)
  }
}
```

**Step 3: Replace checkin placeholder in MessageItem** with actual `<CheckinCard data={message.checkin_data} />`

**Step 4: Commit**

```bash
git add src/components/community/
git commit -m "feat(community): add check-in sharing with data card"
```

---

## Task 9: Reply/Quote System

**Files:**
- Modify: `src/app/community/page.tsx` — reply state management
- Already wired in MessageList/MessageItem/ChatInput from Task 6

**Step 1: Wire reply state in community page**

```tsx
// In CommunityPage:
const [replyTo, setReplyTo] = useState<Message | null>(null)

// Pass to components:
<MessageList ... onReply={setReplyTo} />
<ChatInput ... replyTo={replyTo} onClearReply={() => setReplyTo(null)} />
```

**Step 2: Verify** — Click "回复" on a message, see reply bar in input area, send reply, confirm reply quote renders.

**Step 3: Commit**

```bash
git add src/app/community/page.tsx
git commit -m "feat(community): wire reply/quote functionality"
```

---

## Task 10: Homepage Entry Card

> **REQUIRED:** Use frontend-design skill for CommunityCard design.

**Files:**
- Create: `src/components/home/CommunityCard.tsx`
- Modify: `src/app/page.tsx` — add community card row
- Modify: `src/app/home.css` — add row 3 styles

**Step 1: Create CommunityCard**

A simple card with a chat bubble icon and "社群" text. Links to `/community`.

```tsx
// src/components/home/CommunityCard.tsx
'use client'

import Link from 'next/link'

export default function CommunityCard() {
  return (
    <Link href="/community" className="community-entry-card float-card glow-sage">
      <div className="community-entry-icon">💬</div>
      <div className="community-entry-text">
        <span className="community-entry-title">社群</span>
        <span className="community-entry-desc">和小伙伴聊天、打卡分享</span>
      </div>
      <span className="community-entry-arrow">→</span>
    </Link>
  )
}
```

**Step 2: Add to homepage**

In `src/app/page.tsx`, import and add below `home-row2`:

```tsx
import CommunityCard from '@/components/home/CommunityCard'

// After home-row2:
<div className="home-row3 anim d3">
  <CommunityCard />
</div>
```

**Step 3: Add CSS for home-row3 and community entry card**

In `src/app/home.css`:
```css
.home-row3 {
  padding-top: 4px;
}
```

**Step 4: Verify** — Homepage shows community card, clicking it navigates to /community.

**Step 5: Commit**

```bash
git add src/components/home/CommunityCard.tsx src/app/page.tsx src/app/home.css
git commit -m "feat(community): add homepage entry card"
```

---

## Task 11: Responsive Adaptation

> **REQUIRED:** Use frontend-design skill for responsive layout design.

**Files:**
- Modify: `src/app/community/community.css`

**Step 1: Desktop (>900px)** — Already handled: sidebar 220px + main flex.

**Step 2: Tablet/Mobile (<900px)**

```css
@media (max-width: 900px) {
  .community-layout {
    flex-direction: column;
  }
  .channel-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid rgba(43,45,66,0.06);
    padding: 8px 12px;
    gap: 6px;
  }
  .channel-header { display: none; }
  .channel-list {
    display: flex;
    flex-direction: row;
    gap: 6px;
  }
  .channel-item {
    white-space: nowrap;
    padding: 6px 14px;
    border-radius: 100px;
  }
}
```

**Step 3: Mobile (<640px)** — Smaller fonts, tighter padding.

**Step 4: Test** — Resize browser, verify layout switches properly.

**Step 5: Commit**

```bash
git add src/app/community/community.css
git commit -m "feat(community): add responsive adaptation for mobile/tablet"
```

---

## Summary of all commits

1. Database migration (manual via Supabase)
2. `feat(community): add API layer for profiles, channels, messages`
3. `feat(community): add nickname system with modal and settings integration`
4. `feat(community): add community page shell with routing`
5. `feat(community): add channel list with admin management`
6. `feat(community): add message list with realtime + text sending`
7. `feat(community): add image message upload and preview`
8. `feat(community): add check-in sharing with data card`
9. `feat(community): wire reply/quote functionality`
10. `feat(community): add homepage entry card`
11. `feat(community): add responsive adaptation for mobile/tablet`
