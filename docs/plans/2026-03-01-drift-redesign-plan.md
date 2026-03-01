# Level Up — Drift Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Each task MUST invoke the `frontend-design` skill before writing any UI code.

**Goal:** Rebuild the entire frontend from H-Liquid Glass to L-Drift design system, switch from mobile-first to desktop-first layout, and fix all critical bugs.

**Architecture:** Replace globals.css design tokens + layout.tsx skeleton first (Task 1), then rebuild each page as an independent task. The API layer (`src/lib/api/*`) and Supabase schema are preserved unchanged. All components are rewritten from scratch following the Drift design document.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (@theme inline), Supabase, Recharts, Lucide React, Google Fonts (Sora + Lexend + DM Mono)

**Design Document:** `docs/plans/2026-03-01-drift-redesign-design.md`

---

## Task 1: Design System Foundation + Layout + Navigation

**Goal:** Replace the entire CSS design system from Liquid Glass to Drift, swap layout.tsx to desktop-first with new fonts, and create the TopNav component replacing BottomNav.

**Files:**
- Rewrite: `src/app/globals.css` (full replacement)
- Rewrite: `src/app/layout.tsx` (full replacement)
- Create: `src/components/TopNav.tsx` (replaces BottomNav)
- Delete: `src/components/BottomNav.tsx`
- Rewrite: `src/styles/design-tokens.ts` (update to match new tokens)

**IMPORTANT: Invoke the `frontend-design` skill before writing any code in this task.**

**Reference:** Design doc sections 1 (Design System), 2 (Layout), 3 (Navigation)

### Step 1: Rewrite globals.css

Replace the entire file. The new file must:

1. Use `@theme inline` with ALL Drift tokens (copy exact values from design doc section 1.1–1.7):
   - Color tokens: `--bg`, `--bg-sub`, `--card`, `--coral`, `--coral-soft`, `--coral-glow`, `--coral-glow-lg`, `--sage`, `--sage-soft`, `--sage-glow`, `--honey`, `--honey-soft`, `--honey-glow`, `--sky`, `--sky-soft`, `--rose`, `--rose-soft`, `--text`, `--text-2`, `--text-3`
   - Font tokens: `--font-display: 'Sora'`, `--font-body: 'Lexend'`, `--font-mono: 'DM Mono'`
   - Radius tokens: `--radius: 18px`, `--radius-md: 14px`, `--radius-sm: 10px`, `--radius-xs: 8px`
   - Shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
   - Easing: `--ease-spring: cubic-bezier(0.23, 1, 0.32, 1)`

2. Base styles:
   - `body` uses `var(--font-body)`, `color: var(--text)`, `background: var(--bg)`
   - `body::before` has three ultra-subtle radial washes (coral 3% top-left, sage 2.5% bottom-right, honey 2% center)
   - `::selection` uses coral

3. Float card system (NOT glass):
   ```css
   .float-card { background: var(--card); border-radius: var(--radius); border: 1px solid rgba(43,45,66,0.04); padding: 28px; transition: all 0.35s var(--ease-spring); }
   .float-card.glow-coral { box-shadow: 0 2px 8px rgba(0,0,0,0.02), 0 4px 20px var(--coral-glow); }
   .float-card.glow-coral:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.03), 0 10px 36px var(--coral-glow-lg); transform: translateY(-3px); }
   /* Same for glow-sage, glow-honey, glow-neutral */
   ```

4. Animation classes:
   - `@keyframes slideUp`, `@keyframes fadeIn`, `@keyframes pulse`, `@keyframes breatheRing`
   - `.anim` class with `slideUp 0.55s cubic-bezier(0.16,1,0.3,1) both`
   - `.d1` through `.d5` delay classes (0.05s, 0.10s, 0.15s, 0.20s, 0.25s)

5. Button classes: `.btn-warm` (coral solid pill) and `.btn-outline` (transparent border pill)

6. Input classes: `.field-input` and `.field-textarea` with `--bg-sub` background, coral focus border

7. Scrollbar styling

8. **Remove ALL glass-related classes** (glass-1, glass-2, glass-3, bg-scene, blob-*)

### Step 2: Rewrite layout.tsx

Replace the entire file:

1. Load Google Fonts: **Sora** (300–800) + **Lexend** (300–700) + **DM Mono** (400, 500)
2. Set `themeColor: "#faf8f5"` (Drift background)
3. `<body>` uses font-body class, NO blob divs, NO bg-scene div
4. Wrap `{children}` in `<div className="relative z-10">` (still needed for body::before)
5. Render `<TopNav />` instead of `<BottomNav />`
6. Add `padding-top: 82px` to content wrapper (space for fixed nav)
7. Remove `pb-24` (no more bottom nav)

### Step 3: Create TopNav.tsx

Create `src/components/TopNav.tsx`:

- Fixed position, top 16px, centered with `left: 50%; transform: translateX(-50%)`
- 4 nav links: 首页(`/`), 专注(`/focus`), 分析(`/analysis`), 设置(`/settings`)
- Use `usePathname()` for active state
- Brand text "Level Up" with "Up" in coral
- Active link: coral bg + white text + coral glow shadow
- **Do NOT hide on /focus route** — the focus page default state shows nav. Only the immersive state hides it (handled by focus page itself).
- Accept an optional `hidden` prop for the focus page to hide it during immersive mode

### Step 4: Update design-tokens.ts

Rewrite `src/styles/design-tokens.ts` to mirror the new CSS tokens. Update:
- `colors` object: remove accent/purple/amber, add coral/sage/honey/sky/rose with soft/glow variants
- `fonts`: display (Sora), body (Lexend), mono (DM Mono), update `googleFontsUrl`
- `radius`: 18/14/10/8
- `background`: remove landscape/focus gradients, add warm parchment
- `animation`: update durations

### Step 5: Delete BottomNav

Delete `src/components/BottomNav.tsx`.

### Step 6: Verify build compiles

Run: `npm run build`

Expected: Build may fail due to components still referencing old glass classes. That's OK — note which components fail. The purpose is to confirm the foundation files are syntactically correct.

### Step 7: Commit

```bash
git add src/app/globals.css src/app/layout.tsx src/components/TopNav.tsx src/styles/design-tokens.ts
git rm src/components/BottomNav.tsx
git commit -m "feat: replace Liquid Glass with Drift design system, add TopNav"
```

---

## Task 2: Home Page Rebuild

**Goal:** Rebuild the home page with desktop-first layout, Drift design, and working sticky notes.

**Files:**
- Rewrite: `src/app/page.tsx`
- Rewrite: `src/components/home/CountdownCard.tsx`
- Rewrite: `src/components/home/CountdownSection.tsx`
- Rewrite: `src/components/home/ProgressOverview.tsx`
- Rewrite: `src/components/home/StickyNotes.tsx`

**IMPORTANT: Invoke the `frontend-design` skill before writing any code in this task.**

**Reference:** Design doc section 4 (Home Page)

**API functions used (DO NOT modify these):**
- `getCountdowns()` from `src/lib/api/countdowns.ts`
- `getStickyNotes()`, `addStickyNote(content)`, `deleteStickyNote(id)` from `src/lib/api/sticky-notes.ts`
- `getTodayFocusSessions()`, `getTodayReturnCount()` from `src/lib/api/focus-sessions.ts`
- `getDailyRecord(date)` from `src/lib/api/daily-records.ts`

### Step 1: Rewrite page.tsx

Change layout from `max-w-md mx-auto` (mobile) to desktop-first:
```
<main className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
```

Add Hero section at top:
- Date line (DM Mono, text-3)
- Greeting (Sora 32px 800, gradient text on keywords)
- Status capsule (sage)

Then render: `<CountdownSection />`, then a two-column grid `3fr 2fr` with `<ProgressOverview />` and `<StickyNotes />`.

### Step 2: Rewrite CountdownCard.tsx

Single card component. Props: `{ emoji, number, unit, label, targetDate, glowColor }`.

Structure:
- `.float-card` with dynamic glow class
- Emoji → colored pill with large number → unit → label → target date
- All using Drift tokens (Sora for numbers, DM Mono for dates)

### Step 3: Rewrite CountdownSection.tsx

Section header (coral dot + "倒计时") + 3-column grid of `<CountdownCard />`.
Fetches data from `getCountdowns()`.

### Step 4: Rewrite ProgressOverview.tsx

Section header (sage dot + "今日概览") + float-card with 5 metrics row.
Fetches from `getTodayFocusSessions()` and `getDailyRecord(today)`.
Metrics: 课内投入 / 课外投入 / 娱乐消费 / iBetter / 回归次数.
First metric uses sage highlight pill.

### Step 5: Rewrite StickyNotes.tsx — FIX CRUD BUG

Section header (honey dot + "便签提醒") + float-card with note list.

**Critical fix:** The add button must work. Implementation:
- State: `notes[]`, `isAdding`, `newContent`
- Toggle `isAdding` to show/hide inline input
- Input: `--bg-sub` background, Enter key or submit button triggers `addStickyNote(content)` → `loadNotes()`
- Delete: X button on each note calls `deleteStickyNote(id)` → `loadNotes()`
- "添加便签" text at bottom toggles input visibility

### Step 6: Verify home page renders

Run: `npm run dev`, check `localhost:3000`

Expected: Home page displays with Drift styling, correct layout, working sticky notes.

### Step 7: Commit

```bash
git add src/app/page.tsx src/components/home/
git commit -m "feat: rebuild home page with Drift design, fix sticky notes CRUD"
```

---

## Task 3: Focus Page — Complete Redesign

**Goal:** Rebuild the focus page with dual-state design: default (full page with nav) → transition → immersive (fullscreen). Fix data persistence bugs.

**Files:**
- Rewrite: `src/app/focus/page.tsx`
- Rewrite: `src/components/focus/FocusDefaultState.tsx`
- Rewrite: `src/components/focus/SpaceTransition.tsx`
- Rewrite: `src/components/focus/FocusImmersiveState.tsx`
- Rewrite: `src/components/focus/ReturnButton.tsx`
- Rewrite: `src/components/focus/SessionEndPanel.tsx`
- Rewrite: `src/components/focus/AudioPlayer.tsx`

**IMPORTANT: Invoke the `frontend-design` skill before writing any code in this task. This is the most critical page — the transition animation and dual-state design must be exceptional.**

**Reference:** Design doc section 5 (Focus Page)

**API functions used (DO NOT modify these):**
- `getTodayFocusSessions()`, `getTodayReturnCount()`, `incrementReturnCount(date)`, `addFocusSession(category, duration)` from `src/lib/api/focus-sessions.ts`
- `getWeeklyFocusHours()` from `src/lib/api/stats.ts`
- `getStickyNotes()` from `src/lib/api/sticky-notes.ts`
- `getFocusImages()` from `src/lib/api/focus-images.ts`
- `getAudioClips()` from `src/lib/api/audio-clips.ts`

### Step 1: Rewrite focus/page.tsx — State Machine

States: `'default' | 'transitioning' | 'immersive' | 'ending'`

Key changes from current:
- **TopNav visibility**: Pass a callback or use context to tell TopNav to hide/show. The default state SHOWS the nav. Only `transitioning` and `immersive` states hide it.
- Transition: `default` → user clicks orb → `transitioning` → animation completes → `immersive`
- Exit: user clicks × → `ending` (SessionEndPanel) → save data → `default`

### Step 2: Rewrite FocusDefaultState.tsx — Full Page with Nav

**This is NOT a fullscreen overlay anymore.** It's a normal page within the standard layout.

Layout (inside the 1200px container):
- Title area: "今日专注" + lightweight stats (Sora display, DM Mono for numbers)
- Two summary cards side by side (float-card glow-sage):
  - "上次专注": last session duration + category from `getTodayFocusSessions()`
  - "本周累计": total from `getWeeklyFocusHours()` + comparison
- Central breathing orb (180px circle):
  - `position: relative` (NOT fixed)
  - White semi-transparent + blur, thin border
  - `breatheRing` keyframe on outer pseudo-element: faint coral glow pulsing
  - Hover: coral warmth
  - Click triggers `onEnter()` callback
- Optional motivational text below

**Remove:** Fixed positioning, hardcoded background gradient, the old "portal orb" with dual ring animation.

### Step 3: Rewrite SpaceTransition.tsx — "Gentle Unveiling"

Three-phase animation (~1.2s total):

**Phase 1 "Gather" (0–400ms):**
- Render a full-screen overlay (`fixed inset-0, z-50`)
- On mount, the overlay is transparent
- Immediately start: page content fades up (handled by parent setting a CSS class)
- The overlay has a warm radial gradient centered at the orb's last position

**Phase 2 "Unfold" (400ms–1000ms):**
- The radial gradient expands from `0` to `200vmax`
- Color: warm cream `rgba(253,240,232,0.97)` → fades to reveal what's behind
- Use CSS `radial-gradient` with animated `background-size` or use a `clip-path: circle()` animation

**Phase 3 "Arrive" (1000ms–1200ms):**
- Overlay fades out completely
- Call `onComplete()`

**Implementation approach:** Use `requestAnimationFrame` + CSS transitions for smoothness. The key is making it feel like a warm wash spreading outward, not a harsh wipe.

### Step 4: Rewrite FocusImmersiveState.tsx

Fullscreen (`fixed inset-0, z-40`):

- Background: random image from `getFocusImages()` or fallback warm gradient with three slow blobs
- Dark overlay: `rgba(0,0,0,0.3)` for readability
- Center: ReturnButton (180px circle, same design as orb) + return count capsule
- Random sticky note: **`useState(() => ...)` to pick once on mount** — fixes the re-randomization bug
- Audio bar at bottom (AudioPlayer component)
- Exit × button at top-right

### Step 5: Rewrite ReturnButton.tsx

180px circle button matching the breathing orb design:
- Click: scale animation (1.0 → 1.15 → 1.0 over 400ms) + coral flash
- Calls `incrementReturnCount(today)` then `onReturn()` callback
- Parent shows "+1" toast that fades after 1.5s

### Step 6: Rewrite SessionEndPanel.tsx — FIX DATA PERSISTENCE

Overlay panel (`fixed inset-0, z-50, flex center`):
- Float card with form: category pills (课内/课外/娱乐) + duration input + save/skip buttons
- **Save flow:**
  1. Call `addFocusSession(category, parseFloat(hours))` — this writes to `focus_sessions` table
  2. On success, return to default state
  3. On error, show error message (don't silently fail)
- **Ensure the data actually persists** — verify `addFocusSession` sends correct params

### Step 7: Rewrite AudioPlayer.tsx

Floating capsule at bottom-center:
- Semi-transparent white + blur, pill shape
- Controls: prev/play/next + progress bar + timestamp
- Uses audio clips from `getAudioClips()`
- Play button: coral circle

### Step 8: Verify focus page works end-to-end

Run: `npm run dev`, navigate to /focus

Test flow:
1. Default state shows with nav visible, stats loaded
2. Click breathing orb → transition plays smoothly
3. Immersive state shows with background, return button works
4. Click × → SessionEndPanel appears, save a session
5. Returns to default state, new session appears in stats

### Step 9: Commit

```bash
git add src/app/focus/ src/components/focus/
git commit -m "feat: rebuild focus page with dual-state design and gentle transition"
```

---

## Task 4: Analysis Page + Settings Page + Final Integration

**Goal:** Rebuild analysis page with desktop layout and daily entry form (moved from home), make settings page accessible, and verify all data flows work.

**Files:**
- Rewrite: `src/app/analysis/page.tsx`
- Rewrite: `src/components/analysis/DailyEntryForm.tsx`
- Rewrite: `src/components/analysis/DayTypeFilter.tsx`
- Rewrite: `src/components/analysis/FocusTimePieChart.tsx`
- Rewrite: `src/components/analysis/FocusTimeTrendChart.tsx`
- Modify: `src/components/analysis/NotesDrawer.tsx` (restyle only)
- Delete: `src/components/analysis/IBetterTrendChart.tsx` (consolidate if not needed)
- Delete: `src/components/analysis/ReturnCountChart.tsx` (consolidate if not needed)
- Rewrite: `src/app/settings/page.tsx`

**IMPORTANT: Invoke the `frontend-design` skill before writing any code in this task.**

**Reference:** Design doc sections 6 (Analysis) and 7 (Settings)

**API functions used (DO NOT modify these):**
- `getAllDailyRecords()`, `getDailyRecord(date)`, `upsertDailyRecord(record)` from `src/lib/api/daily-records.ts`
- `sendToFlomo(content)` from `src/lib/flomo.ts`
- `getTodayFocusSessions()` from `src/lib/api/focus-sessions.ts`
- `getStreak()`, `getTotalFocusHours()`, `getWeeklyFocusHours()`, `getTotalReturnCount()` from `src/lib/api/stats.ts`
- `getFocusImages()`, `uploadFocusImage(file)`, `deleteFocusImage(id)` from `src/lib/api/focus-images.ts`
- `getAudioClips()`, `uploadAudioClip(file, label)`, `deleteAudioClip(id)` from `src/lib/api/audio-clips.ts`

### Step 1: Rewrite analysis/page.tsx

Desktop layout (1200px container):

1. Header row: title left + filter pills right
2. Daily entry form section (sec-dot sky + "每日记录")
3. Charts section (sec-dot coral + "数据概览") — `1fr 2fr` grid
4. Key metrics section (sec-dot sage + "关键指标") — 3 stat cards
5. History section (sec-dot honey + "历史总结") — 2-column card grid

Fetch `getAllDailyRecords()` and `getTodayFocusSessions()` on mount.

### Step 2: Rewrite DailyEntryForm.tsx

Moved here from home page. Float-card with:
- Day type pills (学习日/休假日)
- 4-column input grid (field-input class, DM Mono font)
- Textarea (field-textarea class)
- btn-warm "保存记录" + btn-outline "发送到 flomo →"
- Save calls `upsertDailyRecord()`, flomo calls `sendToFlomo()`

### Step 3: Rewrite DayTypeFilter.tsx

Simple pill toggle group. Coral active state.

### Step 4: Rewrite chart components

Use Recharts with Drift colors:
- `FocusTimePieChart.tsx`: Donut using coral/sage/text-3
- `FocusTimeTrendChart.tsx`: Line chart using coral line + coral gradient fill

Keep chart components simple. Use `float-card glow-coral` wrappers.

### Step 5: Rewrite settings/page.tsx

Desktop layout with three float-card sections:
1. Flomo API (glow-neutral) — input + save
2. Focus images (glow-coral) — upload grid with thumbnails
3. Audio clips (glow-sage) — list with upload/delete

Ensure all upload/delete operations have proper error handling and loading states.

### Step 6: Verify all data flows

Test in dev:
1. Save a daily record in Analysis → verify it appears in history
2. Complete a focus session → verify it appears in Analysis charts
3. Upload an image in Settings → verify it appears as focus background
4. Upload audio in Settings → verify it plays in focus mode

### Step 7: Commit

```bash
git add src/app/analysis/ src/components/analysis/ src/app/settings/
git commit -m "feat: rebuild analysis and settings pages with Drift design"
```

---

## Task 5: Final Build Verification + Cleanup

**Goal:** Ensure the entire app builds, all pages work, remove dead code.

**Files:**
- Possible cleanup of any remaining old imports/references

### Step 1: Run full build

```bash
npm run build
```

Fix any TypeScript or build errors.

### Step 2: Test all routes

- `/` — Home page with hero, countdown, overview, sticky notes
- `/focus` — Default state → transition → immersive → session end → back
- `/analysis` — Entry form, charts, metrics, history
- `/settings` — All three config sections work

### Step 3: Remove dead files

Check for any leftover files that reference old design system (glass-*, blob-*, etc.). Remove unused imports.

### Step 4: Final commit

```bash
git add -A
git commit -m "chore: final cleanup, remove old Liquid Glass references"
```

---

## Dependency Graph

```
Task 1 (Design System) ──→ Task 2 (Home Page) ──→ Task 5 (Verification)
                       ──→ Task 3 (Focus Page) ──→ Task 5
                       ──→ Task 4 (Analysis + Settings) ──→ Task 5
```

Tasks 2, 3, 4 can run in parallel after Task 1 completes (they share no component dependencies). Task 5 runs after all others complete.

## Key Reminders for All Tasks

1. **Invoke `frontend-design` skill** before writing any UI code
2. **Use Drift design tokens** — never hardcode colors, use CSS variables
3. **Desktop-first** — 1200px container, 48px padding, generous whitespace
4. **No purple** — no purple anywhere in any component
5. **No glass classes** — use `.float-card.glow-*` instead
6. **API layer is untouched** — reuse all existing `src/lib/api/*` functions
7. **Sora for display, Lexend for body, DM Mono for data** — enforce consistently
