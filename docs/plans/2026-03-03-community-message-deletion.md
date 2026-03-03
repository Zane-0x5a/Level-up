# 社群消息删除功能实施计划

**创建时间**: 2026-03-03
**功能**: 用户撤回3分钟内消息 + 管理员删除任意消息

---

## 需求概述

### 功能1: 用户撤回消息
- 用户可删除自己发送的消息
- 时间限制: 发送后3分钟内
- 适用于所有消息类型（文本、图片、打卡卡片）

### 功能2: 管理员删除消息
- 管理员（`is_admin=true`）可删除任何消息
- 无时间限制
- 适用于所有频道（管理员本就是唯一能创建频道的角色）

### 技术要求
- **删除方式**: 硬删除（从数据库永久移除）
- **图片清理**: 删除图片消息时同时删除 Storage 中的文件
- **确认机制**: 显示确认对话框
- **实时更新**: 所有用户立即看到删除效果

---

## 架构设计

### 数据库
无需修改 schema，使用现有 `messages` 表的 DELETE 操作。

### API 层
**文件**: `src/lib/api/messages.ts`

新增函数:
```typescript
export async function deleteMessage(
  messageId: string,
  userId: string,
  isAdmin: boolean
): Promise<void>
```

**逻辑流程**:
1. 查询消息记录（获取 user_id, created_at, image_url）
2. 权限验证
3. 如果是图片消息，从 Storage 删除文件
4. 删除数据库记录

### 实时订阅
扩展现有订阅，监听 DELETE 事件:
```typescript
.on('postgres_changes', { event: 'DELETE', ... }, onMessageDeleted)
```

---

## UI/UX 设计

### 删除按钮
**位置**: MessageItem 组件，回复按钮旁边
**显示条件**:
- 自己的消息 && 3分钟内 → 显示
- 管理员 → 对所有消息显示

**样式**:
- 桌面端: hover 时显示
- 移动端: 始终显示
- 图标: 垃圾桶 🗑️

### 确认对话框
**新组件**: `DeleteConfirmDialog.tsx`

内容:
- 标题: "删除消息"
- 提示: "确定要删除这条消息吗？此操作无法撤销。"
- 按钮: "取消" | "删除"（红色）

### 反馈
- 删除中: 按钮显示 loading 状态
- 成功: Toast 提示 "消息已删除"
- 失败: Toast 显示错误信息

---

## 实施任务

### Phase 1: API 层（30分钟）

#### Task 1.1: 添加 deleteMessage 函数
**文件**: `src/lib/api/messages.ts`

```typescript
export async function deleteMessage(
  messageId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> {
  // 1. 获取消息
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('user_id, created_at, image_url, message_type')
    .eq('id', messageId)
    .single()

  if (fetchError) throw new Error('消息不存在')

  // 2. 权限检查
  const isOwner = message.user_id === userId
  if (!isAdmin && !isOwner) {
    throw new Error('您没有权限删除此消息')
  }

  if (!isAdmin && isOwner) {
    const elapsed = (Date.now() - new Date(message.created_at).getTime()) / 1000 / 60
    if (elapsed > 3) {
      throw new Error('消息发送超过3分钟，无法撤回')
    }
  }

  // 3. 删除图片文件（如果有）
  if (message.message_type === 'image' && message.image_url) {
    const path = message.image_url.split('/chat-images/')[1]
    if (path) {
      await supabase.storage.from('chat-images').remove([path])
    }
  }

  // 4. 删除消息记录
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (deleteError) throw deleteError
}
```

**验收**:
- [ ] 函数正确导出
- [ ] 权限逻辑正确（管理员 + 3分钟规则）
- [ ] 图片文件删除逻辑正确
- [ ] 错误处理完善

---

### Phase 2: 确认对话框组件（20分钟）

#### Task 2.1: 创建 DeleteConfirmDialog
**文件**: `src/components/community/DeleteConfirmDialog.tsx`

```typescript
'use client'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteConfirmDialog({ onConfirm, onCancel, loading }: Props) {
  return (
    <div className="delete-dialog-overlay" onClick={onCancel}>
      <div className="delete-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="delete-dialog-title">删除消息</h3>
        <p className="delete-dialog-text">确定要删除这条消息吗？此操作无法撤销。</p>
        <div className="delete-dialog-actions">
          <button className="delete-dialog-cancel" onClick={onCancel} disabled={loading}>
            取消
          </button>
          <button className="delete-dialog-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**验收**:
- [ ] 对话框居中显示
- [ ] 点击遮罩层关闭
- [ ] loading 状态正确显示
- [ ] 按钮样式符合设计系统

---

### Phase 3: CSS 样式（15分钟）

#### Task 3.1: 添加删除相关样式
**文件**: `src/app/community/community.css`

在文件末尾添加:

```css
/* ── Delete Button ── */
.msg-delete-btn {
  opacity: 0;
  border: none;
  background: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-3);
  cursor: pointer;
  padding: 2px 6px;
  margin-top: 2px;
  margin-left: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.msg-item:hover .msg-delete-btn {
  opacity: 1;
}

.msg-delete-btn:hover {
  color: var(--color-rose);
  background: var(--color-rose-soft);
}

/* ── Delete Confirmation Dialog ── */
.delete-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(2px);
}

.delete-dialog {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24px;
  max-width: 360px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  animation: dialogSlideIn 0.25s var(--ease-spring);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.delete-dialog-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.delete-dialog-text {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-2);
  margin-bottom: 20px;
}

.delete-dialog-actions {
  display: flex;
  gap: 10px;
}

.delete-dialog-cancel,
.delete-dialog-confirm {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.delete-dialog-cancel {
  background: var(--color-bg-sub);
  color: var(--color-text-2);
}

.delete-dialog-cancel:hover:not(:disabled) {
  background: rgba(43, 45, 66, 0.08);
}

.delete-dialog-confirm {
  background: var(--color-rose);
  color: #fff;
}

.delete-dialog-confirm:hover:not(:disabled) {
  background: #c53030;
  transform: translateY(-1px);
}

.delete-dialog-cancel:disabled,
.delete-dialog-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile: always show delete button */
@media (max-width: 640px) {
  .msg-delete-btn {
    opacity: 1;
  }
}
```

**验收**:
- [ ] 删除按钮样式正确
- [ ] 对话框动画流畅
- [ ] 响应式适配正确

---

### Phase 4: MessageItem 组件集成（30分钟）

#### Task 4.1: 添加删除功能到 MessageItem
**文件**: `src/components/community/MessageItem.tsx`

修改组件:

```typescript
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
  onDelete?: (messageId: string) => void
}

export default function MessageItem({
  message, profile, isOwn, isAdmin, replyMessage, replyProfile,
  onReply, onImageClick, onDelete
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const nickname = profile?.nickname ?? '未知用户'
  const initial = nickname[0]?.toUpperCase() ?? '?'

  // 计算是否可删除
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

          <div style={{ display: 'flex', gap: '4px' }}>
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

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return isToday ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}
```

**验收**:
- [ ] 删除按钮正确显示
- [ ] 权限判断正确
- [ ] 确认对话框正常工作
- [ ] 删除操作正确触发

---

### Phase 5: MessageList 集成（30分钟）

#### Task 5.1: 处理删除事件和实时更新
**文件**: `src/components/community/MessageList.tsx`

修改组件添加删除逻辑:

```typescript
// 在 imports 中添加
import { deleteMessage } from '@/lib/api/messages'

// 在 Props 接口中添加
interface Props {
  channelId: string
  userId: string
  isAdmin: boolean  // 新增
  profilesMap: Record<string, UserProfile>
  onReply?: (message: Message) => void
}

// 修改组件函数签名
export default function MessageList({ channelId, userId, isAdmin, profilesMap, onReply }: Props) {
  // ... 现有状态 ...

  // 添加删除处理函数
  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId, userId, isAdmin)
    // 乐观更新 UI
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  // 修改实时订阅，添加 DELETE 事件监听
  useEffect(() => {
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        if (isNearBottom.current) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        const deletedId = payload.old.id
        setMessages(prev => prev.filter(m => m.id !== deletedId))
      })
      .subscribe()

    realtimeRef.current = channel

    return () => {
      if (realtimeRef.current) {
        unsubscribeFromChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [channelId])

  // 在 MessageItem 渲染中添加 props
  return (
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {/* ... 现有代码 ... */}
      {messages.map(msg => {
        const replied = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : undefined
        return (
          <MessageItem
            key={msg.id}
            message={msg}
            profile={profilesMap[msg.user_id]}
            isOwn={msg.user_id === userId}
            isAdmin={isAdmin}  // 新增
            replyMessage={replied}
            replyProfile={replied ? profilesMap[replied.user_id] : undefined}
            onReply={onReply}
            onImageClick={setPreviewImage}
            onDelete={handleDelete}  // 新增
          />
        )
      })}
      {/* ... 现有代码 ... */}
    </div>
  )
}
```

**验收**:
- [ ] DELETE 事件正确监听
- [ ] 删除后 UI 立即更新
- [ ] 其他用户实时看到删除效果
- [ ] isAdmin prop 正确传递

---

### Phase 6: 页面层集成（10分钟）

#### Task 6.1: 传递 isAdmin 到 MessageList
**文件**: `src/app/community/page.tsx`

修改 MessageList 调用:

```typescript
<MessageList
  channelId={activeChannelId}
  userId={user.id}
  isAdmin={profile?.is_admin ?? false}  // 添加这一行
  profilesMap={profilesMap}
  onReply={setReplyTo}
/>
```

**验收**:
- [ ] isAdmin 正确传递
- [ ] 管理员看到所有消息的删除按钮
- [ ] 普通用户只看到自己3分钟内消息的删除按钮

---

## 测试清单

### 功能测试
- [ ] 用户可删除自己3分钟内的消息
- [ ] 用户无法删除超过3分钟的消息
- [ ] 管理员可删除任意消息
- [ ] 非管理员无法删除他人消息
- [ ] 图片消息删除后文件也被删除
- [ ] 打卡卡片消息可正常删除
- [ ] 确认对话框正常显示和关闭

### 实时测试
- [ ] 删除消息后，其他用户立即看到更新
- [ ] 多个用户同时在线时删除正常工作
- [ ] 删除后回复链正常处理（显示原消息已删除）

### UI 测试
- [ ] 删除按钮在桌面端 hover 显示
- [ ] 删除按钮在移动端始终显示
- [ ] 确认对话框居中且样式正确
- [ ] Loading 状态正确显示
- [ ] 错误提示正确显示

### 边界情况
- [ ] 消息已被删除时再次删除的处理
- [ ] 网络错误时的错误处理
- [ ] Storage 文件不存在时的处理
- [ ] 并发删除的处理

---

## 预计时间

| 阶段 | 任务 | 时间 |
|------|------|------|
| Phase 1 | API 层 | 30分钟 |
| Phase 2 | 确认对话框 | 20分钟 |
| Phase 3 | CSS 样式 | 15分钟 |
| Phase 4 | MessageItem 集成 | 30分钟 |
| Phase 5 | MessageList 集成 | 30分钟 |
| Phase 6 | 页面层集成 | 10分钟 |
| 测试 | 功能测试 | 20分钟 |

**总计**: 约 2.5 小时

---

## 注意事项

1. **数据清理**: 提交 PR 前删除测试消息数据
2. **错误处理**: 所有 API 调用都要有 try-catch
3. **权限验证**: 前端和后端都要验证权限（前端控制 UI，后端保证安全）
4. **图片删除**: Storage 删除失败不应阻止消息删除
5. **实时更新**: 确保 DELETE 事件正确触发和处理

---

**计划创建**: 2026-03-03
**预计完成**: 2026-03-03
