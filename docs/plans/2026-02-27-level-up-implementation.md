# Level Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建 Level Up 个人成长管理系统，一个基于 Web 的沉浸式个人成长数据中枢。

**Architecture:** Next.js 前端 + Supabase 数据库与文件存储 + Vercel 部署。单用户设计，所有表预留 user_id 字段方便未来扩展多用户。三大核心板块：首页、专注模式、反思与分析。

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Storage), Tailwind CSS, Recharts, Vercel

---

## Task 1: 初始化项目

**Files:**
- Create: `package.json`, `next.config.js`, `.env.local`, `.gitignore`

**Step 1: 创建 Next.js 项目**

```bash
cd "D:/Projects/Level Up"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Step 2: 安装额外依赖**

```bash
npm install @supabase/supabase-js recharts lucide-react
```

**Step 3: 创建 `.env.local` 文件**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEFAULT_USER_ID=00000000-0000-0000-0000-000000000001
```

**Step 4: 验证项目启动**

```bash
npm run dev
```
预期：浏览器打开 http://localhost:3000 看到 Next.js 默认页面

**Step 5: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with Supabase and Tailwind"
```

---

## Task 2: 配置 Supabase 数据库

**Files:**
- Create: `supabase/schema.sql`

**Step 1: 在 Supabase 控制台创建项目**

访问 https://supabase.com，新建项目，记录 URL 和 anon key，填入 `.env.local`。

**Step 2: 创建数据库 Schema 文件**

```sql
-- supabase/schema.sql

-- 每日记录
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  date DATE NOT NULL UNIQUE,
  day_type TEXT NOT NULL CHECK (day_type IN ('study_day', 'rest_day')),
  focus_in_class FLOAT NOT NULL DEFAULT 0,
  focus_out_class FLOAT NOT NULL DEFAULT 0,
  entertainment FLOAT NOT NULL DEFAULT 0,
  ibetter_count INT NOT NULL DEFAULT 0,
  return_count INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 倒计时
CREATE TABLE countdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  label TEXT NOT NULL,
  target_date DATE NOT NULL
);

-- 便签提醒
CREATE TABLE sticky_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  content TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 音频片段
CREATE TABLE audio_clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 专注模式背景图
CREATE TABLE focus_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  file_path TEXT NOT NULL
);
```

**Step 3: 在 Supabase SQL Editor 中执行该 Schema**

复制 `supabase/schema.sql` 内容，粘贴到 Supabase 控制台 → SQL Editor → 执行。

**Step 4: 在 Supabase 控制台创建 Storage Buckets**

- 创建 bucket：`focus-images`（公开读）
- 创建 bucket：`audio-clips`（公开读）

**Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase database schema"
```

---

## Task 3: 创建 Supabase 客户端工具

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/constants.ts`

**Step 1: 创建 Supabase 客户端**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Step 2: 创建常量文件**

```typescript
// src/lib/constants.ts
export const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID!
```

**Step 3: Commit**

```bash
git add src/lib/supabase.ts src/lib/constants.ts
git commit -m "feat: add Supabase client and constants"
```

---

## Task 4: UI 设计规范（前端设计阶段）

> 在开始写页面之前，先用 `superpowers:frontend-design` skill 确定视觉风格。

**Step 1: 调用 frontend-design skill**

在此步骤，调用 `superpowers:frontend-design` skill，确定以下内容：
- 整体配色方案（深色/浅色/沉浸感主题）
- 字体选择
- 三大板块的线框图（首页、专注模式、反思与分析）
- 组件视觉规范（按钮、卡片、图表容器等）

**Step 2: 将设计规范记录到文件**

```bash
# 设计确认后，将配色、字体等规范写入
# src/styles/design-tokens.ts（由 frontend-design skill 输出）
```

**Step 3: 配置 Tailwind 主题**

根据设计规范，修改 `tailwind.config.ts`，加入自定义颜色、字体等。

**Step 4: Commit**

```bash
git add tailwind.config.ts src/styles/
git commit -m "feat: add design tokens and Tailwind theme"
```

---

## Task 5: 全局布局与导航

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/BottomNav.tsx`

**Step 1: 创建底部导航栏组件**

```typescript
// src/components/BottomNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Focus, BarChart2 } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const links = [
    { href: '/', label: '首页', icon: Home },
    { href: '/focus', label: '专注', icon: Focus },
    { href: '/analysis', label: '分析', icon: BarChart2 },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-white border-t py-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={`flex flex-col items-center text-xs gap-1 ${pathname === href ? 'text-blue-600' : 'text-gray-400'}`}>
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

**Step 2: 更新全局布局**

```typescript
// src/app/layout.tsx
import BottomNav from '@/components/BottomNav'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
```

**Step 3: 验证**

```bash
npm run dev
```
预期：页面底部显示三个导航按钮，点击可切换路由。

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/BottomNav.tsx
git commit -m "feat: add global layout and bottom navigation"
```

---

## Task 6: 首页 — 倒计时模块

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/home/CountdownCard.tsx`
- Create: `src/lib/api/countdowns.ts`

**Step 1: 创建倒计时数据操作函数**

```typescript
// src/lib/api/countdowns.ts
import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getCountdowns() {
  const { data, error } = await supabase
    .from('countdowns')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('target_date', { ascending: true })
  if (error) throw error
  return data
}

export async function addCountdown(label: string, targetDate: string) {
  const { error } = await supabase
    .from('countdowns')
    .insert({ label, target_date: targetDate, user_id: DEFAULT_USER_ID })
  if (error) throw error
}

export async function deleteCountdown(id: string) {
  const { error } = await supabase
    .from('countdowns')
    .delete()
    .eq('id', id)
  if (error) throw error
}
```

**Step 2: 创建倒计时卡片组件**

```typescript
// src/components/home/CountdownCard.tsx
'use client'
import { differenceInDays, parseISO } from 'date-fns'

type Props = { id: string; label: string; targetDate: string; onDelete: (id: string) => void }

export default function CountdownCard({ id, label, targetDate, onDelete }: Props) {
  const days = differenceInDays(parseISO(targetDate), new Date())
  return (
    <div className="rounded-xl bg-white shadow p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold">{days}<span className="text-sm ml-1">天</span></p>
      </div>
      <button onClick={() => onDelete(id)} className="text-gray-300 hover:text-red-400">×</button>
    </div>
  )
}
```

**Step 3: 安装 date-fns**

```bash
npm install date-fns
```

**Step 4: Commit**

```bash
git add src/lib/api/countdowns.ts src/components/home/CountdownCard.tsx
git commit -m "feat: add countdown API and card component"
```

---

## Task 7: 首页 — 便签提醒模块

**Files:**
- Create: `src/components/home/StickyNotes.tsx`
- Create: `src/lib/api/sticky-notes.ts`

**Step 1: 创建便签数据操作函数**

```typescript
// src/lib/api/sticky-notes.ts
import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getStickyNotes() {
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('order', { ascending: true })
  if (error) throw error
  return data
}

export async function addStickyNote(content: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .insert({ content, user_id: DEFAULT_USER_ID, order: Date.now() })
  if (error) throw error
}

export async function deleteStickyNote(id: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}
```

**Step 2: Commit**

```bash
git add src/lib/api/sticky-notes.ts src/components/home/StickyNotes.tsx
git commit -m "feat: add sticky notes API and component"
```

---

## Task 8: 首页 — 每日录入表单

**Files:**
- Create: `src/components/home/DailyEntryForm.tsx`
- Create: `src/lib/api/daily-records.ts`

**Step 1: 创建每日记录数据操作函数**

```typescript
// src/lib/api/daily-records.ts
import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getDailyRecord(date: string) {
  const { data } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', date)
    .single()
  return data
}

export async function upsertDailyRecord(record: {
  date: string
  day_type: 'study_day' | 'rest_day'
  focus_in_class: number
  focus_out_class: number
  entertainment: number
  ibetter_count: number
  note: string
}) {
  const { error } = await supabase
    .from('daily_records')
    .upsert({ ...record, user_id: DEFAULT_USER_ID }, { onConflict: 'date' })
  if (error) throw error
}

export async function getAllDailyRecords() {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}
```

**Step 2: 创建每日录入表单组件**

包含以下字段：
- 日期（默认今天）
- 日类型选择（学习日 / 休假日）
- 课内投入、课外投入、娱乐消费（数字输入，单位小时）
- iBetter 打卡完成数
- 今日总结文字框
- 提交按钮
- 发送到 flomo 按钮

**Step 3: 实现 flomo 发送功能**

```typescript
// src/lib/flomo.ts
export async function sendToFlomo(content: string, apiUrl: string) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  if (!res.ok) throw new Error('发送到 flomo 失败')
}
```

用户的 flomo API URL 存储在 localStorage 中（设置页面配置）。

**Step 4: Commit**

```bash
git add src/lib/api/daily-records.ts src/components/home/DailyEntryForm.tsx src/lib/flomo.ts
git commit -m "feat: add daily entry form with flomo integration"
```

---

## Task 9: 组装首页

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 组装首页所有模块**

```typescript
// src/app/page.tsx
import CountdownSection from '@/components/home/CountdownSection'
import StickyNotes from '@/components/home/StickyNotes'
import TodayOverview from '@/components/home/TodayOverview'
import DailyEntryButton from '@/components/home/DailyEntryButton'

export default function HomePage() {
  return (
    <main className="p-4 space-y-4">
      <CountdownSection />
      <StickyNotes />
      <TodayOverview />
      <DailyEntryButton />
    </main>
  )
}
```

**Step 2: 验证首页完整呈现**

```bash
npm run dev
```
预期：首页显示倒计时、便签、今日概览、录入按钮。

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble home page with all modules"
```

---

## Task 10: 专注模式页面

**Files:**
- Create: `src/app/focus/page.tsx`
- Create: `src/components/focus/ReturnButton.tsx`
- Create: `src/components/focus/AudioPlayer.tsx`
- Create: `src/lib/api/focus-images.ts`
- Create: `src/lib/api/audio-clips.ts`

**Step 1: 创建回归按钮组件**

回归按钮点击后：
1. 将今日 `return_count` +1 更新到数据库
2. 显示简短正反馈动画（如按钮短暂变色）

```typescript
// src/components/focus/ReturnButton.tsx
'use client'
import { useState } from 'react'

export default function ReturnButton({ count, onReturn }: { count: number; onReturn: () => void }) {
  const [flash, setFlash] = useState(false)

  const handleClick = () => {
    setFlash(true)
    onReturn()
    setTimeout(() => setFlash(false), 300)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={`w-32 h-32 rounded-full text-white text-lg font-bold shadow-lg transition-colors
          ${flash ? 'bg-green-400' : 'bg-white/20 hover:bg-white/30'}`}
      >
        回归
      </button>
      <p className="text-white/70 text-sm">今日回归：{count} 次</p>
    </div>
  )
}
```

**Step 2: 创建音频播放器组件**

支持：上传的音频列表、播放/暂停、切换曲目。

**Step 3: 创建专注模式页面**

全屏背景图（随机从 focus_images 中取一张），浮动便签文字，回归按钮，音频播放器。

**Step 4: 创建图片和音频 API**

```typescript
// src/lib/api/focus-images.ts
import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getFocusImages() {
  const { data, error } = await supabase
    .from('focus_images')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
  if (error) throw error
  return data
}

export async function uploadFocusImage(file: File) {
  const path = `${DEFAULT_USER_ID}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('focus-images')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('focus-images')
    .getPublicUrl(path)

  const { error } = await supabase
    .from('focus_images')
    .insert({ file_path: publicUrl, user_id: DEFAULT_USER_ID })
  if (error) throw error
}
```

**Step 5: 验证专注模式**

```bash
npm run dev
```
预期：进入 /focus 页面，显示全屏背景图、回归按钮可点击并计数。

**Step 6: Commit**

```bash
git add src/app/focus/ src/components/focus/ src/lib/api/focus-images.ts src/lib/api/audio-clips.ts
git commit -m "feat: add focus mode with return button and audio player"
```

---

## Task 11: 反思与分析页面 — 图表

**Files:**
- Create: `src/app/analysis/page.tsx`
- Create: `src/components/analysis/FocusTimePieChart.tsx`
- Create: `src/components/analysis/FocusTimeTrendChart.tsx`
- Create: `src/components/analysis/IBetterTrendChart.tsx`
- Create: `src/components/analysis/ReturnCountChart.tsx`
- Create: `src/components/analysis/DayTypeFilter.tsx`

**Step 1: 创建日类型筛选器**

三个选项：学习日 / 休假日 / 全部，切换后图表数据联动更新。

**Step 2: 创建专注时间饼图**

```typescript
// src/components/analysis/FocusTimePieChart.tsx
'use client'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b']

export default function FocusTimePieChart({ data }: { data: { in: number; out: number; entertainment: number } }) {
  const chartData = [
    { name: '课内投入', value: data.in },
    { name: '课外投入', value: data.out },
    { name: '娱乐消费', value: data.entertainment },
  ]
  return (
    <PieChart width={300} height={200}>
      <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )
}
```

**Step 3: 创建曲线图（时长趋势、iBetter、回归次数）**

使用 Recharts `LineChart` 组件，X 轴为日期，Y 轴为对应数值。

**Step 4: 组装分析页面**

```typescript
// src/app/analysis/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { getAllDailyRecords } from '@/lib/api/daily-records'
import DayTypeFilter from '@/components/analysis/DayTypeFilter'
import FocusTimePieChart from '@/components/analysis/FocusTimePieChart'
// ...其余 import

export default function AnalysisPage() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState<'all' | 'study_day' | 'rest_day'>('all')

  useEffect(() => {
    getAllDailyRecords().then(setRecords)
  }, [])

  const filtered = filter === 'all' ? records : records.filter(r => r.day_type === filter)

  return (
    <main className="p-4 space-y-6">
      <DayTypeFilter value={filter} onChange={setFilter} />
      <FocusTimePieChart data={/* 聚合 filtered 数据 */} />
      {/* 其余图表 */}
    </main>
  )
}
```

**Step 5: Commit**

```bash
git add src/app/analysis/ src/components/analysis/
git commit -m "feat: add analysis page with charts and day type filter"
```

---

## Task 12: 反思与分析页面 — 历史总结抽屉

**Files:**
- Create: `src/components/analysis/NotesDrawer.tsx`

**Step 1: 创建历史总结抽屉组件**

- 卡片列表，每张卡片显示日期和总结文字前几十个字
- 点击卡片展开/收起完整内容
- 按时间倒序排列

```typescript
// src/components/analysis/NotesDrawer.tsx
'use client'
import { useState } from 'react'

type Record = { id: string; date: string; note: string; day_type: string }

export default function NotesDrawer({ records }: { records: Record[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const notes = records.filter(r => r.note)

  return (
    <div className="space-y-2">
      <h2 className="font-bold text-lg">历史总结</h2>
      {notes.map(r => (
        <div key={r.id}
          className="rounded-xl bg-white shadow p-3 cursor-pointer"
          onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{r.date}</span>
            <span>{r.day_type === 'study_day' ? '学习日' : '休假日'}</span>
          </div>
          <p className={`mt-1 text-sm ${expanded === r.id ? '' : 'line-clamp-2'}`}>
            {r.note}
          </p>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/analysis/NotesDrawer.tsx
git commit -m "feat: add historical notes drawer in analysis page"
```

---

## Task 13: 设置页面

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: 创建设置页面**

包含：
- flomo API URL 输入框（保存到 localStorage）
- 上传专注模式背景图
- 上传音频片段（含标题）
- 管理现有图片和音频（显示列表，可删除）

**Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: add settings page for flomo API and media uploads"
```

---

## Task 14: 部署到 Vercel

**Step 1: 推送代码到 GitHub**

```bash
git remote add origin https://github.com/your-username/level-up.git
git push -u origin main
```

**Step 2: 在 Vercel 导入项目**

访问 https://vercel.com，导入 GitHub 仓库，配置环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEFAULT_USER_ID`

**Step 3: 验证部署**

Vercel 提供的网址在手机和电脑浏览器中均能正常访问和使用。

**Step 4: Commit（如有配置文件变更）**

```bash
git add .
git commit -m "chore: add Vercel deployment configuration"
```

---

## 开发顺序总结

```
Task 1  初始化项目
Task 2  Supabase 数据库配置
Task 3  Supabase 客户端工具
Task 4  UI 设计规范（调用 frontend-design skill）
Task 5  全局布局与导航
Task 6  首页：倒计时
Task 7  首页：便签提醒
Task 8  首页：每日录入表单
Task 9  组装首页
Task 10 专注模式
Task 11 反思分析：图表
Task 12 反思分析：历史总结抽屉
Task 13 设置页面
Task 14 部署到 Vercel
```
