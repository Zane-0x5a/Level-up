# Mobile Adaptation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adapt the Level Up homepage (and global nav) for mobile phones and tablets using pure CSS media queries + one new BottomTabBar component.

**Architecture:** Three breakpoints (640px / 768px / 900px). All layout changes are CSS-only — no TSX conditional rendering. The only new component is BottomTabBar. The 2×2 desktop grid reflows to a single column on tablet/mobile.

**Tech Stack:** Next.js 14 App Router, CSS (no Tailwind utility classes — project uses vanilla CSS with CSS variables), React client components.

**Design doc:** `docs/plans/2026-03-02-mobile-adaptation-design.md`

---

### Task 1: Convert page.tsx inline styles to CSS class

**Files:**
- Modify: `src/app/page.tsx:9`
- Modify: `src/app/home.css` (append after line 662)

**Step 1: Add `.home-main` class to home.css**

Append to end of `src/app/home.css`:

```css
/* ═══════════════════════════════════════
   HOME MAIN — replaces inline style on <main>
   ═══════════════════════════════════════ */
.home-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
}
```

**Step 2: Replace inline style in page.tsx**

In `src/app/page.tsx` line 9, change:
```tsx
<main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
```
to:
```tsx
<main className="home-main">
```

**Step 3: Verify build**

Run: `npx next build` (or `npm run build`)
Expected: Build succeeds, no errors.

**Step 4: Commit**

```
feat: convert homepage inline styles to CSS class
```

---

### Task 2: Convert layout.tsx inline paddingTop to CSS class

**Files:**
- Modify: `src/app/layout.tsx:42`
- Modify: `src/app/globals.css` (append after line 382)

**Step 1: Add `.page-content` class to globals.css**

Append to end of `src/app/globals.css`:

```css
/* ═══════════════════════════════════════
   PAGE CONTENT WRAPPER — nav offset
   ═══════════════════════════════════════ */
.page-content {
  position: relative;
  z-index: 10;
  padding-top: 82px;
}
```

**Step 2: Replace inline style in layout.tsx**

In `src/app/layout.tsx` line 42, change:
```tsx
<div className="relative z-10" style={{ paddingTop: 82 }}>
```
to:
```tsx
<div className="page-content">
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```
refactor: convert layout paddingTop to CSS class for responsive control
```

---

### Task 3: Add global responsive breakpoints (globals.css)

**Files:**
- Modify: `src/app/globals.css` (append after `.page-content` block)

**Step 1: Add tablet breakpoint (≤ 900px)**

Append to `src/app/globals.css`:

```css
/* ═══════════════════════════════════════
   RESPONSIVE — Tablet (≤ 900px)
   ═══════════════════════════════════════ */
@media (max-width: 900px) {
  .float-card {
    padding: 20px;
  }
}
```

**Step 2: Add mobile breakpoint (≤ 640px)**

Continue appending:

```css
/* ═══════════════════════════════════════
   RESPONSIVE — Mobile (≤ 640px)
   ═══════════════════════════════════════ */
@media (max-width: 640px) {
  .float-card {
    padding: 16px;
  }
}
```

**Step 3: Add nav hide + page-content adjustment at ≤ 768px**

Continue appending:

```css
/* ═══════════════════════════════════════
   RESPONSIVE — Nav switch (≤ 768px)
   ═══════════════════════════════════════ */
@media (max-width: 768px) {
  .top-nav {
    display: none;
  }
  .page-content {
    padding-top: 0;
    padding-bottom: 72px; /* space for bottom tab bar: 56px + 16px breathing room */
  }
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```
feat: add global responsive breakpoints for tablet and mobile
```

---

### Task 4: Create BottomTabBar component

**Files:**
- Create: `src/components/BottomTabBar.tsx`
- Modify: `src/app/globals.css` (append bottom-tab styles)
- Modify: `src/app/layout.tsx:39` (add BottomTabBar alongside TopNav)

**Step 1: Create BottomTabBar.tsx**

Create `src/components/BottomTabBar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/focus', label: '专注', icon: '🎯' },
  { href: '/analysis', label: '分析', icon: '📊' },
  { href: '/settings', label: '设置', icon: '⚙️' },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="bottom-tab-bar">
      {tabs.map(({ href, label, icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`tab-item${isActive ? ' active' : ''}`}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**Step 2: Add bottom-tab CSS to globals.css**

Append to `src/app/globals.css` (after the `@media (max-width: 768px)` block):

```css
/* ═══════════════════════════════════════
   BOTTOM TAB BAR — mobile only
   ═══════════════════════════════════════ */
.bottom-tab-bar {
  display: none; /* hidden on desktop */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-top: 1px solid rgba(43,45,66,0.05);
  align-items: center;
  justify-content: space-around;
}

@media (max-width: 768px) {
  .bottom-tab-bar {
    display: flex;
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  text-decoration: none;
  color: var(--color-text-3);
  transition: color 0.2s;
  padding: 6px 0;
  -webkit-tap-highlight-color: transparent;
}
.tab-icon {
  font-size: 20px;
  line-height: 1;
}
.tab-label {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 500;
}
.tab-item.active {
  color: var(--color-coral);
}
.tab-item.active .tab-label {
  font-weight: 600;
}
```

**Step 3: Add BottomTabBar to layout.tsx**

In `src/app/layout.tsx`, add import at line 4:
```tsx
import BottomTabBar from "@/components/BottomTabBar";
```

After `<TopNav />` (line 39), add:
```tsx
<BottomTabBar />
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```
feat: add BottomTabBar component for mobile navigation
```

---

### Task 5: Home layout responsive reflow (home.css)

**Files:**
- Modify: `src/app/home.css` (append media queries at end of file)

**Step 1: Add tablet breakpoint for home layout**

Append to `src/app/home.css`:

```css
/* ═══════════════════════════════════════
   RESPONSIVE — Tablet (≤ 900px)
   ═══════════════════════════════════════ */
@media (max-width: 900px) {
  .home-main {
    padding: 0 24px;
  }
  .home-layout {
    min-height: auto;
    grid-template-rows: auto auto;
  }
  .home-row1 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .home-row2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

**Step 2: Add mobile breakpoint for home layout**

Continue appending:

```css
/* ═══════════════════════════════════════
   RESPONSIVE — Mobile (≤ 640px)
   ═══════════════════════════════════════ */
@media (max-width: 640px) {
  .home-main {
    padding: 0 16px;
  }
  .home-layout {
    gap: 16px;
    padding: 12px 0 24px;
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```
feat: add home layout responsive reflow for tablet and mobile
```

---

### Task 6: Hero responsive sizing (home.css)

**Files:**
- Modify: `src/app/home.css` (add rules inside existing @media blocks from Task 5)

**Step 1: Add hero rules to tablet breakpoint**

Inside the `@media (max-width: 900px)` block in home.css, add:

```css
  .hero {
    padding: 20px 0 24px;
  }
  .hero-greeting {
    font-size: 30px;
    margin-bottom: 18px;
  }
```

**Step 2: Add hero rules to mobile breakpoint**

Inside the `@media (max-width: 640px)` block in home.css, add:

```css
  .hero {
    padding: 16px 0 20px;
  }
  .hero-date {
    font-size: 11px;
    margin-bottom: 14px;
  }
  .hero-greeting {
    font-size: 24px;
    margin-bottom: 14px;
  }
  .hero-tag {
    padding: 7px 16px;
    font-size: 11px;
  }
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```
feat: add hero section responsive sizing
```

---

### Task 7: Countdown card responsive layout (home.css)

**Files:**
- Modify: `src/app/home.css` (add rules inside existing @media blocks)

**Step 1: Add countdown rules to tablet breakpoint**

Inside `@media (max-width: 900px)` in home.css, add:

```css
  .cd-number {
    font-size: 64px;
    letter-spacing: -3px;
  }
  .cd-pill {
    padding: 16px 24px;
  }
  .cd-right {
    padding: 16px 20px;
  }
```

**Step 2: Add countdown rules to mobile breakpoint**

Inside `@media (max-width: 640px)` in home.css, add:

```css
  .cd-layout {
    flex-direction: column;
  }
  .cd-left {
    flex: none;
  }
  .cd-right {
    flex: none;
    padding: 12px 16px;
  }
  .cd-pill {
    padding: 20px 16px;
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .cd-number {
    font-size: 56px;
    letter-spacing: -3px;
  }
  .cd-card {
    min-height: auto;
  }
  .cd-form-layout {
    flex-direction: column;
    padding: 16px;
    gap: 10px;
  }
  .cd-form-layout .field-input[type="date"] {
    width: 100%;
  }
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```
feat: add countdown card responsive layout (stacked on mobile)
```

---

### Task 8: Metrics row + Notes responsive (home.css)

**Files:**
- Modify: `src/app/home.css` (add rules inside existing @media blocks)

**Step 1: Add metrics rules to tablet breakpoint**

Inside `@media (max-width: 900px)` in home.css, add:

```css
  .metric-val {
    font-size: 24px;
  }
```

**Step 2: Add metrics rules to mobile breakpoint**

Inside `@media (max-width: 640px)` in home.css, add:

```css
  .metrics-row {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 8px;
  }
  .metric:not(:last-child)::after {
    display: none;
  }
  .metric-val {
    font-size: 22px;
  }
```

**Step 3: Add notes rules to mobile breakpoint**

Inside `@media (max-width: 640px)` in home.css, add:

```css
  .note-input-row {
    flex-direction: column;
  }
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```
feat: add metrics row reflow and notes input responsive layout
```

---

### Task 9: Final build verification + visual check

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Dev server visual check**

Run: `npm run dev`
Check at these viewports:
- Desktop: 1200px+ (should be unchanged)
- Tablet: 768px (single column, TopNav hidden, BottomTabBar visible)
- Mobile: 375px (smaller fonts, stacked countdown, 3-col metrics)

**Step 3: Commit any final adjustments**

```
fix: mobile adaptation final adjustments
```
