# 社群聊天模块 Design

Date: 2026-03-03

## 背景

Level Up 采用"服主独立部署 + 邀请码注册"模式，每个实例是一个熟人小团体。为发展社交属性，新增社群聊天模块，成员可以发消息、配图、一键打卡分享今日数据。

## 决策摘要

| 维度 | 决策 |
|------|------|
| 导航入口 | 首页卡片入口，不占底栏 Tab |
| 消息类型 | 纯文本、图片、打卡分享、回复/引用 |
| 实时方案 | Supabase Realtime (Postgres Changes CDC) |
| 群组模型 | 多频道（类 Discord channels） |
| 频道管理 | 仅 admin（服主）可创建/删除频道 |
| 用户身份 | 自定义昵称（新增 user_profiles 表） |
| 图片存储 | Supabase Storage `chat-images` bucket |

## 1. 数据库架构

### 1.1 user_profiles 表

```sql
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

-- 所有已登录用户可读
create policy "authenticated users can read profiles"
  on user_profiles for select
  to authenticated
  using (true);

-- 仅本人可插入自己的 profile
create policy "users can insert own profile"
  on user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 仅本人可更新自己的 profile
create policy "users can update own profile"
  on user_profiles for update
  to authenticated
  using (auth.uid() = user_id);
```

服主在 Supabase Dashboard 中手动将自己的 `is_admin` 设为 `true`。

### 1.2 channels 表

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

-- 所有已登录用户可读
create policy "authenticated users can read channels"
  on channels for select
  to authenticated
  using (true);

-- 仅 admin 可创建频道
create policy "admins can create channels"
  on channels for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles
      where user_id = auth.uid() and is_admin = true
    )
  );

-- 仅 admin 可删除频道
create policy "admins can delete channels"
  on channels for delete
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where user_id = auth.uid() and is_admin = true
    )
  );

-- 仅 admin 可更新频道
create policy "admins can update channels"
  on channels for update
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where user_id = auth.uid() and is_admin = true
    )
  );
```

### 1.3 messages 表

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text,
  message_type text default 'text' not null,  -- 'text' | 'image' | 'checkin'
  image_url text,
  checkin_data jsonb,
  reply_to uuid references messages(id) on delete set null,
  created_at timestamptz default now()
);

-- 索引：按频道+时间查询
create index idx_messages_channel_created on messages(channel_id, created_at desc);

alter table messages enable row level security;

-- 所有已登录用户可读
create policy "authenticated users can read messages"
  on messages for select
  to authenticated
  using (true);

-- 已登录用户可发消息（user_id 必须是自己）
create policy "users can insert own messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 仅本人可删除自己的消息
create policy "users can delete own messages"
  on messages for delete
  to authenticated
  using (auth.uid() = user_id);
```

### 1.4 Supabase Realtime 配置

在 Supabase Dashboard 中为 `messages` 表开启 Realtime（Database → Replication → 勾选 messages 表的 INSERT）。

### 1.5 Storage bucket

新建 `chat-images` bucket（public），RLS 策略：

```sql
-- 认证用户可上传到自己的文件夹
create policy "authenticated users can upload chat images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 所有认证用户可读取
create policy "authenticated users can read chat images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-images');
```

## 2. 实时消息架构

### 2.1 Realtime 订阅

进入频道后，客户端订阅该频道的新消息：

```ts
const channel = supabase
  .channel(`channel-${channelId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`
    },
    (payload) => {
      appendMessage(payload.new)
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime connected')
    }
  })

// 清理
await supabase.removeChannel(channel)
```

### 2.2 消息加载策略

1. **初始加载**：最近 50 条（`created_at desc`，反转后正序展示）
2. **联表查询**：消息需 join `user_profiles` 获取昵称；或首次加载时批量拉取所有 profiles 缓存到本地 Map
3. **向上滚动加载**：触顶时以最早消息的 `created_at` 为游标加载更早的 50 条
4. **Realtime 新消息**：`payload.new` 只含 message 行，从本地 profiles cache 补全昵称
5. **切换频道**：`removeChannel` → 重新加载 + 订阅

### 2.3 打卡分享

点击"打卡"按钮：
1. 调用 `getDailyRecord(userId, today)` 获取今日记录
2. 查询 `focus_sessions` 获取今日专注时长
3. 组装 `checkin_data`：`{ day_type, focus_minutes, note_snippet, ... }`
4. 插入消息 `message_type: 'checkin'`
5. 聊天中渲染为带样式的数据卡片

### 2.4 图片上传

```ts
const filePath = `${userId}/${Date.now()}-${sanitizedFileName}`
await supabase.storage.from('chat-images').upload(filePath, file, {
  contentType: file.type,
})
const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath)

await supabase.from('messages').insert({
  channel_id: channelId,
  user_id: userId,
  message_type: 'image',
  image_url: data.publicUrl,
})
```

## 3. 页面结构

### 3.1 入口：首页卡片

在首页 `home-row2` 下方新增一行，放置社群入口卡片。点击跳转到 `/community`。

### 3.2 社群页 `/community`

**桌面布局 (>900px)**：
- 左侧：频道列表侧边栏（宽 220px），admin 可见"新建频道"按钮
- 右侧：消息流 + 底部输入区

**移动布局 (<900px)**：
- 顶部：频道切换横向 tabs（可滚动）
- 下方：消息流 + 底部输入区

### 3.3 消息渲染

- **文本消息**：昵称 + 时间 + 文本内容
- **图片消息**：昵称 + 时间 + 缩略图（点击可放大）
- **打卡消息**：昵称 + 时间 + 数据卡片（带样式的专注时长等数据展示）
- **引用消息**：顶部显示被引用消息的摘要（灰色区块），下方是回复内容

### 3.4 输入区

- 文本输入框（支持 Enter 发送，Shift+Enter 换行）
- 图片上传按钮
- 打卡按钮
- 回复模式：选中某条消息回复时，输入区上方显示"回复 xxx"的提示条，可取消

### 3.5 昵称设置

- 首次进入社群页时，检查 `user_profiles` 是否存在
- 不存在则弹出昵称设置弹窗（必填昵称，可选头像）
- 设置完成后才能进入聊天
- 后续可在设置页修改昵称

## 4. 新增文件清单

```
src/app/community/          -- 社群页面
  page.tsx                  -- 主页面
  community.css             -- 样式

src/components/community/   -- 社群组件
  ChannelList.tsx           -- 频道列表
  MessageList.tsx           -- 消息流
  MessageItem.tsx           -- 单条消息
  ChatInput.tsx             -- 输入区
  CheckinCard.tsx           -- 打卡数据卡片
  NicknameModal.tsx         -- 昵称设置弹窗
  ImagePreview.tsx          -- 图片预览弹窗

src/lib/api/
  channels.ts              -- 频道 CRUD
  messages.ts              -- 消息 CRUD + Realtime 订阅
  user-profiles.ts         -- 用户资料 CRUD

src/components/home/
  CommunityCard.tsx         -- 首页社群入口卡片
```

## 5. 实施顺序

1. 数据库迁移：建表 + RLS + Storage bucket + Realtime 开启
2. API 层：channels.ts, messages.ts, user-profiles.ts
3. 昵称系统：user_profiles + NicknameModal + 设置页集成
4. 频道功能：频道列表 + 频道管理（admin）
5. 消息功能：消息流 + 实时订阅 + 文本发送
6. 图片消息：上传 + 展示 + 预览
7. 打卡分享：数据采集 + 卡片渲染
8. 回复/引用：UI + 数据关联
9. 首页入口卡片
10. 响应式适配

**注意**：前端 UI 设计和施工阶段需使用 frontend-design skill。
