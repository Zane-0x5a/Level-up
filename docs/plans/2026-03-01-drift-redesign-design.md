# Level Up — Drift Redesign Design Document

**Date**: 2026-03-01
**Status**: Approved
**Design Base**: L-Drift (elevated)
**Target**: Desktop-first (1280px+), responsive to mobile later

---

## 1. Design System

### 1.1 Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#faf8f5` | Main background, warm parchment |
| `--bg-sub` | `#f3efe9` | Input fields, secondary surfaces |
| `--card` | `#ffffff` | Card surfaces |
| `--coral` | `#d4654a` | Primary accent (action, countdown) |
| `--coral-soft` | `rgba(212,101,74,0.08)` | Coral tint backgrounds |
| `--coral-glow` | `rgba(212,101,74,0.14)` | Coral shadow glow |
| `--coral-glow-lg` | `rgba(212,101,74,0.20)` | Coral hover glow |
| `--sage` | `#5b9279` | Secondary (progress, success) |
| `--sage-soft` | `rgba(91,146,121,0.08)` | Sage tint |
| `--sage-glow` | `rgba(91,146,121,0.12)` | Sage shadow |
| `--honey` | `#e8b86d` | Warm auxiliary (reminders, notes) |
| `--honey-soft` | `rgba(232,184,109,0.10)` | Honey tint |
| `--honey-glow` | `rgba(232,184,109,0.16)` | Honey shadow |
| `--sky` | `#5b8fb9` | Cool auxiliary (info, links) |
| `--sky-soft` | `rgba(91,143,185,0.08)` | Sky tint |
| `--rose` | `#c9515b` | Negative indicator |
| `--rose-soft` | `rgba(201,81,91,0.08)` | Rose tint |
| `--text` | `#2b2d42` | Primary text |
| `--text-2` | `#6b7280` | Secondary text |
| `--text-3` | `#a3a9b8` | Placeholder/weak text |

**No purple anywhere.** No AI-typical purple-blue gradients.

### 1.2 Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | Sora | 700, 800 | Headings, large numbers, brand |
| Body | Lexend | 300–700 | Body text, buttons, labels |
| Mono | DM Mono | 400, 500 | Dates, data values, timers |

### 1.3 Card System — Float Cards with Colored Glow Shadows

Cards are solid white with colored ambient glow shadows. Not frosted glass.

```css
.float-card {
  background: var(--card);
  border-radius: 18px;
  border: 1px solid rgba(43,45,66,0.04);
  padding: 28px;
  transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
}
.float-card.glow-coral {
  box-shadow: 0 2px 8px rgba(0,0,0,0.02), 0 4px 20px var(--coral-glow);
}
.float-card.glow-coral:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.03), 0 10px 36px var(--coral-glow-lg);
  transform: translateY(-3px);
}
/* Same pattern for glow-sage, glow-honey, glow-neutral */
```

### 1.4 Background

Static warm parchment `--bg`. `body::before` has three ultra-subtle fixed radial washes:
- Coral 3% at top-left
- Sage 2.5% at bottom-right
- Honey 2% at center

No animated blobs on main pages. No dynamic backgrounds.

### 1.5 Border Radii

- Card: 18px
- Medium: 14px
- Small: 10px
- Extra small: 8px
- Pill: 100px

### 1.6 Shadows

- `--shadow-sm`: `0 2px 8px rgba(43,45,66,0.04)`
- `--shadow-md`: `0 4px 20px rgba(43,45,66,0.06)`
- `--shadow-lg`: `0 8px 32px rgba(43,45,66,0.08)`

### 1.7 Motion Principles

- Entry: `slideUp 0.55s cubic-bezier(0.16,1,0.3,1)` with staggered delays (60ms intervals)
- Hover: `translateY(-3px)` + glow enlargement, `cubic-bezier(0.23,1,0.32,1)`
- No gratuitous looping animations (except the focus orb breathe ring)
- Easing: spring-like `cubic-bezier(0.23,1,0.32,1)` for interactions

### 1.8 Section Headers

8px colored dot + Sora 15px 600 text. Gentle, low-key, functional. No editorial numbering or large icons.

---

## 2. Layout — Desktop First

- `max-width: 1200px`, centered, `padding: 0 48px`
- Sections spaced with `margin-bottom: 36px`
- Cards padded at `28px`
- Generous whitespace throughout — warm, breathable, unhurried

---

## 3. Top Navigation — Floating Pill

Fixed at top 16px, centered horizontally.

```
[Level Up     首页  专注  分析  设置]
```

- Background: `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px) saturate(1.4)`
- Brand: Sora 15px 700, "Up" in coral
- Links: Lexend 13px 500, pill-shaped
- Active: coral solid bg + white text + coral glow shadow
- Hover: subtle gray bg + darker text
- Border: `1px solid rgba(43,45,66,0.05)`, `border-radius: 100px`
- Settings link included as rightmost nav item

---

## 4. Home Page

### 4.1 Hero (centered)

- Date: `DM Mono 12px`, text-3, `星期日 · 2026年3月1日`
- Greeting: `Sora 32px 800`, key words use `coral→honey` gradient text
- Status capsule: sage-soft bg + sage text + breathing dot, `学习日 · 第 60 天`

### 4.2 Countdown Section

3-column grid, `gap: 16px`.

Each card:
- Emoji icon (22px)
- Colored pill background (coral-soft / sage-soft / honey-soft)
  - Large number: `Sora 52px 800`, colored to match, `letter-spacing: -2px`
- Unit "天": `Lexend 14px`, text-3
- Event name: `Sora 15px 700`
- Target date: `DM Mono 11px`, text-3

Cards use matching `.glow-coral` / `.glow-sage` / `.glow-honey`.

### 4.3 Overview + Notes — Two Column `3fr 2fr`

**Left: Today's Overview card** (glow-sage)
- 5 metrics in a row with vertical dividers
- First metric (课内投入) highlighted with sage pill
- Numbers: `Sora 28px 700`, units: `13px text-3`
- Labels: `12px text-2`

**Right: Sticky Notes card** (glow-neutral)
- List items: honey dot (7px) + text, thin bottom dividers
- `+ 添加便签` at bottom, hover turns coral
- Click expands inline input, Enter or button to submit
- CRUD must work correctly (fix current broken add button)

---

## 5. Focus Page — Dual State Design

### 5.1 Default State (full page with navigation)

A quiet preparation space. Visually consistent with the rest of the site.

**Layout:**
- Top nav remains visible
- Page title area: "今日专注" with lightweight stats (已专注 Xh Xmin / 回归 X 次)
- Two summary cards side by side: "上次专注" (duration + category) and "本周累计" (total + trend)
- Central breathing orb as the main interaction element
- Optional: a quiet motivational quote at the bottom

**Breathing Orb ("开始专注"):**
- 180px circle, white semi-transparent + blur, thin border
- Inner text: `Sora 20px 700`, default `text-2` color
- Outer ring: ultra-faint coral breathing glow (`breatheRing` animation, slow, subtle)
- Hover: glow deepens, interior warms to coral 14% bg, text turns coral
- This is the ONLY animated element on the page — visual gravity falls here naturally

**Background:** Standard `--bg` warm parchment. No special treatment. The page feels "normal" until you press the orb.

### 5.2 Transition — "Gentle Unveiling" (~1.2s)

**Phase 1 "Gather" (0–400ms):**
- Page content (stat cards, text) gently fades upward (opacity + translateY)
- Nav bar slides upward out of viewport
- Breathing orb stays in position, glow intensifies slightly

**Phase 2 "Unfold" (400ms–1000ms):**
- From the orb's position, a warm semi-transparent radial gradient expands outward to 200vmax
- Color: `rgba(253,240,232,0.95)` → gradually reveals the immersive background beneath
- Not a hard cut — the old world dissolves, the new world surfaces

**Phase 3 "Arrive" (1000ms–1200ms):**
- Background fully revealed (user-uploaded image or default warm gradient)
- Return button and audio controls fade in gracefully
- The orb's glow naturally transforms into the return button's breathing glow

Keywords: **gentle, natural, continuous**. No black screens, no hard cuts, no flashing.

### 5.3 Immersive State (fullscreen, no navigation)

**Background:**
- User-uploaded image covering fullscreen + semi-transparent dark overlay for readability
- If no uploaded image: L-Drift warm gradient (`linear-gradient(155deg, #fdf0e8, #faf5ef, #eef5f0, #f5f0e0)`) + three slow-drifting warm blobs (coral/sage/honey)

**Center:**
- Return button: same 180px circle design as default state orb
  - Click: coral flash feedback + count increment + "+1" toast
  - Toast fades after 1.5s
- Below: return count capsule `DM Mono 13px`, `今日回归 · 5 次`

**Floating elements:**
- Random sticky note displayed in pale semi-transparent text — **selected once on mount** (not re-randomized on re-renders)
- Exit button: top-right, small ×, low visual presence

**Audio bar:** bottom-center floating capsule
- Semi-transparent white + blur, pill-shaped
- Track info + prev/play/next + progress bar + timestamp
- Play button: coral circle with white icon

**Exit flow:**
- Click × → SessionEndPanel overlay
- User selects category + enters duration → saves to Supabase → returns to default state
- Data must correctly persist and show in Analysis page

---

## 6. Analysis Page

### 6.1 Header

Inline row: title `Sora 26px 800` on left, filter pills on right (全部/学习日/休假日).

### 6.2 Daily Entry Form (moved here from Home page per user requirement)

- Day type toggle pills (学习日/休假日)
- 4-column input grid: 课内投入/课外投入/娱乐消费/iBetter
- Textarea for 今日总结
- Action row: "保存记录" (btn-warm coral) + "发送到 flomo →" (btn-outline)
- Input fields: `--bg-sub` background, coral border on focus, `DM Mono` for number inputs

### 6.3 Charts — `1fr 2fr` grid

Left: Donut chart (time allocation, coral/sage/text-3)
Right: Line chart (focus duration trend, coral line + coral gradient fill)

### 6.4 Key Metrics — 3-column grid

Large numbers `Sora 40px 700` + metric name + trend badge (sage=up, rose=down)

### 6.5 History Section — 2-column grid

Cards with: date (DM Mono) + day type tag + summary text (2-line clamp), hover lift.

---

## 7. Settings Page

Accessible from top nav. Three config sections stacked vertically:

1. **Flomo API** — URL input + save button, glow-neutral card
2. **Focus Background Images** — Upload grid with preview thumbnails, delete per image, glow-coral card
3. **Audio Clips** — List with name + file, upload/delete, glow-sage card

---

## 8. Bug Fixes Required

| Bug | Fix |
|-----|-----|
| Sticky note add button non-functional | Ensure CRUD works end-to-end |
| Focus immersive state re-randomizes note on every render | Select random note in `useState`/`useRef` on mount only |
| Session end data doesn't persist to analysis | Fix Supabase write + ensure analysis page reads correctly |
| Settings page unreachable | Add to top nav |
| BottomNav hides on /focus with no way back | Replace with TopNav that handles focus state transitions properly |

---

## 9. Technical Notes

- **Framework**: Next.js App Router (existing)
- **Styling**: Tailwind CSS v4 with `@theme inline` design tokens
- **Database**: Supabase (existing schema reused)
- **Fonts**: Google Fonts — Sora, Lexend, DM Mono
- **Desktop-first**: min-width media queries for responsive, not max-width
- **No purple**: enforced throughout all components
- **No animated blob backgrounds** on main pages (only in focus immersive fallback)
