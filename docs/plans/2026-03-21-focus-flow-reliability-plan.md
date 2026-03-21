# Focus Flow Reliability Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the focus flow resilient and correct by restructuring the focus-page state model, preserving unsaved end-panel drafts, supporting immediate correction of the just-submitted focus session, upgrading duration input to hours + minutes, and replacing hard background swaps with preloaded dissolve transitions.

**Architecture:** Treat the focus experience as one coordinated state flow instead of scattered local state. Centralize page-mode restoration, end-panel draft persistence, recent-submission editability, and immersive background transitions around a single focus flow model, while keeping the refactor tightly scoped to the focus module and its directly related APIs. Fix focus-chain lint issues as part of that refactor, but do not expand into unrelated repository debt.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase, CSS, browser storage (`localStorage` / `sessionStorage`).

---

### Task 1: Audit Focus Flow State and Define Persistence Keys

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\page.tsx`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\FocusDefaultState.tsx`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\FocusImmersiveState.tsx`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\SessionEndPanel.tsx`

**Step 1: Write down the focus-state model before editing**

Document these states in comments or notes:
- page mode: `default | transitioning | immersive | ending`
- draft state: `category`, `hours`, `minutes`
- recent submission state: `id`, `category`, `duration`, `editableInSession`
- immersive background state: `currentUrl`, `nextUrl`, `isPreloading`, `isFading`

**Step 2: Define browser-storage keys**

Use per-user keys such as:
- `focus_end_draft:<userId>`
- `focus_page_mode:<userId>` (only if needed)
- `focus_recent_submission:<userId>` in `sessionStorage` only

**Step 3: Rework `page.tsx` so initial state is derived, not restored by effect-setState**

Goal:
- avoid synchronous `setState()` inside mount effects
- compute initial page mode safely
- keep nav visibility synced from current mode

**Step 4: Run focused lint on the page shell**

Run:

```bash
npx eslint src/app/focus/page.tsx
```

Expected:
- no `react-hooks/set-state-in-effect` error in this file

**Step 5: Commit**

```bash
git add src/app/focus/page.tsx
git commit -m "refactor: centralize focus page state shell"
```

### Task 2: Add Draft Persistence for the Session End Panel

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\SessionEndPanel.tsx`
- Create or Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\lib\focus-draft.ts`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\page.tsx`

**Step 1: Write the failing draft-persistence test or test script**

Cover:
- typing category + hours + minutes stores draft
- draft survives refresh / route leave
- successful submit clears draft

If no component test harness exists, add a focused state utility test around the draft helpers.

**Step 2: Run the test to confirm it fails for the expected reason**

Run the smallest test command available for the new utility/test file.

Expected:
- fail because persistence helper or restoration behavior does not exist yet

**Step 3: Implement draft helpers**

Implement small helpers for:
- read draft
- write draft
- clear draft
- validate stored payload shape

**Step 4: Wire `SessionEndPanel` to load and save draft state**

Requirements:
- save on every meaningful input change
- restore on mount
- keep the UI responsive while restoring
- clear on successful submit only

**Step 5: Verify the draft flow**

Run:

```bash
npx eslint src/components/focus/SessionEndPanel.tsx src/lib/focus-draft.ts
```

Expected:
- no new lint errors in these files

**Step 6: Commit**

```bash
git add src/components/focus/SessionEndPanel.tsx src/lib/focus-draft.ts
git commit -m "feat: persist focus end-panel drafts"
```

### Task 3: Replace Decimal-Hours Input with Hours + Minutes

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\SessionEndPanel.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\focus.css`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\lib\api\focus-sessions.ts`

**Step 1: Write the failing conversion test**

Add tests for:
- `1h 30m -> 1.5`
- `0h 45m -> 0.75`
- `2h 0m -> 2`
- invalid when total duration is zero

**Step 2: Run the test to make sure it fails**

Expected:
- conversion helper missing or validation incorrect

**Step 3: Add a small conversion/validation helper**

Implement:
- `toDurationHours(hours, minutes)`
- `isValidDurationInput(hours, minutes)`

**Step 4: Replace the single numeric field with two coordinated inputs**

Requirements:
- hour input
- minute input
- minute range `0-59`
- keep draft persistence compatible with the new shape
- update labels and error text accordingly

**Step 5: Verify the new input model**

Run:

```bash
npx eslint src/components/focus/SessionEndPanel.tsx
```

Expected:
- no new lint errors

**Step 6: Commit**

```bash
git add src/components/focus/SessionEndPanel.tsx src/app/focus/focus.css
git commit -m "feat: add hours and minutes focus input"
```

### Task 4: Support Correction of the Just-Submitted Session

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\lib\api\focus-sessions.ts`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\SessionEndPanel.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\page.tsx`

**Step 1: Write the failing API and state-flow test**

Cover:
- create returns inserted session record with id
- update can modify only the just-submitted session
- recent-submission editability is kept only for current browser session

**Step 2: Run it to confirm failure**

Expected:
- insert helper does not return a record or update helper missing

**Step 3: Extend the focus-session API**

Implement:
- `addFocusSession(...)` returning inserted row
- `updateFocusSession(sessionId, userId, category, duration)`

**Step 4: Add a lightweight post-submit confirmation state**

Requirements:
- after successful submit, show a confirmation state
- actions: `修正这次记录` and `完成`
- `修正这次记录` reopens only the just-submitted record
- clear the editable session token on `完成` or full session end

**Step 5: Verify the focused flow**

Run:

```bash
npx eslint src/lib/api/focus-sessions.ts src/components/focus/SessionEndPanel.tsx src/app/focus/page.tsx
```

Expected:
- no new lint errors in these files

**Step 6: Commit**

```bash
git add src/lib/api/focus-sessions.ts src/components/focus/SessionEndPanel.tsx src/app/focus/page.tsx
git commit -m "feat: allow correction of recent focus submission"
```

### Task 5: Add Preloaded Dissolve Background Transitions

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\FocusImmersiveState.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\focus.css`
- Reference: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\lib\api\focus-images.ts`

**Step 1: Write down the transition contract before editing**

Expected behavior:
- old image stays visible while next image loads
- next image preloads off-screen
- dissolve transition starts only when next image is ready
- fallback remains visible if no image is ready

**Step 2: Add a failing testable unit or narrow manual verification checklist**

At minimum define:
- selecting next background should not blank the screen
- switching should not happen until preload completes

**Step 3: Implement dual-layer background state**

State should include:
- `currentUrl`
- `nextUrl`
- `isPreloading`
- `isFading`

Use an `Image` object or equivalent preload strategy before committing `nextUrl` into the visible layer.

**Step 4: Add CSS dissolve transition**

Requirements:
- two background layers
- opacity transition
- no harsh close-and-reopen feel
- mobile-safe performance

**Step 5: Verify the background behavior**

Run:

```bash
npx eslint src/components/focus/FocusImmersiveState.tsx
```

Expected:
- no new lint errors

Manual check:
- re-enter focus multiple times
- observe that image changes dissolve rather than hard cut

**Step 6: Commit**

```bash
git add src/components/focus/FocusImmersiveState.tsx src/app/focus/focus.css
git commit -m "feat: add dissolve focus background transitions"
```

### Task 6: Remove Focus-Chain Lint Debt Introduced by Current Structure

**Files:**
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\app\focus\page.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\AudioPlayer.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\FocusDefaultState.tsx`
- Modify: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\src\components\focus\FocusImmersiveState.tsx`

**Step 1: List the exact focus-chain lint failures to clear**

Target only:
- `react-hooks/set-state-in-effect` in focus files
- no expansion to `home`, `community`, `auth`, or `remotion`

**Step 2: Fix each file with the minimal structural adjustment**

Examples:
- derive initial state instead of restoring by effect-setState
- move async loaders into event-safe or transition-safe patterns
- preserve behavior while satisfying hook rules

**Step 3: Run focused lint**

Run:

```bash
npx eslint src/app/focus/page.tsx src/components/focus/AudioPlayer.tsx src/components/focus/FocusDefaultState.tsx src/components/focus/FocusImmersiveState.tsx src/components/focus/SessionEndPanel.tsx
```

Expected:
- no lint errors in the focus chain

**Step 4: Commit**

```bash
git add src/app/focus/page.tsx src/components/focus/AudioPlayer.tsx src/components/focus/FocusDefaultState.tsx src/components/focus/FocusImmersiveState.tsx src/components/focus/SessionEndPanel.tsx
git commit -m "refactor: clean up focus flow lint issues"
```

### Task 7: End-to-End Verification for the Focus Flow

**Files:**
- No new files unless fixes are required

**Step 1: Run focused automated verification**

Run the exact commands:

```bash
node --test src/lib/analysis/growth-metrics.test.ts
npx eslint src/app/focus/page.tsx src/components/focus/AudioPlayer.tsx src/components/focus/FocusDefaultState.tsx src/components/focus/FocusImmersiveState.tsx src/components/focus/SessionEndPanel.tsx src/lib/api/focus-sessions.ts
```

Expected:
- tests pass
- focused lint passes

**Step 2: Run the app and manually verify the full focus flow**

Run:

```bash
npm run dev
```

Manual checklist:
- start focus from default state
- exit into end panel
- enter hours + minutes
- refresh and confirm draft restores
- submit successfully
- correct the just-submitted record once
- complete the flow
- re-enter focus and observe dissolve background transition
- verify no hard blank interval during background swap
- verify mobile layout for end panel and immersive controls

**Step 3: If issues appear, make only targeted fixes**

Then rerun the relevant verification commands.

**Step 4: Commit**

```bash
git add .
git commit -m "test: verify focus flow reliability refactor"
```

### Task 8: Prepare PR-Ready Summary and Scope Notes

**Files:**
- Modify if needed: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\README.md`
- Modify if needed: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\README_zh.md`
- Optional note file if team prefers: `D:\Projects\Level Up\.worktrees\codex-growth-analytics\docs/plans/2026-03-21-focus-flow-reliability-plan.md`

**Step 1: Document scope boundaries**

Be explicit that this refactor:
- fixes the focus flow only
- does not attempt to clean unrelated repository-wide lint debt
- keeps recent-session correction scoped to the just-submitted item

**Step 2: Summarize verification evidence for the PR**

Include:
- commands run
- what passed
- what repository-wide lint debt remains intentionally out of scope

**Step 3: Commit**

```bash
git add README.md README_zh.md docs/plans/2026-03-21-focus-flow-reliability-plan.md
git commit -m "docs: document focus flow reliability changes"
```
