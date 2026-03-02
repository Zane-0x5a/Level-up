# 多用户认证与邀请码系统 Design

Date: 2026-03-02

## 背景

当前系统使用硬编码 `DEFAULT_USER_ID` 作为唯一用户标识，无认证、无数据隔离。目标是支持"服主独立部署 + 邀请码注册"的多用户模式。

## 决策摘要

- 认证：Supabase Auth，邮箱+密码，不验证邮箱
- 准入：一次性邀请码，注册时核销
- 数据隔离：Supabase RLS，`auth.uid() = user_id`
- 管理：服主通过 Supabase Dashboard 管理邀请码（后续可加管理面板）
- 部署：Cloudflare Pages 静态导出，服主各自独立部署

## 1. 数据库变更

### 1.1 新增 invite_codes 表

```sql
create table invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- 仅允许未登录用户查询未使用的码（注册时校验用）
alter table invite_codes enable row level security;
create policy "anon can check unused codes"
  on invite_codes for select
  to anon
  using (used = false);
```

### 1.2 现有表加 RLS

6 张表统一处理：daily_records, countdowns, sticky_notes, audio_clips, focus_images, focus_sessions

```sql
-- 对每张表执行：
alter table <table> enable row level security;

create policy "users see own data"
  on <table> for select
  using (auth.uid() = user_id);

create policy "users insert own data"
  on <table> for insert
  with check (auth.uid() = user_id);

create policy "users update own data"
  on <table> for update
  using (auth.uid() = user_id);

create policy "users delete own data"
  on <table> for delete
  using (auth.uid() = user_id);
```

### 1.3 修复 upsertDailyRecord 冲突键

```sql
-- 删除旧的 unique constraint on (date)
-- 新增 unique constraint on (user_id, date)
alter table daily_records drop constraint if exists daily_records_date_key;
alter table daily_records add constraint daily_records_user_date_key unique (user_id, date);
```

## 2. 注册流程（含邀请码核销）

需要一个 Supabase Edge Function 或 Database Function 来原子化处理：

```sql
create or replace function register_with_invite(
  invite_code text,
  user_id uuid
) returns boolean as $$
declare
  code_row invite_codes%rowtype;
begin
  select * into code_row
    from invite_codes
    where code = invite_code and used = false
    for update;

  if not found then
    return false;
  end if;

  update invite_codes
    set used = true, used_by = user_id, used_at = now()
    where id = code_row.id;

  return true;
end;
$$ language plpgsql security definer;
```

客户端流程：
1. 先调 `supabase.auth.signUp({ email, password })`
2. 注册成功后调 `supabase.rpc('register_with_invite', { invite_code, user_id })`
3. 返回 false → 删除刚创建的用户，提示邀请码无效
4. 返回 true → 注册完成，进入应用

## 3. 前端改动

### 3.1 Supabase 客户端升级

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

客户端不变，Supabase JS v2 自带 auth 能力。

### 3.2 Auth Context

新增 `src/contexts/AuthContext.tsx`：
- 提供 `user`, `loading`, `signIn`, `signUp`, `signOut`
- 监听 `onAuthStateChange` 维护 session
- 替代 `DEFAULT_USER_ID`，所有 API 调用从 `user.id` 取值

### 3.3 页面路由保护

- 未登录 → 显示登录/注册页
- 已登录 → 显示正常应用
- 静态导出下无 middleware，用客户端 AuthContext 控制渲染

### 3.4 登录/注册 UI

新增 `src/app/auth/page.tsx`：
- 登录表单：邮箱 + 密码
- 注册表单：邮箱 + 密码 + 邀请码
- 两个表单可切换
- 沿用 L-Drift 设计系统

### 3.5 API 层改造

所有 `src/lib/api/*.ts` 文件：
- 移除 `import { DEFAULT_USER_ID }`
- 函数签名加 `userId: string` 参数，或从 auth session 直接获取
- RLS 生效后，查询可以不带 `.eq('user_id', ...)` 过滤（RLS 自动过滤），但 insert 时仍需传 `user_id`

upsertDailyRecord 冲突键改为 `user_id, date`：
```ts
{ onConflict: 'user_id,date' }
```

## 4. 服主部署指南（README 补充）

服主需要：
1. Fork 仓库
2. 创建 Supabase 项目，执行 SQL 迁移脚本
3. 在 Cloudflare Pages 部署，配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 在 Supabase Dashboard 的 invite_codes 表中手动添加邀请码
5. 把邀请码分发给朋友

## 5. 实施顺序

1. **数据库迁移**：建 invite_codes 表、加 RLS、修复冲突键、创建 register_with_invite 函数
2. **AuthContext + 登录注册页**：前端认证基础设施
3. **API 层改造**：移除 DEFAULT_USER_ID，接入 auth session
4. **路由保护**：未登录重定向到 auth 页
5. **部署指南**：编写 SQL 迁移脚本 + README
6. **测试**：多用户场景验证数据隔离
