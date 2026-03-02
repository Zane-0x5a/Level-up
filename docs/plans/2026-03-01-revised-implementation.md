# Level Up 修订实现计划 (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**设计哲学：三页面 × 三时间维度**
- 首页 = **未来**（倒计时、便签、进度概览）
- 专注 = **当下**（双状态沉浸体验、回归按钮、音频、即时时长录入）
- 分析 = **过去**（每日录入/总结、图表、历史回顾）

**已完成 Tasks 1-4：** 项目初始化、Supabase Schema、客户端工具、Liquid Glass 设计规范

**设计体系：** Liquid Glass — 所有组件必须使用 `globals.css` 中的 `glass-1`/`glass-2`/`glass-3` 工具类、`bg-scene` 背景、`--color-*`/`--radius-glass-*`/`--shadow-glass`/`--ease-spring` 设计 token。字体使用 Outfit（非 Inter）。

---

## Task 5: 数据库 Schema 更新

**背景：** 专注时长改为每次专注结束后即时录入，需要新增 `focus_sessions` 表。`daily_records` 中的 `focus_in_class`/`focus_out_class`/`entertainment` 字段保留，作为当日汇总（由 focus_sessions 聚合得出）。

**Files:**
- Modify: `supabase/schema.sql`

**Step 1: 新增 focus_sessions 表**

在 `schema.sql` 末尾追加：

```sql
-- 专注会话（每次专注结束后即时录入）
CREATE TABLE focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('in_class', 'out_class', 'entertainment')),
  duration FLOAT NOT NULL,  -- 单位：小时
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 2: 在 Supabase SQL Editor 中执行新增语句**

用户需手动在 Supabase 控制台执行此 SQL。

**Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add focus_sessions table for per-session time tracking"
```

---

## Task 6: 重写全局布局与导航

**背景：** Task 5 原实现未对齐 Liquid Glass 设计体系。需重写 layout.tsx 和 BottomNav.tsx，使用 Outfit 字体、bg-scene 背景、glass 工具类。

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/BottomNav.tsx`

**Step 1: 更新 layout.tsx**

- 移除 Inter 字体，改用 Google Fonts 引入 Outfit + IBM Plex Mono（通过 `<link>` 或 next/font）
- `<body>` 使用设计体系的颜色变量，不硬编码 `bg-slate-50`
- 添加 `bg-scene` 背景层和 blob 动画元素
- 保留 `pb-24` 为底部导航留空间
- `<html lang="zh">`

**Step 2: 重写 BottomNav.tsx**

- 使用 `glass-2` 工具类替代手写 backdrop-blur
- 激活态颜色使用 `var(--color-accent)` 而非 `text-indigo-500`
- 圆角使用 `var(--radius-glass-sm)`
- 过渡使用 `var(--ease-spring)`
- 移除无效的 `h-safe-area-inset-bottom`，改用 `env(safe-area-inset-bottom)` CSS

**Step 3: 验证**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/BottomNav.tsx
git commit -m "feat: rewrite layout and nav to align with Liquid Glass design system"
```

---

## Task 7: 首页 — 倒计时模块

**Files:**
- Create: `src/lib/api/countdowns.ts`
- Create: `src/components/home/CountdownCard.tsx`
- Create: `src/components/home/CountdownSection.tsx`

**Step 1: 创建倒计时数据操作函数**

`src/lib/api/countdowns.ts` — CRUD 操作：`getCountdowns()`、`addCountdown(label, targetDate)`、`deleteCountdown(id)`。按 target_date 升序排列。

**Step 2: 创建 CountdownCard 组件**

- 使用 `glass-1` 卡片样式
- 显示标签、剩余天数（用 date-fns 的 `differenceInDays`）
- 删除按钮（淡出动效）
- 天数用大号字体突出

**Step 3: 创建 CountdownSection 容器组件**

- 标题 + 卡片列表 + 新增倒计时的入口（glass-3 样式的 "+" 按钮）
- 新增时弹出简洁的 glass 风格输入面板（标签 + 日期）

**Step 4: Commit**

```bash
git add src/lib/api/countdowns.ts src/components/home/
git commit -m "feat: add countdown module with Liquid Glass styling"
```

---

## Task 8: 首页 — 便签提醒模块

**Files:**
- Create: `src/lib/api/sticky-notes.ts`
- Create: `src/components/home/StickyNotes.tsx`

**Step 1: 创建便签数据操作函数**

`src/lib/api/sticky-notes.ts` — `getStickyNotes()`、`addStickyNote(content)`、`deleteStickyNote(id)`。按 order 升序。

**Step 2: 创建 StickyNotes 组件**

- 使用 `glass-2` 容器
- 便签条目用 `glass-3` 子卡片，支持左滑删除或点击 × 删除
- 新增便签的输入框使用 `var(--color-glass-input)` 背景
- 空状态显示柔和的提示文字

**Step 3: Commit**

```bash
git add src/lib/api/sticky-notes.ts src/components/home/StickyNotes.tsx
git commit -m "feat: add sticky notes module"
```

---

## Task 9: 首页 — 进度概览模块

**背景：** 替代原来的"今日概览"，展示面向未来的趋势性数据，强化首页的"未来"时间维度。

**Files:**
- Create: `src/components/home/ProgressOverview.tsx`
- Create: `src/lib/api/stats.ts`

**Step 1: 创建统计数据 API**

`src/lib/api/stats.ts` — 聚合查询函数：
- `getStreak()` — 连续打卡天数（连续有 daily_records 的天数）
- `getTotalFocusHours()` — 累计专注时长（从 focus_sessions 聚合）
- `getWeeklyFocusHours()` — 本周专注时长
- `getTotalReturnCount()` — 累计回归次数

**Step 2: 创建 ProgressOverview 组件**

- `glass-1` 容器
- 2×2 网格布局，每个指标一个 `glass-3` 小卡片
- 数字用大号 Outfit 字体，标签用 `var(--color-text-2)`
- 连续打卡天数可加火焰/闪电等小图标（lucide-react）
- 入场动画使用 `animate-in` + `delay-*` 交错

**Step 3: Commit**

```bash
git add src/lib/api/stats.ts src/components/home/ProgressOverview.tsx
git commit -m "feat: add progress overview module for homepage"
```

---

## Task 10: 组装首页

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 组装首页所有模块**

```typescript
// src/app/page.tsx
import CountdownSection from '@/components/home/CountdownSection'
import StickyNotes from '@/components/home/StickyNotes'
import ProgressOverview from '@/components/home/ProgressOverview'

export default function HomePage() {
  return (
    <main className="relative z-10 p-4 space-y-5 max-w-md mx-auto">
      <ProgressOverview />
      <CountdownSection />
      <StickyNotes />
    </main>
  )
}
```

布局顺序：进度概览（最醒目）→ 倒计时 → 便签。所有模块使用 `animate-in` 交错入场。

**Step 2: 验证**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble homepage with future-oriented modules"
```

---

## Task 11: 专注模式 — 双状态页面

**背景：** 这是本次修订中改动最大的 Task。专注页面分为两个状态，通过"空间转换"隐喻切换。退出专注时弹出手动时长录入面板。

**Files:**
- Create: `src/app/focus/page.tsx`
- Create: `src/components/focus/FocusDefaultState.tsx`
- Create: `src/components/focus/FocusImmersiveState.tsx`
- Create: `src/components/focus/ReturnButton.tsx`
- Create: `src/components/focus/AudioPlayer.tsx`
- Create: `src/components/focus/SessionEndPanel.tsx`
- Create: `src/components/focus/SpaceTransition.tsx`
- Create: `src/lib/api/focus-images.ts`
- Create: `src/lib/api/audio-clips.ts`
- Create: `src/lib/api/focus-sessions.ts`

**Step 1: 创建 focus_sessions API**

`src/lib/api/focus-sessions.ts`:
- `addFocusSession(category, duration)` — 记录一次专注会话
- `getTodayFocusSessions()` — 获取今日所有会话
- `getTodayReturnCount()` — 获取今日回归次数（从 daily_records）
- `incrementReturnCount(date)` — 回归计数 +1

**Step 2: 创建图片和音频 API**

`src/lib/api/focus-images.ts` — `getFocusImages()`、`uploadFocusImage(file)`
`src/lib/api/audio-clips.ts` — `getAudioClips()`、`uploadAudioClip(file, label)`、`deleteAudioClip(id)`

**Step 3: 创建默认状态组件 FocusDefaultState**

素色背景，安静氛围。可包含：
- 柔和的问候语或当前时间
- 今日已完成的专注会话简要统计
- 一个富有叙事感的"入口"元素（非普通按钮）——作为空间转换的起点
  - 设计方向：一扇微微透光的门、一道帷幕的缝隙、或一个发光的门廊
  - 用 CSS 动画让它有"呼吸感"，暗示可以交互

**Step 4: 创建空间转换动效组件 SpaceTransition**

从默认态到沉浸态的过渡动画：
- 门/帷幕打开的动效（CSS transform + opacity 组合）
- 背景从素色渐变为美景图片
- 持续约 800ms-1200ms
- 使用 `var(--ease-spring)` 缓动

**Step 5: 创建沉浸状态组件 FocusImmersiveState**

- 全屏美景背景图（随机从 focus_images 取一张）
- 底部导航栏隐藏（通过 context 或 URL 参数控制）
- ReturnButton — 半透明圆形按钮，点击后 return_count +1，短暂正反馈动画
- AudioPlayer — 浮动音频控制，播放/暂停/切换
- 便签文字浮动显示（从 sticky_notes 取）
- 退出按钮（触发 SessionEndPanel）

**Step 6: 创建 SessionEndPanel 组件**

退出专注时弹出的 glass 面板：
- 选择专注类型：课内投入 / 课外投入 / 娱乐消费
- 输入时长（小时，支持小数如 1.5）
- 确认提交 → 调用 `addFocusSession()` 写入数据库
- 可选跳过（不记录）

**Step 7: 组装专注页面**

```typescript
// src/app/focus/page.tsx — 状态机
// state: 'default' | 'transitioning' | 'immersive' | 'ending'
```

**Step 8: 验证**

```bash
npm run build
```

**Step 9: Commit**

```bash
git add src/app/focus/ src/components/focus/ src/lib/api/focus-sessions.ts src/lib/api/focus-images.ts src/lib/api/audio-clips.ts
git commit -m "feat: add dual-state focus mode with space transition"
```

---

## Task 12: 分析页面 — 每日录入与图表

**背景：** 每日录入从首页移到分析页，契合"过去"的时间维度。专注时长数据现在从 focus_sessions 聚合，不再手动输入。每日录入主要负责：日类型选择、iBetter 打卡数、今日总结文字、发送到 flomo。

**Files:**
- Create: `src/app/analysis/page.tsx`
- Create: `src/components/analysis/DailyEntryForm.tsx`
- Create: `src/components/analysis/FocusTimePieChart.tsx`
- Create: `src/components/analysis/FocusTimeTrendChart.tsx`
- Create: `src/components/analysis/IBetterTrendChart.tsx`
- Create: `src/components/analysis/ReturnCountChart.tsx`
- Create: `src/components/analysis/DayTypeFilter.tsx`
- Create: `src/lib/api/daily-records.ts`
- Create: `src/lib/flomo.ts`

**Step 1: 创建每日记录 API**

`src/lib/api/daily-records.ts`:
- `getDailyRecord(date)` — 获取某天记录
- `upsertDailyRecord(record)` — 插入/更新每日记录（日类型、iBetter数、总结文字）
- `getAllDailyRecords()` — 获取所有记录（倒序）
- 注意：`focus_in_class`/`focus_out_class`/`entertainment` 字段现在由 focus_sessions 聚合填充，不再由用户手动输入

**Step 2: 创建 flomo 发送功能**

`src/lib/flomo.ts` — `sendToFlomo(content, apiUrl)`，API URL 从 localStorage 读取。

**Step 3: 创建每日录入表单 DailyEntryForm**

- `glass-1` 卡片容器
- 日期选择（默认今天）
- 日类型切换：学习日 / 休假日（pill 样式切换按钮）
- iBetter 打卡完成数（数字输入）
- 今日总结文字框（`var(--color-glass-input)` 背景）
- 今日专注时长汇总（只读，从 focus_sessions 自动聚合显示）
- 提交按钮 + 发送到 flomo 按钮

**Step 4: 创建日类型筛选器 DayTypeFilter**

三选一：全部 / 学习日 / 休假日，pill 样式，切换后图表联动。

**Step 5: 创建图表组件**

所有图表使用 Recharts，容器用 `glass-2` 样式：
- `FocusTimePieChart` — 饼图，课内/课外/娱乐三色（使用设计 token 中的 accent/success/amber）
- `FocusTimeTrendChart` — 折线图，X轴日期，Y轴时长
- `IBetterTrendChart` — 折线图，iBetter 打卡趋势
- `ReturnCountChart` — 折线图，回归次数趋势

**Step 6: 组装分析页面**

页面布局（从上到下）：
1. 每日录入表单（折叠式，默认展开当天）
2. 日类型筛选器
3. 图表区域（网格布局）

**Step 7: Commit**

```bash
git add src/app/analysis/ src/components/analysis/ src/lib/api/daily-records.ts src/lib/flomo.ts
git commit -m "feat: add analysis page with daily entry and charts"
```

---

## Task 13: 分析页面 — 历史总结抽屉

**Files:**
- Create: `src/components/analysis/NotesDrawer.tsx`

**Step 1: 创建历史总结抽屉组件**

- `glass-1` 容器，标题"历史总结"
- 卡片列表，每张 `glass-3` 子卡片显示日期 + 日类型标签 + 总结前几十字
- 点击展开/收起完整内容（`line-clamp-2` ↔ 全文）
- 按时间倒序
- 空状态提示

**Step 2: 集成到分析页面**

在图表区域下方添加 NotesDrawer，接收 filtered records。

**Step 3: Commit**

```bash
git add src/components/analysis/NotesDrawer.tsx src/app/analysis/page.tsx
git commit -m "feat: add historical notes drawer in analysis page"
```

---

## Task 14: 设置页面

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: 创建设置页面**

`glass-1` 容器，包含以下设置项：
- flomo API URL 输入框（保存到 localStorage）
- 上传专注模式背景图（调用 `uploadFocusImage`）
- 上传音频片段（含标题，调用 `uploadAudioClip`）
- 管理现有图片和音频（列表展示，可删除）
- 每个设置区块用 `glass-2` 分组

**Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: add settings page for media and flomo config"
```

---

## Task 15: 部署到 Vercel

**Step 1: 推送代码到 GitHub**

```bash
git remote add origin <repo-url>
git push -u origin main
```

**Step 2: 在 Vercel 导入项目**

配置环境变量：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_DEFAULT_USER_ID`

**Step 3: 验证部署**

手机和电脑浏览器均能正常访问。

---

## 修订后开发顺序总结

```
Task 5   数据库 Schema 更新（新增 focus_sessions 表）
Task 6   重写全局布局与导航（对齐 Liquid Glass）
Task 7   首页：倒计时
Task 8   首页：便签提醒
Task 9   首页：进度概览（新增，替代原"今日概览"）
Task 10  组装首页
Task 11  专注模式：双状态 + 空间转换 + 即时时长录入（大改）
Task 12  分析页面：每日录入 + 图表（每日录入从首页移入）
Task 13  分析页面：历史总结抽屉
Task 14  设置页面
Task 15  部署到 Vercel
```

**与原计划的关键差异：**
- 新增 Task 5（Schema 更新）和 Task 9（进度概览）
- Task 11（专注模式）从简单页面变为双状态 + 空间转换动效
- Task 12（分析页面）整合了原来首页的每日录入功能
- 专注时长从"每日统一输入"改为"每次专注后即时录入"
