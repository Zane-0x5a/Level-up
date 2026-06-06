# Level Up — 部署指南

## 步骤

1. **Fork 仓库** 到你的 GitHub 账号。

2. **创建 Supabase 项目** — 前往 [supabase.com](https://supabase.com) 新建项目。

3. **执行数据库迁移** — 在 Supabase Dashboard → SQL Editor 中运行 `migration.sql`。
   它会在空项目上一次性创建所有表、全部 RLS 策略和 `register_with_invite()` 函数；脚本幂等，可重复运行。

4. **创建 Storage bucket** — Dashboard → Storage 新建三个 **public** bucket：
   `focus-images`、`audio-clips`、`chat-images`。

5. **关闭邮箱验证** — Authentication → Providers → Email → 关闭 "Confirm email"（注册由邀请码控制）。

6. **开启 Realtime** — Database → Replication，为 `messages` 表开启实时同步。

7. **添加邀请码** — Table Editor → `invite_codes` 表中手动插入邀请码记录。

8. **部署到 Cloudflare Pages**
   - 连接你的 GitHub 仓库
   - 构建命令：`npm run build`
   - 输出目录：`out`
   - 环境变量：
     - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase 项目 URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key

9. **设置管理员** — 第一个注册的用户应作为服主。
   在 `user_profiles` 表中把该用户的 `is_admin` 设为 `true`，即可创建和删除频道。

10. **分发邀请码** 给你的朋友们，即可注册使用。

> 应用以静态导出方式构建（`output: 'export'`），所以也能部署到 GitHub Pages 或任意静态托管——所有动态状态都在 Supabase 里。
