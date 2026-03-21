# 多用户认证系统 - 实施计划

Date: 2026-03-02
Design: docs/plans/2026-03-02-auth-multiuser-design.md

## 约束

- 静态导出 (`output: 'export'`)：无 middleware、无 server components、无 API routes
- 所有认证逻辑在客户端完成
- 不需要 `@supabase/ssr`，直接用 `@supabase/supabase-js` v2 的 auth 能力

## Task 1: SQL 迁移脚本

**文件**: `supabase/migration.sql`（新建）

内容：
1. 创建 `invite_codes` 表（id, code, used, used_by, used_at, created_at）
2. invite_codes 的 RLS：anon 可查未使用的码
3. 6 张现有表启用 RLS + 4 条策略（select/insert/update/delete）
   - daily_records, countdowns, sticky_notes, audio_clips, focus_images, focus_sessions
4. 修复 daily_records 冲突键：`(date)` → `(user_id, date)`
5. 创建 `register_with_invite` 数据库函数
6. Storage RLS：focus-images 和 audio-clips bucket 按 user_id 隔离

**可并行**: 是（无前端依赖）

## Task 2: AuthContext 基础设施

**文件**:
- `src/contexts/AuthContext.tsx`（新建）
- `src/app/layout.tsx`（修改：包裹 AuthProvider）

AuthContext 提供：
- `user: User | null`
- `loading: boolean`
- `signIn(email, password)`
- `signUp(email, password, inviteCode)`
- `signOut()`

实现要点：
- `onAuthStateChange` 监听 session 变化
- `signUp` 内部：先 `auth.signUp` → 再 `rpc('register_with_invite')` → 失败则删除用户
- 导出 `useAuth()` hook

**可并行**: 与 Task 1 并行

## Task 3: 登录/注册页面

**文件**: `src/app/auth/page.tsx`（新建）

- 登录表单：邮箱 + 密码
- 注册表单：邮箱 + 密码 + 邀请码
- 表单切换（登录 ↔ 注册）
- 沿用 L-Drift 设计系统
- `src/app/auth/auth.css`（新建）

**依赖**: Task 2

## Task 4: API 层改造

**文件**（全部修改）:
- `src/lib/api/daily-records.ts`
- `src/lib/api/sticky-notes.ts`
- `src/lib/api/focus-sessions.ts`
- `src/lib/api/focus-images.ts`
- `src/lib/api/stats.ts`
- `src/lib/api/countdowns.ts`
- `src/lib/api/audio-clips.ts`
- `src/lib/constants.ts`（删除 DEFAULT_USER_ID 或保留为 fallback）

改造模式：
- 每个函数加 `userId: string` 参数
- 替换所有 `DEFAULT_USER_ID` → `userId`
- `upsertDailyRecord` 的 `onConflict` 改为 `'user_id,date'`
- Storage 路径中的 DEFAULT_USER_ID 替换

**依赖**: Task 2（需要 useAuth 提供 userId）
**可与 Task 3 并行**

## Task 5: 组件层接入 auth

**文件**: 所有调用 API 的组件（需逐个排查）

改造模式：
- 组件内 `const { user } = useAuth()`
- API 调用传入 `user.id`
- 未登录时不调用 API

**依赖**: Task 2 + Task 4

## Task 6: 路由保护

**文件**: `src/app/layout.tsx`（修改）

- AuthContext 的 `loading` 状态显示加载画面
- 未登录 → 渲染 auth 页面（客户端重定向或条件渲染）
- 已登录 → 渲染正常应用

**依赖**: Task 2 + Task 3

## Task 7: 部署指南 + .env.example

**文件**:
- `supabase/README.md`（新建）：服主部署步骤
- `.env.example`（新建）：环境变量模板

**可并行**: 与 Task 5/6 并行

## 执行顺序

```
Round 1 (并行): Task 1 (SQL) + Task 2 (AuthContext)
Round 2 (并行): Task 3 (登录页) + Task 4 (API改造)
Round 3 (并行): Task 5 (组件接入) + Task 6 (路由保护) + Task 7 (部署指南)
```
