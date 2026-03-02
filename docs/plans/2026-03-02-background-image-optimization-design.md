# Background Image Optimization Design

Date: 2026-03-02

## Problem

1. Settings page loads full-size images in the thumbnail grid — performance overhead for high-res photos
2. Background images are shared across mobile and desktop — horizontal images look bad on mobile, vertical images look bad on desktop

## Decisions

- Thumbnail generation: client-side Canvas API (max 200px), stored in component state only
- Orientation handling: manual device type tagging (mobile / desktop / universal)
- Existing images: default to 'universal' via column default
- Upload UI: device type selector before upload button, state persists in session

## Section 1: Data Model

```sql
ALTER TABLE focus_images
  ADD COLUMN device_type text NOT NULL DEFAULT 'universal'
  CHECK (device_type IN ('mobile', 'desktop', 'universal'));
```

TypeScript:
```ts
type FocusImage = { id: string; file_path: string; device_type: 'mobile' | 'desktop' | 'universal' }
```

## Section 2: Thumbnail Generation

- On settings page load, for each image: load via Image object → draw to Canvas (max 200px) → store data URL in `Map<id, dataURL>` state
- Display data URL in grid; show placeholder while generating
- Original URL unchanged — used by focus mode

## Section 3: Upload UI

- Add device type selector (`通用` / `手机` / `电脑`, default `通用`) before upload button
- `uploadFocusImage(file, deviceType)` — add second parameter, write to `device_type` column

## Section 4: Focus Mode Filtering

```ts
const isMobile = window.matchMedia('(max-width: 768px)').matches
const filtered = images.filter(img =>
  img.device_type === 'universal' ||
  (isMobile ? img.device_type === 'mobile' : img.device_type === 'desktop')
)
// Fallback: if filtered is empty, use all images
const pool = filtered.length > 0 ? filtered : images
```

## Files to Change

- `src/lib/api/focus-images.ts` — add deviceType param to uploadFocusImage, update type
- `src/app/settings/page.tsx` — thumbnail generation, device type selector UI
- `src/components/focus/FocusImmersiveState.tsx` — filtering logic
