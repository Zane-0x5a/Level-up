# Growth Analytics Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete growth-feedback analytics system that replaces the current shallow reporting experience with a settings-aware, emotionally intelligent analysis page aligned with Level Up's design system.

**Architecture:** Extend the existing Supabase-backed daily records model with opt-in growth-tracking fields and user preferences, then rebuild the analysis page around five coordinated modules: Today Growth Echo, Growth Pulse, Growth Structure, Growth Assets, and Growth Memory. Preserve compatibility with current data while shifting user-facing semantics from tool-specific labels and simplistic metrics to broad, growth-supportive language.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase, Recharts, CSS modules/global page CSS, existing Level Up design tokens.

---

### Task 1: Inspect Current Schema and Define Migration Shape

**Files:**
- Modify: `D:\Projects\Level Up\supabase\schema.sql`
- Modify: `D:\Projects\Level Up\supabase\migration.sql`
- Reference: `D:\Projects\Level Up\src\lib\api\daily-records.ts`
- Reference: `D:\Projects\Level Up\src\lib\api\stats.ts`

**Step 1: Write down the target schema changes in comments or notes before editing**

Target additions:
- keep legacy `ibetter_count` for compatibility, but plan a user-facing rename to `habit_checkin_count`
- add `progress_level text`
- add `progress_note text`
- add `state_label text`
- add preferences storage for optional analytics modules

**Step 2: Update `supabase/schema.sql` with the new columns and preferences table**

Add:
- `progress_level`
- `progress_note`
- `state_label`

Add a new preferences table, for example:

```sql
create table user_growth_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enable_habit_checkins boolean not null default false,
  enable_progress_tracking boolean not null default false,
  enable_state_tracking boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Step 3: Add the migration SQL in `supabase/migration.sql`**

Include `alter table` statements and create the new preferences table if missing.

**Step 4: Review the migration for backward compatibility**

Check:
- existing rows get nullable advanced fields
- old records still load safely
- legacy `ibetter_count` remains usable until a later physical rename

**Step 5: Commit**

```bash
git add supabase/schema.sql supabase/migration.sql
git commit -m "feat: extend growth analytics schema"
```

### Task 2: Add API Support for Advanced Daily Fields and Preferences

**Files:**
- Modify: `D:\Projects\Level Up\src\lib\api\daily-records.ts`
- Create: `D:\Projects\Level Up\src\lib\api\growth-preferences.ts`
- Modify: `D:\Projects\Level Up\src\lib\api\stats.ts`

**Step 1: Write the failing API shape expectations**

Expected support:
- daily records can read/write `progress_level`, `progress_note`, `state_label`
- preferences can be fetched and upserted
- stats can compute effective focus totals and recorded-day counts cleanly

**Step 2: Extend the daily record upsert/select types**

Example target shape:

```ts
type DailyRecordInput = {
  date: string
  day_type: string
  ibetter_count?: number
  note?: string
  focus_in_class?: number
  focus_out_class?: number
  entertainment?: number
  progress_level?: string | null
  progress_note?: string | null
  state_label?: string | null
}
```

**Step 3: Add `growth-preferences.ts`**

Implement:
- `getGrowthPreferences(userId)`
- `upsertGrowthPreferences(userId, prefs)`

**Step 4: Extend stats helpers**

Add helpers for:
- total effective hours
- total recorded days
- growth evidence counts if needed by the heatmap

**Step 5: Validate usage sites compile**

Run:

```bash
npm run lint
```

Expected:
- no TypeScript or ESLint errors from the API layer

**Step 6: Commit**

```bash
git add src/lib/api/daily-records.ts src/lib/api/growth-preferences.ts src/lib/api/stats.ts
git commit -m "feat: add growth analytics api support"
```

### Task 3: Rename User-Facing Habit Language

**Files:**
- Modify: `D:\Projects\Level Up\src\components\analysis\DailyEntryForm.tsx`
- Modify: `D:\Projects\Level Up\src\components\home\ProgressOverview.tsx`
- Modify: `D:\Projects\Level Up\src\app\analysis\page.tsx`
- Modify: `D:\Projects\Level Up\README.md`
- Modify: `D:\Projects\Level Up\README_zh.md`

**Step 1: Search all `iBetter`/`ibetter` references**

Run:

```bash
Get-ChildItem -Recurse -File src,supabase,README.md,README_zh.md | Select-String -Pattern 'iBetter|ibetter'
```

Expected:
- a clear list of remaining user-facing and internal references

**Step 2: Replace user-facing labels only**

Change:
- `iBetter` label -> `习惯打卡数`
- exported note copy -> `习惯打卡数`
- documentation copy -> generic habit-tracking language

Keep:
- internal legacy field names where needed for compatibility

**Step 3: Re-check that only intentional internal legacy references remain**

Run the same search again and confirm all user-facing copy is updated.

**Step 4: Commit**

```bash
git add src/components/analysis/DailyEntryForm.tsx src/components/home/ProgressOverview.tsx src/app/analysis/page.tsx README.md README_zh.md
git commit -m "refactor: rename habit tracking copy"
```

### Task 4: Add Settings Controls for Growth Tracking

**Files:**
- Modify: `D:\Projects\Level Up\src\app\settings\page.tsx`
- Modify: `D:\Projects\Level Up\src\app\settings\settings.css`
- Reference: `D:\Projects\Level Up\src\contexts\AuthContext.tsx`
- Reference: `D:\Projects\Level Up\src\lib\api\growth-preferences.ts`

**Step 1: Write the desired settings state model**

Model:
- base analytics fields always available
- advanced tracking fields controlled by booleans

**Step 2: Add settings-page loading and saving**

Wire in:
- `getGrowthPreferences`
- `upsertGrowthPreferences`

**Step 3: Build a lightweight `成长追踪` settings group**

Toggles:
- `习惯打卡数`
- `主线推进`
- `状态标签`

Copy:
- explain that these are optional advanced modules

**Step 4: Verify settings persistence**

Manual test:
- toggle options on
- refresh
- confirm persisted state

**Step 5: Commit**

```bash
git add src/app/settings/page.tsx src/app/settings/settings.css
git commit -m "feat: add growth tracking settings"
```

### Task 5: Make Daily Entry Form Settings-Aware

**Files:**
- Modify: `D:\Projects\Level Up\src\components\analysis\DailyEntryForm.tsx`
- Reference: `D:\Projects\Level Up\src\lib\api\growth-preferences.ts`

**Step 1: Add the advanced field state and load preferences**

Required conditional fields:
- `习惯打卡数`
- `progress_level`
- `progress_note`
- `state_label`

**Step 2: Add progressive disclosure to the form**

Behavior:
- base fields always shown
- optional fields shown only when enabled in settings

**Step 3: Add the progress controls**

Implement:
- segmented control for `靠近了一点 / 推进明显 / 有突破`
- short textarea or input for `今天最重要的一步`

**Step 4: Add the state label control**

Implement a lightweight pill selector:
- `恢复中`
- `稳住了`
- `状态不错`
- `很有能量`

**Step 5: Extend save/load behavior**

Ensure:
- editing historical records pre-fills advanced fields if present
- disabled modules do not break old data

**Step 6: Run lint for the form changes**

Run:

```bash
npm run lint
```

Expected:
- no form-related lint errors

**Step 7: Commit**

```bash
git add src/components/analysis/DailyEntryForm.tsx
git commit -m "feat: add advanced growth tracking inputs"
```

### Task 6: Create Shared Analytics Helpers

**Files:**
- Create: `D:\Projects\Level Up\src\lib\analysis\growth-metrics.ts`
- Modify: `D:\Projects\Level Up\src\app\analysis\page.tsx`

**Step 1: Define helper outputs before implementation**

Helpers should compute:
- effective focus totals
- growth evidence per day
- growth echo sentence inputs
- asset-card values
- heatmap data
- stability-strip data

**Step 2: Implement pure data helpers**

Suggested exports:

```ts
export function getEffectiveFocus(record: DailyRecord): number
export function hasGrowthEvidence(record: DailyRecord): boolean
export function buildGrowthEcho(...)
export function buildHeatmapData(...)
export function buildStabilityData(...)
```

**Step 3: Replace inline ad hoc calculations in `analysis/page.tsx`**

Move current weekly habit and focus calculations into the shared helper layer.

**Step 4: Verify compile**

Run:

```bash
npm run lint
```

Expected:
- no TypeScript/lint issues

**Step 5: Commit**

```bash
git add src/lib/analysis/growth-metrics.ts src/app/analysis/page.tsx
git commit -m "refactor: add shared growth analytics helpers"
```

### Task 7: Redesign the Analysis Page Layout

**Files:**
- Modify: `D:\Projects\Level Up\src\app\analysis\page.tsx`
- Modify: `D:\Projects\Level Up\src\app\analysis\analysis.css`
- Reference: `D:\Projects\Level Up\src\styles\design-tokens.ts`

**Step 1: Use the `frontend-design` skill before writing the UI code**

Goal:
- redesign a major frontend page while preserving the existing Level Up aesthetic

**Step 2: Replace the current section order with the five-module structure**

Target order:
- Today Growth Echo
- Growth Pulse
- Growth Structure
- Growth Assets
- Growth Memory

**Step 3: Preserve the current visual language**

Requirements:
- existing card grammar
- warm palette
- matching type scale
- responsive behavior aligned with home/analysis patterns

**Step 4: Ensure settings-aware rendering**

Behavior:
- hide advanced sections when modules are disabled
- avoid empty or broken gaps

**Step 5: Verify the page loads on desktop and mobile**

Manual check:
- desktop width around 1200px
- tablet width around 900px
- mobile width around 600px

**Step 6: Commit**

```bash
git add src/app/analysis/page.tsx src/app/analysis/analysis.css
git commit -m "feat: redesign growth analytics page layout"
```

### Task 8: Replace the Existing Charts with Growth-Oriented Visuals

**Files:**
- Modify: `D:\Projects\Level Up\src\components\analysis\FocusTimePieChart.tsx`
- Modify: `D:\Projects\Level Up\src\components\analysis\FocusTimeTrendChart.tsx`
- Create: `D:\Projects\Level Up\src\components\analysis\GrowthHeatmap.tsx`
- Create: `D:\Projects\Level Up\src\components\analysis\StabilityStrip.tsx`
- Create: `D:\Projects\Level Up\src\components\analysis\GrowthEchoCard.tsx`
- Create: `D:\Projects\Level Up\src\components\analysis\GrowthAssetsGrid.tsx`

**Step 1: Decide which existing chart files are being reused versus repurposed**

Suggested:
- repurpose `FocusTimeTrendChart.tsx` into a richer growth curve
- repurpose or replace `FocusTimePieChart.tsx` with a time-structure chart

**Step 2: Implement the growth curve**

Requirements:
- effective focus as the main series
- entertainment as a comparison layer
- tooltip copy that reflects growth language

**Step 3: Implement the heatmap**

Requirements:
- show recent continuity
- use current palette
- support sparse/empty data gracefully

**Step 4: Implement the stability strip**

Requirements:
- communicate consistency without feeling punitive

**Step 5: Implement the growth echo and asset components**

Requirements:
- narrative sentence
- compact growth cards
- no "higher is always better" messaging for return count

**Step 6: Verify the chart modules render with partial data**

Manual cases:
- no records
- only focus data
- focus + advanced data
- advanced settings disabled

**Step 7: Commit**

```bash
git add src/components/analysis/FocusTimePieChart.tsx src/components/analysis/FocusTimeTrendChart.tsx src/components/analysis/GrowthHeatmap.tsx src/components/analysis/StabilityStrip.tsx src/components/analysis/GrowthEchoCard.tsx src/components/analysis/GrowthAssetsGrid.tsx
git commit -m "feat: add growth-oriented analytics components"
```

### Task 9: Rework Growth Memory and Notes Presentation

**Files:**
- Modify: `D:\Projects\Level Up\src\components\analysis\NotesDrawer.tsx`
- Modify: `D:\Projects\Level Up\src\app\analysis\page.tsx`

**Step 1: Define the memory presentation rules**

Surface:
- recent progress note
- breakthrough entries
- low-energy but stable days
- existing freeform notes

**Step 2: Update `NotesDrawer.tsx` or split it if needed**

Goal:
- make it feel like a growth archive rather than a plain note list

**Step 3: Preserve delete-note behavior**

Ensure:
- old notes still render
- delete still works without affecting other advanced fields

**Step 4: Manual test memory rendering**

Check:
- records with notes only
- records with progress notes only
- mixed historical data

**Step 5: Commit**

```bash
git add src/components/analysis/NotesDrawer.tsx src/app/analysis/page.tsx
git commit -m "feat: turn analytics history into growth memory"
```

### Task 10: Update Home Overview and Any Dependent Surfaces

**Files:**
- Modify: `D:\Projects\Level Up\src\components\home\ProgressOverview.tsx`
- Modify: `D:\Projects\Level Up\src\components\home\HeroSection.tsx` (only if copy alignment is needed)

**Step 1: Ensure home overview copy matches new analytics semantics**

Change:
- `iBetter` -> `习惯打卡数`

**Step 2: Avoid overloading the home page**

Keep:
- home overview compact
- advanced growth meaning concentrated in analysis page

**Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected:
- home components still compile cleanly

**Step 4: Commit**

```bash
git add src/components/home/ProgressOverview.tsx src/components/home/HeroSection.tsx
git commit -m "refactor: align home overview with growth analytics"
```

### Task 11: Verify Behavior End-to-End

**Files:**
- No file edits required unless fixes are needed

**Step 1: Run the main verification**

Run:

```bash
npm run lint
```

Expected:
- success with no lint failures

**Step 2: Run the app and manually verify**

Run:

```bash
npm run dev
```

Manual checklist:
- analysis page loads
- settings toggles persist
- advanced fields appear and disappear correctly
- old records still load
- heatmap and structure charts handle empty states
- no remotion files are touched

**Step 3: Fix any issues found**

If a bug appears:
- make the minimal targeted fix
- rerun the relevant verification

**Step 4: Commit**

```bash
git add .
git commit -m "test: verify growth analytics redesign"
```

### Task 12: Update Project Docs After Implementation

**Files:**
- Modify: `D:\Projects\Level Up\README.md`
- Modify: `D:\Projects\Level Up\README_zh.md`
- Modify: `D:\Projects\Level Up\AGENTS.md` (only if implementation-level rules changed)

**Step 1: Document the new analytics model**

Include:
- optional growth tracking
- habit tracking terminology
- growth-focused interpretation

**Step 2: Re-check docs for stale language**

Search for:
- `iBetter`
- old analytics descriptions

**Step 3: Commit**

```bash
git add README.md README_zh.md AGENTS.md
git commit -m "docs: document growth analytics system"
```
