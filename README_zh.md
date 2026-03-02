[English](README.md) | [中文](README_zh.md)

# Level Up

个人成长仪表盘。
不是新的效率系统——是我已在用的工具之间的连接层。

我用 iBetter 记录每日意图，iHour 统计时间投入，flomo 写笔记。这些工具各做一件事，都做得不错。Level Up 不替代它们，而是把数据汇聚到一起，提供一个专注工作的沉浸环境，让规律随着时间显现出来。

## 功能

**首页** — 倒计时、今日专注数据（按分类）、随机浮现的便签提醒。

**专注模式** — 全屏沉浸环境，背景是自己上传的照片。中心是一个回归按钮。

**分析** — 每日录入表单、分类专注时长、周趋势图、历史记录抽屉。

**设置** — 背景图、音频片段、Flomo Webhook、主页问候语。

## 关于回归按钮

大多数专注应用衡量产出。回归按钮衡量的是另一件事。

当你发现自己走神、然后按下它，计数加一。目标不是零次——重点是察觉这个动作本身。一次有十五次回归的专注，意味着你发现了十五次分心并选择回来。这才是注意力训练实际的样子。

## 设计过程

确定最终方案之前，经历了十个视觉方向。

淘汰的方案：墨岩（深色东方风格，可读性差）、晨光（温暖但平淡）、星图（科技感但有借鉴痕迹）、虚空和星云（深色模式备选，暂存）、液态玻璃（iOS 26 风格，太跟当下潮流）、光谱（色彩编码仪表盘风格）、流明（清新，但紫色系太像 2023 年以来的 AI 产品标配）。

进入最终轮的有两个。Atelier，瑞士编辑风格，倒计时悬停动效令人眼前一亮。Porcelain，侘寂美学，赤陶色和鼠尾草绿的配色系统有真正的高级感。最终设计从两者各取所需——暖白底色，朱红和珊瑚色调，鼠尾草绿，蜂蜜黄。没有紫色。这套设计系统叫 L-Drift。

## 用 Claude Code 开发

整个项目用了四天，从空白的 Next.js 仓库到上线。

**2 月 27 日** — 系统设计文档、Supabase schema、项目初始化。

**2 月 28 日** — 十个设计方案并行探索，每个都是独立的 HTML 文件。反馈轮：紫色被淘汰（太像通用 AI 审美），保留 Atelier 和 Porcelain 的暖色编辑风格。

**3 月 1 日** — 用 L-Drift 设计系统完整重建。专注模式四状态机（默认 → 过渡 → 沉浸 → 结束）。分析页和设置页。首次 Vercel 部署。

**3 月 2 日** — 三个断点的移动端适配（640px、768px、900px）。Bug 修复：便签排序 int4 溢出（Date.now() 毫秒数超过 PostgreSQL int4 上限约 21 亿）、Storage bucket 名称不匹配、首页今日概览从错误数据源读取数据。

设计决策不是 AI 输出，而是通过迭代评估出来的。十个 HTML 原型是用来产生反应的，不是直接接受的。最终形成的东西，来自反复的反馈：什么看起来太保守，什么有借鉴痕迹，什么是在跟风。

## 技术栈

| | |
|---|---|
| 框架 | Next.js 14 App Router |
| 样式 | 原生 CSS，L-Drift 设计系统 |
| 数据库 | Supabase（PostgreSQL + Storage）|
| 图表 | Recharts |
| 部署 | Vercel |
| 字体 | Sora · Lexend · DM Mono |

## 自部署

Fork 仓库，配置 Supabase，部署到 Vercel。

**Supabase：**

1. 创建表：`daily_records`、`sticky_notes`、`focus_sessions`、`focus_images`、`audio_clips`
2. 关闭所有表的 RLS（单用户配置）
3. 创建两个 Public Storage bucket：`focus-images` 和 `audio-clips`

**环境变量：**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEFAULT_USER_ID=
```

在 Vercel 的环境变量设置里填入。`DEFAULT_USER_ID` 是任意 UUID，在所有 Supabase 记录中保持一致即可。

## License

MIT
