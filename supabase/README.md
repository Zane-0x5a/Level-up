# Level Up 部署指南

## 步骤

1. **Fork 仓库** 到你的 GitHub 账号

2. **创建 Supabase 项目** — 前往 [supabase.com](https://supabase.com) 新建项目

3. **执行数据库迁移** — 在 Supabase Dashboard > SQL Editor 中执行 `migration.sql`

4. **关闭邮箱验证** — Authentication > Providers > Email > 关闭 "Confirm email"

5. **添加邀请码** — Table Editor > `invite_codes` 表中手动插入邀请码记录

6. **部署到 Cloudflare Pages**
   - 连接你的 GitHub 仓库
   - 构建命令：`npm run build`
   - 输出目录：`out`
   - 环境变量：
     - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase 项目 URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key

7. **分发邀请码** 给你的朋友们，即可注册使用
