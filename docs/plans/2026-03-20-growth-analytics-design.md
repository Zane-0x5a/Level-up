# Growth Analytics Redesign Design

Date: 2026-03-20

## Background

The current analysis page in Level Up is functional but shallow. It mainly presents a pie chart, a basic trend chart, and a small set of aggregate metrics. That is not enough for the product's real purpose.

Level Up is not trying to become a generic reporting tool. Its core purpose is to make personal growth visible so users feel stronger immediate positive feedback, stronger long-term meaning, and more motivation to continue self-directed learning and self-directed growth.

This redesign treats analytics as a growth feedback system rather than a passive dashboard.

## Design Principles

1. Show users that today was not wasted.
2. Show users that growth is accumulating over time.
3. Treat recovery, fluctuation, and low-energy days as part of growth, not as failure.
4. Keep the UI aligned with the existing Level Up visual language.
5. Make non-core tracking optional so the system stays broadly applicable.

## Product Decisions

| Dimension | Decision |
|---|---|
| Core outcome | Strengthen immediate positive feedback and long-term growth meaning |
| Tone | Warm, encouraging, light, and aligned with the home page |
| Frontend direction | Extend the existing Level Up design system rather than invent a new style |
| Optionality | Advanced growth fields are managed in settings |
| Metrics philosophy | Avoid reducing growth to a single score |
| Return count interpretation | Never treat as a simple "higher is better" metric |
| Habit terminology | Rename user-facing `iBetter` references to `习惯打卡数` |

## Information Architecture

The analysis page should be restructured into five modules.

### 1. Today Growth Echo

Purpose: create immediate positive feedback as soon as the user opens the page.

Content:
- one natural-language feedback sentence
- two or three compact supporting cards

Example feedback:
- "Today you have already invested 4.8h, made clear progress on your main line, and recovered your focus 3 times."
- "Even with limited energy today, you still left visible growth evidence."

Recommended supporting cards:
- `今日投入`
- `今日推进`
- `今日状态` or `今日节奏`

Notes:
- This module should not feel like a warning panel.
- It should help users feel that effort, recovery, and continuity all count.

### 2. Growth Pulse

Purpose: create long-term growth meaning.

Charts:
- `成长曲线`
- `成长热力图`

Growth curve:
- main line shows effective investment: `focus_in_class + focus_out_class`
- entertainment is shown as a soft comparison layer, not mixed into the main growth line
- time ranges should support at least `7d / 30d`

Growth heatmap:
- visualize the last 30 to 90 days
- each day reflects whether the user left growth evidence
- use the current warm Level Up palette instead of a harsh productivity style

Why this matters:
- the curve shows movement
- the heatmap shows continuity
- together they create a strong sense of momentum

### 3. Growth Structure

Purpose: answer "how am I growing?" rather than only "did I grow?"

Charts:
- `时间结构图`
- `稳定性条带图`

Time structure chart:
- replace the current pie chart as the main structural view
- show in-class focus, out-of-class focus, and entertainment in a stacked daily or weekly view
- support study-day and rest-day comparisons later if useful

Stability strip:
- show the last 14 to 21 days
- each day indicates whether the user met their own personal growth baseline
- baseline should not be a harsh KPI; it should mean "left growth evidence"

Why this matters:
- users should see not only volume but also rhythm and consistency

### 4. Growth Assets

Purpose: create a sense of accumulation and distance traveled.

Recommended cards:
- `连续成长天数`
- `累计有效投入`
- `累计记录天数`
- optional advanced cards when enabled, such as `习惯打卡活跃度` or `突破日次数`

Important:
- `回归次数` should not be a hero asset card
- it is a contextual process signal, not a universal achievement metric

### 5. Growth Memory

Purpose: turn history into narrative evidence rather than a flat archive.

Content:
- `今天最重要的一步`
- `最近一次突破`
- `最近一次低状态但仍然稳住`
- recent notes and summaries

This module should feel like a growth archive, not a log dump.

## Data Model

The redesigned system should separate data into four layers.

### 1. Core Behavior Layer

Applies to nearly all users and should be enabled by default.

Fields:
- `focus_in_class`
- `focus_out_class`
- `entertainment`
- `day_type`
- `note`

### 2. Recovery / Process Layer

Fields:
- `return_count`

Interpretation:
- this is not a score
- low count does not automatically mean bad
- high count does not automatically mean good
- it must be interpreted together with effective focus and context

### 3. Advanced Growth Layer

These are opt-in modules managed from settings.

Fields:
- `habit_checkin_count`
- `progress_level`
- `progress_note`
- `state_label`

User-facing language:
- `habit_checkin_count` should be shown as `习惯打卡数`

`progress_level` options:
- `靠近了一点`
- `推进明显`
- `有突破`

`progress_note`:
- one short sentence describing the most important step taken that day

`state_label` options:
- `恢复中`
- `稳住了`
- `状态不错`
- `很有能量`

### 4. Preferences Layer

User settings determine which advanced modules are enabled.

Recommended preferences:
- `enable_habit_checkins`
- `enable_progress_tracking`
- `enable_state_tracking`

## Metric Interpretation Model

The page should not compute a single total growth score.

Instead, it should interpret growth through five dimensions:
- `投入`
- `推进`
- `稳定`
- `积累`
- `恢复`

Interpretation rules:
- investment is usually monotonic: more can be better
- accumulation is usually monotonic: more stable can be better
- progress is usually monotonic: clearer advancement can be better
- recovery is contextual and must not be framed as a pure "higher is better" metric
- state provides context and should not be used as judgment

## Optional Tracking Model

The system should support two usage modes.

### Base Mode

Available by default:
- effective focus time
- entertainment time
- streak / recorded days
- growth curve
- growth heatmap
- growth assets

### Advanced Mode

Enabled from settings:
- `习惯打卡数`
- `主线推进`
- `今天最重要的一步`
- `状态标签`

Behavior:
- the analysis page should render only enabled advanced modules
- the daily entry form should reveal optional fields only when the corresponding setting is enabled

## Visual and UX Direction

The redesign must stay inside the existing Level Up visual system.

Requirements:
- keep the current typography family: `Sora`, `Lexend`, `DM Mono`
- keep existing layout rhythm and card grammar
- use the current warm palette: coral, sage, honey, sky
- preserve the lightweight and encouraging emotional tone of the home page
- avoid generic admin-dashboard styling

Implementation note:
- because this is a substantial frontend redesign, the `frontend-design` skill must be used during implementation
- the purpose of that skill here is to extend the existing Level Up style, not replace it

## Field and Module Mapping

### Today Growth Echo

Data:
- `focus_in_class`
- `focus_out_class`
- `return_count`
- `progress_level` when enabled
- `progress_note` when enabled
- `state_label` when enabled

Output:
- one narrative sentence
- compact supporting cards

### Growth Curve

Data:
- effective focus = `focus_in_class + focus_out_class`
- comparison layer = `entertainment`

### Growth Heatmap

Data:
- whether the user left growth evidence on a given day

Suggested growth evidence definition:
- any effective focus, or
- a progress level was recorded, or
- a habit check-in was recorded

### Time Structure

Data:
- `focus_in_class`
- `focus_out_class`
- `entertainment`

### Stability Strip

Data:
- daily growth evidence baseline over 14 to 21 days

### Growth Assets

Data:
- streak
- total effective hours
- total recorded days
- optional advanced asset summaries when enabled

### Growth Memory

Data:
- `progress_note`
- `progress_level`
- `state_label`
- `note`

## Technical Scope

This redesign should be treated as one coordinated milestone, not as a thin partial upgrade.

Work packages:

1. Semantics and data model
   - rename user-facing `iBetter` copy to `习惯打卡数`
   - add advanced tracking fields
   - define data compatibility strategy for existing records

2. Settings integration
   - add growth tracking toggles
   - control form fields and analysis modules through preferences

3. Analysis page redesign
   - replace the current shallow layout with the five-module structure
   - rebuild charts around growth meaning instead of raw reporting

4. Language and validation
   - update copy to reflect growth-supportive language
   - verify partial-data, empty-state, and settings-driven rendering

## Success Criteria

The redesign is successful if:
- users can immediately tell that today still counts
- users can clearly feel longer-term accumulation
- optional tracking prevents the product from feeling overly demanding
- return count is handled with nuance rather than as a score
- the page looks unmistakably like Level Up

## Implementation Reminder

When implementation starts:
- use the `frontend-design` skill because this is a substantial frontend redesign
- keep remotion work out of scope
- preserve compatibility with existing daily records while migrating semantics
