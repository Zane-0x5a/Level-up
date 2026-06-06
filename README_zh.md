[English](README.md) | [中文](README_zh.md)

# Level Up

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3FCF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

个人成长仪表盘。
不是新的效率系统——是我已在用的工具之间的连接层。

我用轻量的习惯打卡系统记录每日意图，iHour 统计时间投入，flomo 写笔记。这些工具各做一件事，都做得不错。Level Up 不替代它们，而是把数据汇聚到一起，提供一个专注工作的沉浸环境，让分散的努力随时间显现、累积成看得见的东西。

> 全程用 Claude Code 开发，跨度约三个月——从空白的 Next.js 仓库，到一个带实时聊天、运动感知专注计时器、成长反馈分析引擎的多用户平台。

## 界面截图

| 首页 | 专注 |
|---|---|
| ![首页](docs/screenshots/home.png) | ![专注](docs/screenshots/focus.png) |
| **分析** | **社群** |
| ![分析](docs/screenshots/analysis.png) | ![社群](docs/screenshots/community.png) |

## 功能

**首页** — 朝着目标日期的倒计时。今日专注数据按分类拆分。便签随机浮现，避免被埋没。

**专注模式** — 全屏沉浸环境，背景是自己上传的照片，配环境音。中心是一个回归按钮。计时器记录会话；在手机上，加速度计会感知设备的拿起/放下，让时长反映真实专注时间。退出时会话自动落库，草稿在中断后仍可恢复，横屏「桌面时钟」布局适配手机立架使用。

**分析** — 一个成长反馈界面，不是被动的报表：
- **今日成长回声** — 用一个小型四生成器 pipeline（快照 · 模式 · 定位 · 语气）加一个 curator 挑出值得说的话，对你这一天给出自然语言解读。
- **成长热力图** — 90 天、6 维度网格，按分位数计算强度。
- **成长曲线** — 有效投入随时间变化，娱乐时间作为柔和的对比层，而不是混进主线。
- 每日录入表单按 (用户, 日期) 持久化为草稿，分类专注饼图、趋势图，以及带笔记的历史抽屉。

**社群** — 多频道聊天，成员是你邀请的人。文字、图片、回复引用。打卡按钮把今日数据发成卡片。Supabase 实时同步，频道由管理员管理。

**设置** — 背景图、音频片段、Flomo Webhook、主页问候语、社群昵称，以及可选高级追踪字段的开关。

## 关于回归按钮

大多数专注应用衡量产出。回归按钮衡量的是另一件事。

当你发现自己走神、然后按下它，计数加一。目标不是零次——重点是察觉这个动作本身。一次有十五次回归的专注，意味着你发现了十五次分心并选择回来。这才是注意力训练实际的样子。分析里没有任何地方把更高的回归次数当成「更差」。

## 设计过程

确定最终方案之前，经历了十个视觉方向。

淘汰的方案：墨岩（深色东方风格，可读性差）、晨光（温暖但平淡）、星图（科技感但有借鉴痕迹）、虚空和星云（深色模式备选，暂存）、液态玻璃（iOS 26 风格，太跟当下潮流）、光谱（色彩编码仪表盘风格）、流明（清新，但紫色系太像 2023 年以来的 AI 产品标配）。

进入最终轮的有两个。Atelier，瑞士编辑风格，倒计时悬停动效令人眼前一亮。Porcelain，侘寂美学，赤陶色和鼠尾草绿的配色系统有真正的高级感。最终设计从两者各取所需——暖白底色，朱红和珊瑚色调，鼠尾草绿，蜂蜜黄。没有紫色。这套设计系统叫 L-Drift。

## 用 Claude Code 开发

项目以一个六天冲刺起步——从空白的 Next.js 仓库到部署上线的多用户平台——之后在接下来的几个月里持续演进。

**第一周**
- **2 月 27 日** — 系统设计文档、Supabase schema、项目初始化。
- **2 月 28 日** — 十个设计方案并行探索，每个都是独立 HTML 文件。反馈轮：紫色被淘汰（太像通用 AI 审美），保留 Atelier 和 Porcelain 的暖色编辑风格。
- **3 月 1 日** — 用 L-Drift 设计系统完整重建。专注模式四状态机（默认 → 过渡 → 沉浸 → 结束）。分析页和设置页。首次部署。
- **3 月 2 日** — 三个断点的移动端适配。Bug 修复：便签排序 int4 溢出（`Date.now()` 毫秒数超过 PostgreSQL int4 上限）、Storage bucket 名称不匹配、首页今日概览读错数据源。多用户认证、邀请码注册、每张表的行级安全。
- **3 月 3 日** — 社群聊天。三张新表（`user_profiles`、`channels`、`messages`），实时同步、图片上传、回复引用、打卡卡片、首次进入昵称弹窗。

**冲刺之后**
- **成长分析重做** — 把分析页从「仪表盘」重构成「成长反馈系统」：成长回声 pipeline、90 天热力图、成长曲线，背后是一层有单测覆盖的指标计算。
- **专注流程可靠性** — 把专注体验重构到一个统一的状态模型上：计时器、基于加速度计的拿起/放下检测、退出自动落库、可恢复的结束面板草稿、时+分输入、以及预加载的溶解过渡替代生硬的背景切换。
- 持续的 UI 向 L-Drift 语言对齐，以及一套不断增长的单元测试（覆盖分析、草稿、计时器、运动检测逻辑）。

设计决策不是 AI 输出，而是通过迭代评估出来的。十个 HTML 原型是用来产生反应的，不是直接接受的。最终形成的东西，来自反复的反馈：什么看起来太保守，什么有借鉴痕迹，什么是在跟风。

## 技术栈

| | |
|---|---|
| 框架 | Next.js 16 App Router（静态导出）|
| 语言 | TypeScript |
| UI | React 19 |
| 样式 | Tailwind CSS v4 + L-Drift 设计 token 系统 |
| 数据库 | Supabase（PostgreSQL + Storage + Realtime）|
| 认证 | Supabase Auth，邀请码注册 |
| 图表 | Recharts |
| 测试 | `node:test`（`npm test` 运行）|
| 部署 | Cloudflare Pages（静态导出）|
| 字体 | Sora · Lexend · DM Mono |

## 项目结构

```
src/
  app/            Next.js 路由：home, focus, analysis, community, settings, auth
  components/     各界面 UI（home/ focus/ analysis/ community/）
  contexts/       AuthContext, NavContext
  lib/
    analysis/     成长指标、echo pipeline、热力图构建
    api/          Supabase 数据访问，每张表一个模块
    *-timer / *-draft / motion-detector   专注会话逻辑（有单测）
supabase/         migration.sql + 部署指南
docs/plans/       各功能的设计与实现笔记
```

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 运行单元测试
npm run build      # 生产静态导出到 ./out
```

在应用真正可用之前，需要先有一个 Supabase 项目和 `.env.local`（见下文）。

## 自部署

Fork 仓库，配置 Supabase，把静态导出产物部署到 Cloudflare Pages（或任意静态托管）。

**Supabase**

1. 在 SQL Editor 中运行 `supabase/migration.sql`。它会在空项目上创建所有表、全部 RLS 策略和 `register_with_invite()` 函数。脚本是幂等的，可重复运行。
2. 创建三个 public storage bucket：`focus-images`、`audio-clips`、`chat-images`。
3. Authentication → Providers → Email → 关闭 **Confirm email**（注册由邀请码控制）。
4. 为 `messages` 表开启 Realtime（Database → Replication）。
5. 向 `invite_codes` 表插入一个或多个邀请码。

迁移脚本会创建：
- `invite_codes` — 注册控制
- `user_profiles` — 昵称和管理员标记
- `channels`、`messages` — 社群聊天
- `daily_records`、`sticky_notes`、`focus_sessions`、`focus_images`、`audio_clips`、`countdowns`、`user_growth_preferences` — 个人数据

用户只能看到自己的个人数据（由 RLS 强制）。社群表所有登录用户可读；只有管理员能创建或删除频道。

**环境变量**（`.env.local`，以及托管平台的环境变量设置）：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

不需要 `DEFAULT_USER_ID`，认证系统会处理用户身份。

**部署（Cloudflare Pages）**

- 构建命令：`npm run build`
- 输出目录：`out`
- 配置上面两个环境变量

应用以静态导出方式构建（`output: 'export'`），所以能跑在 Cloudflare Pages、GitHub Pages 或任意静态托管上——所有动态状态都在 Supabase 里。

**首个用户**

第一个注册的用户应作为管理员。在 Supabase 控制台把该用户的 `user_profiles.is_admin = true`。管理员可以创建和删除频道。

## License

MIT
