# Mobile Adaptation Design — Level Up Homepage

Date: 2026-03-02
Approach: **方案 A — 纯 CSS 媒体查询** + 1 个新组件 (BottomTabBar)

## 断点体系

| 断点 | 屏幕 | 布局策略 |
|---|---|---|
| `> 900px` | 桌面 | 现有 2×2 网格不变 |
| `641–900px` | 平板 | 单列，尺寸适中 |
| `≤ 640px` | 手机 | 单列，尺寸进一步缩小 |

与现有分析/设置页的 900px + 600px 断点保持一致风格。

## 全局基础改动

- `page.tsx`: inline `padding: '0 48px'` → CSS class `.home-main`，平板 24px，手机 16px
- `globals.css .float-card`: padding 28px → 平板 20px，手机 16px
- `globals.css .top-nav`: ≤ 768px 时 `display: none`
- `home-layout`: 移动端 `min-height: auto`（单列可滚动，不撑满视口）
- `home-row1`, `home-row2`: ≤ 900px 时 `grid-template-columns: 1fr`（单列）
- Layout wrapper: 移动端增加 `padding-bottom: 56px` 给底部 tab bar 留空间

## 新组件: BottomTabBar

- 仅 ≤ 768px 时显示（CSS 控制）
- `position: fixed; bottom: 0; left: 0; right: 0`
- 高度 56px + `padding-bottom: env(safe-area-inset-bottom)`
- 4 tab 等分: 首页 / 专注 / 分析 / 设置，图标 + 文字标签
- 当前页高亮: `--color-coral`
- 背景: `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px) saturate(1.4)`
- 与 TopNav 样式风格一致

## Section: Hero

| 属性 | 桌面 | 平板 ≤900px | 手机 ≤640px |
|---|---|---|---|
| `hero-greeting` font-size | 36px | 30px | 24px |
| `hero-date` font-size | 12px | 12px | 11px |
| `hero-tag` padding | 8px 20px | 8px 18px | 7px 16px |
| `hero` padding | 28px 0 32px | 20px 0 24px | 16px 0 20px |

纯缩放，无布局变化。

## Section: 倒计时卡片

### 平板 ≤ 900px
保持左右布局，缩小数值：
- `cd-number`: 88px → 64px
- `cd-pill` padding: 20px 32px → 16px 24px
- `cd-right` padding: 20px 24px → 16px 20px

### 手机 ≤ 640px
切换为上下堆叠：
- `.cd-layout`: `flex-direction: column`
- `.cd-left`, `.cd-right`: `flex: none`
- `.cd-pill` 圆角: `var(--radius) 0 0 var(--radius)` → `var(--radius) var(--radius) 0 0`（左侧→顶部）
- `.cd-number`: 56px
- `.cd-right` padding 缩小
- `.cd-card` min-height: 140px → auto
- 导航箭头保持不变

## Section: 今日概览（指标行）

### 平板 ≤ 900px
- 保持 5 列，`metric-val` 28px → 24px

### 手机 ≤ 640px
- `.metrics-row`: `grid-template-columns: repeat(3, 1fr)` + `row-gap: 8px`
- 5 个指标排成：第一行 3 个 + 第二行 2 个
- 竖线分隔符 (`::after`) 隐藏，用 grid gap 自然间隔
- `metric-val`: 22px

## Section: 便签

改动最少：
- 手机端 `.note-input-row`: `flex-direction: column`，输入框占满宽度，按钮独占一行
- 其余保持不变

## 移动端内容排列顺序（单列）

Hero → 倒计时 → 今日概览 → 便签 → (底部 Tab Bar)
