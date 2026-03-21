# Level Up - Codex Instructions

## Product Purpose

Level Up exists to make personal growth visible.
The product should turn daily effort, recovery, and accumulation into a clear felt sense of progress so users are more motivated to continue self-directed learning and self-directed growth.

When making product decisions, prefer designs that strengthen:
- immediate positive feedback: "today was not wasted"
- long-term growth meaning: "I am becoming stronger over time"
- sustainable motivation over judgment, pressure, or KPI-style shame

## Analytics / Growth Tracking

- Treat the analytics system as a growth feedback engine, not a generic dashboard.
- Prefer visualizations that help users feel progress, continuity, recovery, and accumulation.
- Avoid framing every metric as "more is always better"; some metrics, such as return/recovery counts, require contextual interpretation.
- Use product-language that is broadly applicable. Prefer labels like `习惯打卡数` over app-specific labels like `iBetter`.
- Non-core growth fields should be designed as optional advanced tracking modules managed from settings.

## Frontend Workflow

- If a task involves designing or significantly changing a frontend page, layout, or major component system, you must use the `frontend-design` skill before implementation.
- Frontend upgrades must stay visually consistent with Level Up's existing design system and interaction language; do not introduce a disconnected style.

## Repository / Deployment Context

- This project has a GitHub repository and Git history should be treated as the source of truth for app and schema changes.
- The app is deployed on Cloudflare.
- When reasoning about release risk, assume there may be a difference between local preview state, GitHub state, and Cloudflare production state until verified.

## Database Change Discipline

- This project uses Supabase for application data. Database-related changes must be kept in sync across `supabase/schema.sql`, `supabase/migration.sql`, and the application code that reads or writes the changed fields.
- Do not assume a new database table or column already exists remotely just because it exists locally. Verify the remote Supabase state or provide a fallback path until the migration is applied.
- Prefer backward-compatible rollouts for schema changes that affect live pages. If a new preference table or field may be missing remotely, avoid making the whole page fail.
- Before claiming a database-backed feature is fully live, confirm the migration has been applied to the actual Supabase project used by the deployed environment.
- Because deployment happens through GitHub and Cloudflare, be explicit about whether a change is only local, committed to the repo, or actually available in the deployed environment.

## Network / Proxy

When accessing external URLs (GitHub API, web fetches, npm registry, etc.), use the local proxy on port 7897:

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

Always set these environment variables before running commands that require internet access (e.g., `gh`, `curl`, `npm install`, `npx`, `git clone/push/pull`).
