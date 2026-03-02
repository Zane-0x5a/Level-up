# Homepage 四项修正 Design

Date: 2026-03-01

## 1. Hero 间距修复

- `.grid-hero`: `align-items: center` → `align-items: flex-end`
- `hero-date` margin-bottom: 12px → 20px
- `hero-greeting` margin-bottom: 14px → 22px, font-size: 32px → 36px
- `hero-tag` padding 稍增大

## 2. 倒计时方形阴影修复

- `.cd-pill` border-radius: `var(--radius-sm)` (10px) → `var(--radius)` (18px)

## 3. 上学日/假期即时切换

- 点击 `hero-tag` → 即时切换，乐观更新 UI → upsert DB
- `study_day`: sage 绿 + "上学日"
- `rest_day`: honey 黄 + "假期"
- 微动效: scale bounce on click
- CSS 新增 `.hero-tag.holiday` 变体 (honey 色)
- HeroSection 改为 `'use client'`，新增 onClick handler + upsertDailyRecord 调用

## 4. Hydration 错误修复

- 问候语初始值固定为 `DEFAULT_GREETINGS[0]`（SSR 安全）
- `useEffect` 中随机选取，仅在不同时 setState
- 消除 SSR/client mismatch
