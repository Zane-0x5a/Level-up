[English](README.md) | [中文](README_zh.md)

# Level Up

A personal growth dashboard. Not a new productivity system — a connector for tools I already use.

I track intentions in iBetter, log time in iHour, write notes in flomo. Each does one thing well. Level Up doesn't replace them. It pulls the data together, adds an immersive environment to work in, and makes the patterns visible over time.

## Features

**Home** — A countdown to whatever date you're building toward. Today's focus metrics broken down by category. Sticky notes surfaced at random to keep them from getting buried.

**Focus mode** — Fullscreen environment with your own photos as background. The central element is a return button.

**Analysis** — Daily entry form, focus time by category, weekly trend chart, history drawer with notes.

**Settings** — Background images, audio clips, Flomo webhook URL, custom homepage greetings.

## The return button

Most focus apps measure output. The return button measures something else.

When you notice you've drifted and press it, the count goes up. The goal isn't zero returns — it's the noticing. A session with fifteen returns means you caught yourself fifteen times and chose to come back. That's what attention training actually looks like.

## Design

Ten visual directions before one stuck.

The rejects: Inkstone (dark Eastern aesthetic, readability problems), Aurora (warm but flat), Cosmos (sci-fi, felt borrowed), Void and Nebula (dark mode candidates, parked for later), Liquid Glass (iOS 26 style, too trend-bound), Spectrum (color-coded dashboard), Luma (clean but the purple palette read like every AI product from 2023).

Two made the shortlist. Atelier: Swiss editorial style, strong countdown hover effects that felt genuinely surprising. Porcelain: wabi-sabi aesthetic, terracotta and sage color system with real sophistication. The final design takes color cues from both — warm parchment base, vermillion and coral accents, sage green, honey yellow. No purple. The system is called L-Drift.

## Built with Claude Code

The whole project was developed over four days, from an empty Next.js repo to a deployed app.

**Feb 27** — System design document, Supabase schema, project scaffold.

**Feb 28** — Ten design explorations in parallel, each as a standalone HTML file. The feedback round: purple disqualified (reads as generic AI aesthetic), warm editorial palette from Atelier and Porcelain kept.

**Mar 1** — Full rebuild with L-Drift design system. Focus mode 4-state machine (default → transitioning → immersive → ending). Analysis and settings pages. First Vercel deployment.

**Mar 2** — Mobile adaptation at three breakpoints (640px, 768px, 900px). Bug fixes: int4 overflow in sticky notes ordering (Date.now() in milliseconds exceeds PostgreSQL int4 max ~2.1B), storage bucket name mismatches, home overview reading from the wrong data source.

The design decisions weren't AI output — they were proposals evaluated through iteration. The ten HTML prototypes were things to react to, not things to accept. What emerged came from repeated feedback about what read as too safe, what felt borrowed, what the colors were saying.

## Stack

| | |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Vanilla CSS, L-Drift design system |
| Database | Supabase (PostgreSQL + Storage) |
| Charts | Recharts |
| Deployment | Vercel |
| Fonts | Sora · Lexend · DM Mono |

## Self-host

Fork the repo, set up Supabase, deploy to Vercel.

**Supabase:**

1. Create tables: `daily_records`, `sticky_notes`, `focus_sessions`, `focus_images`, `audio_clips`
2. Disable RLS on all tables (single-user setup)
3. Create two public storage buckets: `focus-images` and `audio-clips`

**Environment variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEFAULT_USER_ID=
```

Add these to Vercel's environment settings. `DEFAULT_USER_ID` is any UUID — use it consistently across all Supabase records.

## License

MIT
