# Level Up 体验改进批次 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 实施 spec `docs/superpowers/specs/2026-05-25-level-up-improvements-batch-design.md` 中 7 个 topic 的体验改进。

**Architecture：** 按 spec C6 分两阶段执行。Phase A（§1 / §3 / §2 / §6）是低风险的 bug 修复与简单改进，互相独立，立即执行。Phase B（§7 / §5 / §4）是重构与新模块，需要更多测试与文案投入，留待用户醒来确认 priority。

**Tech Stack：** Next.js 15 (App Router) + TypeScript + Supabase + 原生 CSS（无 framework）+ Jest/Vitest（测试，按既有项目约定）。

**Reference 文件**：
- spec: `docs/superpowers/specs/2026-05-25-level-up-improvements-batch-design.md`
- 既有 draft pattern 范式: `src/lib/focus-draft.ts` + `src/lib/focus-draft.test.ts`
- design tokens: `src/styles/design-tokens.ts` + `src/app/globals.css` (`@theme inline`)

---

## Phase A — 立即执行

按风险递增排序：§1 → §3 → §2 → §6

---

### Task 1: §1 修复 community.css 幽灵 token

**Files:**
- Modify: `src/app/community/community.css:1043, 1068, 1114, 1143`

- [ ] **Step 1.1：Edit line 1043**

替换 `.checkin-privacy-dialog` 背景：

```
找：  background: var(--color-surface);
替： background: var(--color-card);
```

- [ ] **Step 1.2：Edit line 1068**

替换 `.checkin-privacy-preview` 背景：

```
找：  background: var(--color-surface-2);
替： background: var(--color-bg-sub);
```

- [ ] **Step 1.3：Edit line 1114**

替换 `.checkin-privacy-note-preview` 背景：

```
找：  background: var(--color-surface-2);
替： background: var(--color-bg-sub);
```

- [ ] **Step 1.4：Edit line 1143**

替换 `.checkin-privacy-cancel:hover` 背景：

```
找：  background: var(--color-surface-2);
替： background: var(--color-bg-sub);
```

- [ ] **Step 1.5：grep 验证 0 残留**

运行：

```bash
grep -rE "var\(--color-surface" src/
```

预期：0 行输出。

- [ ] **Step 1.6：Commit**

```bash
git add src/app/community/community.css
git commit -m "fix(community): replace ghost --color-surface tokens with existing --color-card / --color-bg-sub in checkin share modal"
```

---

### Task 2: §3 Realtime 修复 — sendTextMessage 返回 Message

**Files:**
- Modify: `src/lib/api/messages.ts`

- [ ] **Step 2.1：改 sendTextMessage 签名 + body**

现状（`messages.ts:36-47`）：

```ts
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
```

改成：

```ts
export async function sendTextMessage(
  channelId: string,
  userId: string,
  content: string,
  replyTo?: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      content,
      message_type: 'text',
      reply_to: replyTo ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Message
}
```

---

### Task 3: §3 — sendImageMessage 返回 Message

**Files:**
- Modify: `src/lib/api/messages.ts`

- [ ] **Step 3.1：改 sendImageMessage 签名 + body**

现状（`messages.ts:49-72`）：

```ts
export async function sendImageMessage(channelId: string, userId: string, file: File): Promise<void> {
  // ...upload to storage...
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
```

改成（保留 upload 部分，最后 insert 加 `.select().single()`，return 拿到的 Message）：

```ts
export async function sendImageMessage(channelId: string, userId: string, file: File): Promise<Message> {
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

  const { data, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      message_type: 'image',
      image_url: urlData.publicUrl,
    })
    .select()
    .single()
  if (error) throw error
  return data as Message
}
```

---

### Task 4: §3 — subscribeToChannel 加 onDelete 参数

**Files:**
- Modify: `src/lib/api/messages.ts`

- [ ] **Step 4.1：扩展 subscribeToChannel 签名 + 把 DELETE listener 移进来**

现状（`messages.ts:106-142`）：当前只有 INSERT listener，在 `.subscribe()` 之前。DELETE listener 在 `MessageList.tsx:84-92` 后追加（错误时序，永远不触发）。

改成：

```ts
export function subscribeToChannel(
  channelId: string,
  onNewMessage: (message: Message) => void,
  onDelete?: (messageId: string) => void,
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
      async (payload) => {
        const msg = payload.new as Message
        if (msg.message_type === 'checkin' && !msg.checkin_data) {
          const delays = [300, 800, 2000]
          for (const delay of delays) {
            await new Promise(r => setTimeout(r, delay))
            const full = await getMessageById(msg.id)
            if (full?.checkin_data) {
              onNewMessage(full)
              return
            }
          }
          const last = await getMessageById(msg.id)
          onNewMessage(last ?? msg)
          return
        }
        onNewMessage(msg)
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const deletedId = (payload.old as { id?: string })?.id
        if (deletedId) {
          onDelete?.(deletedId)
        }
      },
    )
    .subscribe()
}
```

---

### Task 5: §3 — MessageList 删除错位的 DELETE listener，传 onDelete 参数

**Files:**
- Modify: `src/components/community/MessageList.tsx:65-102`

- [ ] **Step 5.1：删除 line 84-92 + 改 subscribeToChannel 调用**

现状（关键片段）：

```tsx
// Line 65-102 现状
useEffect(() => {
  const channel = subscribeToChannel(channelId, (newMsg) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === newMsg.id)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = newMsg
        return updated
      }
      return [...prev, newMsg]
    })
    if (isNearBottom.current) {
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  })

  // ↓ 错位的 DELETE listener，要删
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
```

改成：

```tsx
useEffect(() => {
  const channel = subscribeToChannel(
    channelId,
    (newMsg) => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === newMsg.id)
        if (idx !== -1) {
          const updated = [...prev]
          updated[idx] = newMsg
          return updated
        }
        return [...prev, newMsg]
      })
      if (isNearBottom.current) {
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
        }, 50)
      }
    },
    (deletedId) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId))
    },
  )

  realtimeRef.current = channel

  return () => {
    if (realtimeRef.current) {
      unsubscribeFromChannel(realtimeRef.current)
      realtimeRef.current = null
    }
  }
}, [channelId])
```

---

### Task 6: §3 — ChatInput 走乐观更新

**Files:**
- Modify: `src/components/community/ChatInput.tsx:47-84`

- [ ] **Step 6.1：handleSend 改成拿 message 后调 onNewMessage**

现状：

```tsx
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
```

改成：

```tsx
const handleSend = async () => {
  const trimmed = text.trim()
  if (!trimmed || sending) return

  setSending(true)
  try {
    const msg = await sendTextMessage(channelId, userId, trimmed, replyTo?.id)
    onNewMessage?.(msg)
    setText('')
    onClearReply?.()
    inputRef.current?.focus()
  } catch (err) {
    console.error('发送失败:', err)
  } finally {
    setSending(false)
  }
}
```

- [ ] **Step 6.2：handleImageUpload 改成拿 message 后调 onNewMessage**

现状：

```tsx
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
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
```

改成：

```tsx
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  setSending(true)
  try {
    const msg = await sendImageMessage(channelId, userId, file)
    onNewMessage?.(msg)
  } catch (err) {
    console.error('图片发送失败:', err)
  } finally {
    setSending(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }
}
```

- [ ] **Step 6.3：Commit §3**

```bash
git add src/lib/api/messages.ts src/components/community/MessageList.tsx src/components/community/ChatInput.tsx
git commit -m "fix(community): realtime DELETE listener timing + optimistic text/image sends

- subscribeToChannel internally registers DELETE listener before .subscribe() so deletions propagate
- sendTextMessage / sendImageMessage now return Message; ChatInput optimistically inserts via onNewMessage
- MessageList's idx dedup handles realtime echo without duplicates"
```

---

### Task 7: §2 — 创建 daily-entry-draft.ts

**Files:**
- Create: `src/lib/daily-entry-draft.ts`

- [ ] **Step 7.1：写新模块（参照 focus-draft.ts 范式）**

`src/lib/daily-entry-draft.ts`：

```ts
import type { ProgressLevel, StateLabel } from '@/lib/api/daily-records'

export type DailyEntryDraft = {
  dayType: 'study_day' | 'rest_day'
  habitCheckins: number
  note: string
  progressLevel: ProgressLevel | null
  progressNote: string
  stateLabel: StateLabel | null
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const DEFAULT_DAILY_ENTRY_DRAFT: DailyEntryDraft = {
  dayType: 'study_day',
  habitCheckins: 0,
  note: '',
  progressLevel: null,
  progressNote: '',
  stateLabel: null,
}

const STORAGE_PREFIX = 'daily-entry-draft'

function getStorageKey(userId: string, date: string) {
  return `${STORAGE_PREFIX}:${userId}:${date}`
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function isValidProgressLevel(value: unknown): value is ProgressLevel {
  return value === 'slight' || value === 'solid' || value === 'breakthrough'
}

function isValidStateLabel(value: unknown): value is StateLabel {
  return (
    value === 'recovering' ||
    value === 'steady' ||
    value === 'good' ||
    value === 'energized'
  )
}

function isValidDayType(value: unknown): value is 'study_day' | 'rest_day' {
  return value === 'study_day' || value === 'rest_day'
}

export function readDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike,
): DailyEntryDraft | null {
  const target = getStorage(storage)
  if (!target) return null

  try {
    const raw = target.getItem(getStorageKey(userId, date))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DailyEntryDraft>

    return {
      dayType: isValidDayType(parsed.dayType) ? parsed.dayType : DEFAULT_DAILY_ENTRY_DRAFT.dayType,
      habitCheckins:
        typeof parsed.habitCheckins === 'number' && Number.isFinite(parsed.habitCheckins)
          ? parsed.habitCheckins
          : DEFAULT_DAILY_ENTRY_DRAFT.habitCheckins,
      note: typeof parsed.note === 'string' ? parsed.note : DEFAULT_DAILY_ENTRY_DRAFT.note,
      progressLevel: isValidProgressLevel(parsed.progressLevel) ? parsed.progressLevel : null,
      progressNote:
        typeof parsed.progressNote === 'string'
          ? parsed.progressNote
          : DEFAULT_DAILY_ENTRY_DRAFT.progressNote,
      stateLabel: isValidStateLabel(parsed.stateLabel) ? parsed.stateLabel : null,
    }
  } catch {
    return null
  }
}

export function writeDailyEntryDraft(
  userId: string,
  date: string,
  draft: DailyEntryDraft,
  storage?: StorageLike,
) {
  const target = getStorage(storage)
  if (!target) return
  target.setItem(getStorageKey(userId, date), JSON.stringify(draft))
}

export function clearDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike,
) {
  const target = getStorage(storage)
  if (!target) return
  target.removeItem(getStorageKey(userId, date))
}
```

---

### Task 8: §2 — 写 daily-entry-draft 测试

**Files:**
- Create: `src/lib/daily-entry-draft.test.ts`

- [ ] **Step 8.1：检查既有测试 framework**

运行：

```bash
grep -l "import.*\(from '@?jest\|from 'vitest\)" src/lib/*.test.ts
```

确认项目用的是哪个 test runner。**fallback**：读 `package.json` 的 scripts.test 字段。

- [ ] **Step 8.2：写测试**

`src/lib/daily-entry-draft.test.ts`（按 focus-draft.test.ts 风格）：

```ts
import { describe, it, expect, beforeEach } from 'vitest'  // 如项目用 jest 改成 @jest/globals
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  readDailyEntryDraft,
  writeDailyEntryDraft,
  clearDailyEntryDraft,
} from './daily-entry-draft'

function makeStubStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { __data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    __data: data,
    getItem(key) {
      return data[key] ?? null
    },
    setItem(key, value) {
      data[key] = value
    },
    removeItem(key) {
      delete data[key]
    },
  }
}

describe('daily-entry-draft', () => {
  let storage: ReturnType<typeof makeStubStorage>

  beforeEach(() => {
    storage = makeStubStorage()
  })

  it('returns null when no draft exists', () => {
    expect(readDailyEntryDraft('u1', '2026-05-25', storage)).toBeNull()
  })

  it('writes and reads back the same draft', () => {
    const draft = {
      ...DEFAULT_DAILY_ENTRY_DRAFT,
      note: 'today was rough',
      habitCheckins: 3,
      progressLevel: 'solid' as const,
      stateLabel: 'recovering' as const,
    }
    writeDailyEntryDraft('u1', '2026-05-25', draft, storage)
    expect(readDailyEntryDraft('u1', '2026-05-25', storage)).toEqual(draft)
  })

  it('isolates drafts by date', () => {
    writeDailyEntryDraft('u1', '2026-05-24', { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'd1' }, storage)
    writeDailyEntryDraft('u1', '2026-05-25', { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'd2' }, storage)

    expect(readDailyEntryDraft('u1', '2026-05-24', storage)?.note).toBe('d1')
    expect(readDailyEntryDraft('u1', '2026-05-25', storage)?.note).toBe('d2')
  })

  it('isolates drafts by userId', () => {
    writeDailyEntryDraft('u1', '2026-05-25', { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'u1 note' }, storage)
    writeDailyEntryDraft('u2', '2026-05-25', { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'u2 note' }, storage)

    expect(readDailyEntryDraft('u1', '2026-05-25', storage)?.note).toBe('u1 note')
    expect(readDailyEntryDraft('u2', '2026-05-25', storage)?.note).toBe('u2 note')
  })

  it('clears a draft', () => {
    writeDailyEntryDraft('u1', '2026-05-25', { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'tmp' }, storage)
    clearDailyEntryDraft('u1', '2026-05-25', storage)
    expect(readDailyEntryDraft('u1', '2026-05-25', storage)).toBeNull()
  })

  it('falls back to defaults on corrupted JSON', () => {
    storage.setItem('daily-entry-draft:u1:2026-05-25', '{not valid json')
    expect(readDailyEntryDraft('u1', '2026-05-25', storage)).toBeNull()
  })

  it('falls back to defaults on invalid field types', () => {
    storage.setItem(
      'daily-entry-draft:u1:2026-05-25',
      JSON.stringify({
        dayType: 'weird_type',
        habitCheckins: 'not a number',
        note: 123,
        progressLevel: 'invalid_level',
        stateLabel: 999,
        progressNote: null,
      }),
    )
    const draft = readDailyEntryDraft('u1', '2026-05-25', storage)
    expect(draft).toEqual(DEFAULT_DAILY_ENTRY_DRAFT)
  })
})
```

- [ ] **Step 8.3：跑测试确认通过**

```bash
npx vitest run src/lib/daily-entry-draft.test.ts
```

（如果 jest 项目：`npx jest src/lib/daily-entry-draft.test.ts`）

预期：全部 7 个测试通过。

---

### Task 9: §2 — DailyEntryForm 集成 draft

**Files:**
- Modify: `src/components/analysis/DailyEntryForm.tsx`

- [ ] **Step 9.1：import draft helpers**

在文件顶部 import 区添加：

```ts
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  readDailyEntryDraft,
  writeDailyEntryDraft,
  clearDailyEntryDraft,
} from '@/lib/daily-entry-draft'
```

- [ ] **Step 9.2：加 useEffect 写 draft (debounced 300ms)**

在 `loadFocus` 的 useEffect 之后（约 line 121 附近）加一个新 useEffect：

```tsx
useEffect(() => {
  if (!user) return

  const handle = setTimeout(() => {
    writeDailyEntryDraft(user.id, date, {
      dayType,
      habitCheckins,
      note,
      progressLevel,
      progressNote,
      stateLabel,
    })
  }, 300)

  return () => clearTimeout(handle)
}, [
  user,
  date,
  dayType,
  habitCheckins,
  note,
  progressLevel,
  progressNote,
  stateLabel,
])
```

- [ ] **Step 9.3：loadRecord 完成后 restore draft（覆盖 form state）**

修改 `loadRecord` callback（约 line 65-87）。现状：

```tsx
const loadRecord = useCallback(async () => {
  if (!user) return
  try {
    const record = await getDailyRecord(user.id, date)
    if (record) {
      setDayType(record.day_type)
      setHabitCheckins(record.ibetter_count ?? 0)
      setProgressLevel(record.progress_level ?? null)
      setProgressNote(record.progress_note ?? '')
      setStateLabel(record.state_label ?? null)
      setNote(record.note ?? '')
    } else {
      setDayType('study_day')
      setHabitCheckins(0)
      setProgressLevel(null)
      setProgressNote('')
      setStateLabel(null)
      setNote('')
    }
  } catch {
    // Ignore load errors and keep current local state.
  }
}, [date, user])
```

改成（末尾加 draft restore）：

```tsx
const loadRecord = useCallback(async () => {
  if (!user) return
  try {
    const record = await getDailyRecord(user.id, date)
    if (record) {
      setDayType(record.day_type)
      setHabitCheckins(record.ibetter_count ?? 0)
      setProgressLevel(record.progress_level ?? null)
      setProgressNote(record.progress_note ?? '')
      setStateLabel(record.state_label ?? null)
      setNote(record.note ?? '')
    } else {
      setDayType(DEFAULT_DAILY_ENTRY_DRAFT.dayType)
      setHabitCheckins(DEFAULT_DAILY_ENTRY_DRAFT.habitCheckins)
      setProgressLevel(DEFAULT_DAILY_ENTRY_DRAFT.progressLevel)
      setProgressNote(DEFAULT_DAILY_ENTRY_DRAFT.progressNote)
      setStateLabel(DEFAULT_DAILY_ENTRY_DRAFT.stateLabel)
      setNote(DEFAULT_DAILY_ENTRY_DRAFT.note)
    }

    // Restore draft on top (用户未提交的修改 = 最新意图)
    const draft = readDailyEntryDraft(user.id, date)
    if (draft) {
      setDayType(draft.dayType)
      setHabitCheckins(draft.habitCheckins)
      setProgressLevel(draft.progressLevel)
      setProgressNote(draft.progressNote)
      setStateLabel(draft.stateLabel)
      setNote(draft.note)
    }
  } catch {
    // Ignore load errors and keep current local state.
  }
}, [date, user])
```

- [ ] **Step 9.4：handleSave 成功后清 draft**

`handleSave`（约 line 123-150）末尾，`onSave?.()` 之前加：

```tsx
clearDailyEntryDraft(user.id, date)
```

现状：

```tsx
const handleSave = async () => {
  if (!user) return
  setSaving(true)
  setStatus(null)

  try {
    await upsertDailyRecord(user.id, {
      date,
      day_type: dayType,
      ibetter_count: preferences.enable_habit_checkins ? habitCheckins : 0,
      note,
      focus_in_class: focusIn,
      focus_out_class: focusOut,
      entertainment,
      progress_level: preferences.enable_progress_tracking ? progressLevel : null,
      progress_note: preferences.enable_progress_tracking ? progressNote.trim() || null : null,
      state_label: preferences.enable_state_tracking ? stateLabel : null,
    })

    onSave?.()
    setStatus({ type: 'success', msg: '已保存' })
    setTimeout(() => setStatus(null), 2000)
  } catch {
    setStatus({ type: 'error', msg: '保存失败' })
  } finally {
    setSaving(false)
  }
}
```

改成：

```tsx
const handleSave = async () => {
  if (!user) return
  setSaving(true)
  setStatus(null)

  try {
    await upsertDailyRecord(user.id, {
      date,
      day_type: dayType,
      ibetter_count: preferences.enable_habit_checkins ? habitCheckins : 0,
      note,
      focus_in_class: focusIn,
      focus_out_class: focusOut,
      entertainment,
      progress_level: preferences.enable_progress_tracking ? progressLevel : null,
      progress_note: preferences.enable_progress_tracking ? progressNote.trim() || null : null,
      state_label: preferences.enable_state_tracking ? stateLabel : null,
    })

    clearDailyEntryDraft(user.id, date)
    onSave?.()
    setStatus({ type: 'success', msg: '已保存' })
    setTimeout(() => setStatus(null), 2000)
  } catch {
    setStatus({ type: 'error', msg: '保存失败' })
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 9.5：Commit §2**

```bash
git add src/lib/daily-entry-draft.ts src/lib/daily-entry-draft.test.ts src/components/analysis/DailyEntryForm.tsx
git commit -m "feat(analysis): persist DailyEntryForm as localStorage draft per (userId, date)

- Draft survives refresh / tab close / crash before user hits 保存
- Restored on top of server-loaded record (draft = latest unsaved intent)
- Cleared on successful upsertDailyRecord
- Per-date bucketing handles midnight edge case (write 5/24 draft after 00:00 doesn't overwrite as 5/25)"
```

---

### Task 10: §6 — 横屏专注页面 CSS

**Files:**
- Modify: `src/app/focus/focus.css`

- [ ] **Step 10.1：找到 media query 区域**

文件末尾约 line 619 处有现有 `@media (max-width: 640px)` block 和 line 681 处的 `@media (prefers-reduced-motion: reduce)` block。

新 landscape block 应该插在 `@media (prefers-reduced-motion: reduce)` 之前。

- [ ] **Step 10.2：插入 landscape rules**

在 `@media (prefers-reduced-motion: reduce)` 之前添加：

```css
/* ── Mobile landscape: "desktop clock" mode ── */
/* Typography 主导，orb 退到右下小角作为"回归按钮"，符合横放手机当桌面钟的 use case */
@media (orientation: landscape) and (max-height: 500px) {
  .focus-immersive {
    padding: 16px 24px;
  }

  /* sticky note 升级为画面 typography 主体 */
  .immersive-sticky {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    font-size: 28px;
    line-height: 1.4;
    max-width: 70vw;
    text-align: center;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }

  /* 中央 immersive-content 不再居中放大，让位给 sticky note */
  .immersive-content {
    position: absolute;
    bottom: 24px;
    right: 24px;
    top: auto;
    left: auto;
    transform: none;
    width: auto;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* orb 缩到 ~80px，保持圆形 */
  .return-orb-wrapper {
    transform: scale(0.45);
    transform-origin: bottom right;
  }

  /* 回归次数 capsule 移到左上 */
  .return-count-capsule {
    position: fixed;
    top: 16px;
    left: 16px;
    transform: none;
    font-size: 12px;
    padding: 4px 10px;
  }

  /* AudioPlayer 移到左下角 */
  .immersive-audio,
  .audio-player-wrapper {
    position: fixed;
    bottom: 16px;
    left: 16px;
    top: auto;
    right: auto;
  }

  /* 退出按钮位置不变，但缩小一点 */
  .immersive-exit {
    top: 12px;
    right: 12px;
    font-size: 16px;
  }
}
```

- [ ] **Step 10.3：验证 selectors 命中实际元素**

运行：

```bash
grep -nE "\.(immersive-sticky|immersive-content|return-orb-wrapper|return-count-capsule|immersive-exit|immersive-audio|audio-player-wrapper)" src/app/focus/focus.css src/components/focus/*.tsx
```

预期：每个 selector 至少在 1 个 tsx 文件出现作为 className。

**如果 `immersive-audio` / `audio-player-wrapper` 都不存在**：去 `src/components/focus/AudioPlayer.tsx` 看实际根 className，把上面 landscape block 中的 selector 改成实际值。

- [ ] **Step 10.4：Commit §6**

```bash
git add src/app/focus/focus.css
git commit -m "feat(focus): mobile landscape layout — desktop clock mode

- Typography (sticky note) becomes visual focus
- Orb shrinks to ~80px in bottom-right, remains circular (preserves breathing orb brand language)
- Return count moves to top-left as ambient data
- AudioPlayer moves to bottom-left
- Triggers only on (orientation: landscape) and (max-height: 500px) — handheld landscape only"
```

---

### Phase A 收尾：跑一次 lint / type check

- [ ] **Step A.1：TypeScript 检查**

```bash
npx tsc --noEmit
```

预期：0 errors。

- [ ] **Step A.2：Lint 检查**

```bash
npm run lint
```

预期：0 errors / warnings 在改动过的文件。

- [ ] **Step A.3：跑所有相关测试**

```bash
npx vitest run src/lib/daily-entry-draft.test.ts src/lib/focus-draft.test.ts
```

或 jest 等效命令。预期：全绿。

如有失败：先修，再继续 Phase B。

---

## Phase B — 待用户醒来确认 priority

这三项是 spec §7 / §5 / §4 的实施 plan，**不在自动执行清单内**。用户醒来后确认执行优先级与是否拆分独立 PR。

每项概要：

### §7 Focus Timer（约 6-8 小时）
- 新建 `src/lib/focus-timer.ts` + test
- 新建 `src/lib/motion-detector.ts` + test
- 修改 `src/app/focus/page.tsx`：`focus_state` sessionStorage → localStorage + 8h invalidation
- 修改 `FocusDefaultState.tsx`：iOS motion permission 请求
- 修改 `FocusImmersiveState.tsx`：startFocusTimer + initMotion
- 修改 `ReturnButton.tsx`：hover / pickup-putdown 触发时间数字浮层
- 修改 `SessionEndPanel.tsx`：mount 时 consume timer → 自动 addFocusSession → 直接 confirmation
- 加 `getLastFocusCategory` helper
- 加 user preferences 字段 `enable_focus_timer` / `enable_motion_detection`
- Settings 页面加 toggle UI
- DB schema migration

### §5 Heatmap Redo（约 4-6 小时）
- 新建 `src/lib/analysis/heatmap/build-heatmap.ts` + test
- 新建 `src/lib/analysis/heatmap/quantile.ts` + test
- 新建 `src/lib/analysis/heatmap/dimensions.ts` + test
- 重做 `src/components/analysis/GrowthHeatmap.tsx`：chip 切换 + Quantile 色阶 + 月份标签 + tooltip
- 修改 `src/app/analysis/page.tsx`：dimension state
- 删除 `growth-metrics.ts:182-209` 的 `buildHeatmapData`，引用换新入口

### §4 Echo Refactor（约 6-10 小时，含 voice library 文案打磨）
- 新建 `src/lib/analysis/echo/` 目录 + 7-8 个文件（index / types / 4 generators / curator / voice-library）
- 每个 generator + curator 单测
- 重做 `src/components/analysis/GrowthEchoCard.tsx`：narrative 段为主 + chip 行
- 修改 `src/app/analysis/page.tsx`：调新入口
- 删除 `growth-metrics.ts` 中老 `buildGrowthEcho`，引用换新入口
- **Voice library 文案打磨**（约 80-150 句温和陪伴 tone 模板）—— 这是产品打磨成本，需要专门时间

---

## Self-Review Notes

**Spec coverage：**
- §1 → Task 1 ✓
- §3 → Task 2-6 ✓
- §2 → Task 7-9 ✓
- §6 → Task 10 ✓
- §7 / §5 / §4 → 概要列在 Phase B，详细 plan 等用户醒后确认 priority 后再展开

**Placeholder scan：** 无 TBD / TODO / "implement later"。Phase B 的概要是 high-level outline，明确标注 "详细 plan 待确认"，不属于 plan 文档内 placeholder。

**Type consistency：**
- `Message` 类型贯穿 §3 改动（messages.ts → MessageList → ChatInput）
- `DailyEntryDraft` 类型在 Task 7 定义，Task 9 中 form state 字段名一一对应（dayType / habitCheckins / note / progressLevel / progressNote / stateLabel）
- CSS selector 在 Task 10.3 设置了 grep 验证步骤，万一命中失败有 fallback 说明

**Risks / 备注：**
- Task 8.1 需要确认项目用 jest 还是 vitest（一些 import 写法不同）—— 已加 fallback 检查
- Task 10.3 需验证 AudioPlayer 的实际 className —— 已加 fallback 说明
- Phase A 整体约 2-3 小时工作量

---

## 执行说明

按 spec C6 顺序：Task 1 → 2-6 → 7-9 → 10 → 收尾。

每个 Task 完成后立即 commit，避免 work-in-progress 状态。

如任何 Task 失败：停下、报错、不继续。
