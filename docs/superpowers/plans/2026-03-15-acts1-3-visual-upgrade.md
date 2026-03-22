# Acts 1-3 Visual Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the MasterOrb from a pasted-on Lottie circle into a living light source that fuses with its environment, following a text-first visual hierarchy in Acts 1-2 and a bloom-dissolution climax in Act 3.

**Architecture:** 5-layer compositing (environmental light → bloom halo → canvas particles → masked Lottie → vignette). The orb's brightness/bloom/particles follow a strict hierarchy curve that keeps text as the visual star in Acts 1-2. The Act 3 burst is driven by bloom expansion and mask dissolution — the sphere loses its form and becomes diffused light, rather than a circle scaling up.

**Tech Stack:** Remotion 4.0.431, @remotion/lottie, React, CSS radial-gradient masks, CSS filters, Canvas 2D particles.

**Spec:** `docs/superpowers/specs/2026-03-15-acts1-3-visual-upgrade.md`

---

## File Map

| File | Responsibility | Action |
|---|---|---|
| `src/components/CinematicBackground.tsx` | Animated gradient background + environmental light | Modify: add `lightSource` prop |
| `src/components/MasterOrb.tsx` | 5-layer orb compositing, visual hierarchy, dissolution | Rewrite |
| `src/scenes/Act1_Trigger.tsx` | Act 1 scene (text + background) | Modify: add vignette |
| `src/scenes/Act2_Resonance.tsx` | Act 2 scene (text + background) | Modify: add vignette |
| `src/scenes/Act3_Turning.tsx` | Act 3 scene (text + background + flash + ripples) | Modify: add vignette, adjust flash, add ripple color shift |
| `src/utils/colors.ts` | Color utilities | Modify: add `lerpHex` for hex-to-hex interpolation |

**Note:** Task 2 (CinematicBackground `lightSource` prop) is implemented as infrastructure but NOT wired to Act scenes. MasterOrb renders its own environmental light layer (Layer 1) directly. If visual verification shows this is insufficient, a follow-up task can wire `lightSource` through to Act scenes via React context — but this is deferred to avoid the Sequence frame-reset complexity.

---

## Chunk 1: Foundation Changes

### Task 1: Add `lerpHex` to color utilities

`lerpColor` returns `rgb()` strings, but CanvasParticles needs hex input. Add a hex-returning variant.

**Files:**
- Modify: `src/utils/colors.ts`

- [ ] **Step 1: Add `lerpHex` function**

```ts
/** Linear interpolation between two hex colors. Returns hex string. */
export const lerpHex = (hex1: string, hex2: string, t: number): string => {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd remotion && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/colors.ts
git commit -m "feat: add lerpHex for hex-to-hex color interpolation"
```

---

### Task 2: Add `lightSource` prop to CinematicBackground

The background needs to respond to the orb's position by rendering an additional radial gradient anchored at the light source.

**Files:**
- Modify: `src/components/CinematicBackground.tsx`

- [ ] **Step 1: Add lightSource to the Props interface**

```ts
interface LightSource {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Light color as hex */
  color: string;
  /** Light intensity (0-1) */
  intensity: number;
}

interface Props {
  colors: string[];
  baseColor: string;
  speed?: number;
  intensity?: number;
  /** Optional light source that creates an environmental glow anchored to a position */
  lightSource?: LightSource;
}
```

- [ ] **Step 2: Render the light source gradient**

In the component body, after computing `gradients`, add:

```ts
const lightGradient = lightSource && lightSource.intensity > 0.001
  ? `radial-gradient(500px at ${lightSource.x}% ${lightSource.y}%, ${alpha(lightSource.color, lightSource.intensity)}, transparent)`
  : null;

const allGradients = [
  ...(lightGradient ? [lightGradient] : []),
  ...gradients,
].join(", ");
```

Update the return JSX to use `allGradients`:

```tsx
background: `${allGradients}, ${baseColor}`,
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd remotion && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/CinematicBackground.tsx
git commit -m "feat: add lightSource prop to CinematicBackground"
```

---

### Task 3: Add vignette overlay to Acts 1, 2, and 3

Each Act scene gets a dark-edge vignette as the last visual layer (before GrainOverlay).

**Files:**
- Modify: `src/scenes/Act1_Trigger.tsx`
- Modify: `src/scenes/Act2_Resonance.tsx`
- Modify: `src/scenes/Act3_Turning.tsx`

- [ ] **Step 1: Add vignette to Act1_Trigger.tsx**

Before `<GrainOverlay>`, add:

```tsx
{/* Vignette — darken edges, draw eye to center */}
<AbsoluteFill
  style={{
    background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)",
    pointerEvents: "none",
  }}
/>
```

- [ ] **Step 2: Add same vignette to Act2_Resonance.tsx**

Same code, placed before `<GrainOverlay>`.

- [ ] **Step 3: Add vignette to Act3_Turning.tsx + adjust flash**

Add vignette before `<GrainOverlay>`. Also update the flash interpolation from:

```ts
const flashOpacity = interpolate(frame, [238, 242, 246, 276], [0, 0.7, 0.7, 0], { ... });
```

To:

```ts
const flashOpacity = interpolate(frame, [239, 241, 245, 260], [0, 0.6, 0.6, 0], { ... });
```

This makes the flash 4 frames at peak 0.6 (frames 241-245), then 15 frames of decay.

Also update the ripple ring colors to shift cold→warm during the burst. Replace the static `colors` array:

```ts
const rippleWarmth = interpolate(frame, [240, 380], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const rippleColors = [
  lerpHex("#b4c3dc", C.coral, rippleWarmth),
  lerpHex("#8ba4c0", C.sage, rippleWarmth),
  lerpHex("#a0b0d0", C.honey, rippleWarmth),
];
```

This requires importing `lerpHex` from `../utils/colors` in Act3_Turning.tsx.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd remotion && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/scenes/Act1_Trigger.tsx src/scenes/Act2_Resonance.tsx src/scenes/Act3_Turning.tsx
git commit -m "feat: add vignette overlay to Acts 1-3, soften Act3 flash"
```

---

## Chunk 2: MasterOrb Rewrite

### Task 4: Rewrite MasterOrb with 5-layer compositing

This is the core change. Complete rewrite of `src/components/MasterOrb.tsx`.

**Files:**
- Rewrite: `src/components/MasterOrb.tsx`

- [ ] **Step 1: Write the complete new MasterOrb**

The new component implements 5 layers in this render order:

1. **Environmental light** — passed to parent via CinematicBackground's `lightSource` prop (MasterOrb exports position/color/intensity for parent to consume; but since MasterOrb is rendered in LevelUpPromo.tsx, not inside Act scenes, we emit this as a separate `<div>` with a large radial gradient)
2. **Bloom halo** — large blurred div behind Lottie
3. **Canvas particles** — existing CanvasParticles
4. **Lottie core** — masked, filtered, breathing
5. **Vignette** — handled by Act scenes (Task 3), not MasterOrb

Key behavioral changes from current code:
- **Brightness curve**: follows spec Section 2 hierarchy (much dimmer in Acts 1-2)
- **Bloom**: new layer, grows from `displaySize*3` to `displaySize*15` during burst
- **Mask**: `mask-image` on Lottie container, dissolves during burst
- **No burstScale on Lottie**: Lottie scales max 1→1.3. Bloom expansion replaces the old 1→40 circle scaling.
- **Particle count**: matches spec Section 2 (0 in Act1, 5-10 early Act2, etc.)
- **Particle color**: interpolates from `#c0c8e8` to `#e8c0b0` using `lerpHex`

```tsx
import React, { useCallback, useEffect, useState } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, staticFile, AbsoluteFill } from "remotion";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { CanvasParticles } from "./CanvasParticles";
import { alpha, lerpHex } from "../utils/colors";

interface Props {
  globalFrame: number;
}

export const MasterOrb: React.FC<Props> = ({ globalFrame }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = globalFrame;
  const t = frame / fps;

  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  const fetchAnimation = useCallback(async () => {
    const res = await fetch(staticFile("lottie/orb.json"));
    const data = await res.json();
    setAnimationData(data);
  }, []);

  useEffect(() => {
    fetchAnimation();
  }, [fetchAnimation]);

  // === POSITION ===
  const orbY = interpolate(frame, [0, 600, 1400, 1500, 1980], [68, 65, 65, 50, 50], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // === SIZE ===
  const baseSize = interpolate(frame, [0, 120, 600, 1400, 1500, 1620], [60, 120, 120, 200, 200, 200], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Lottie scale: max 1.3 during burst (NOT the old 1→40)
  const lottieScale = interpolate(frame, [1500, 1620, 1740], [1, 1, 1.3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // === VISUAL HIERARCHY (spec Section 2) ===
  const orbBrightness = interpolate(
    frame, [0, 120, 600, 1080, 1500, 1620, 1740],
           [0.15, 0.15, 0.3, 0.4, 0.6, 1.0, 1.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const orbOpacity = interpolate(
    frame, [0, 90, 120, 1620, 1740, 1860],
           [0, 0, 0.85, 0.85, 0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // === BLOOM ===
  const bloomOpacity = interpolate(
    frame, [0, 600, 1080, 1500, 1620, 1740, 1860, 1980],
           [0, 0, 0.03, 0.08, 0.15, 0.35, 0.5, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bloomSizeMultiplier = interpolate(
    frame, [0, 1500, 1620, 1740, 1860],
           [3, 3, 5, 10, 15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bloomBlur = interpolate(
    frame, [0, 1620, 1740, 1860],
           [20, 20, 50, 80],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // === MASK DISSOLUTION ===
  // Lottie edge mask: solid center → dissolving during burst
  const maskWhiteStop = interpolate(
    frame, [0, 1620, 1740],
           [25, 25, 5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const maskTransparentStop = interpolate(
    frame, [0, 1620, 1740],
           [65, 65, 30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // === COLOR: cold → warm ===
  const warmth = interpolate(frame, [0, 1500, 1620, 1860], [0, 0, 0.5, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const hueRotate = warmth * 40;
  const saturate = 0.7 + warmth * 1.1;

  const bloomColor = warmth < 0.5
    ? `rgba(180, 195, 220, ${bloomOpacity})`
    : `rgba(${Math.round(180 + warmth * 40)}, ${Math.round(195 - warmth * 25)}, ${Math.round(220 - warmth * 90)}, ${bloomOpacity})`;

  const envLightColor = warmth < 0.5 ? "#b4c3dc" : lerpHex("#b4c3dc", "#dcb496", warmth);
  const envLightIntensity = interpolate(
    frame, [0, 600, 1080, 1500, 1620, 1860],
           [0, 0, 0.02, 0.05, 0.1, 0.25],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // === PARTICLES ===
  const particleCount = Math.floor(interpolate(
    frame, [0, 600, 1080, 1500, 1620],
           [0, 0, 8, 40, 200],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  ));

  const particleBehavior: "orbit" | "converge" | "explode" =
    frame < 1500 ? "orbit" : frame < 1620 ? "converge" : "explode";

  const particleIntensity = interpolate(
    frame, [600, 1080, 1500, 1620],
           [0, 0.2, 0.8, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const particleColor = lerpHex("#c0c8e8", "#e8c0b0", warmth);

  // Breathing scale
  const breathScale = 1 + Math.sin(t * 0.4 * Math.PI * 2) * 0.03;

  // Lottie playback speed
  const lottiePlaybackRate = interpolate(frame, [0, 1500, 1620], [0.6, 0.6, 1.5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // === EARLY RETURNS ===
  if (frame > 1980) return null;

  const displaySize = baseSize;
  const centerXPx = width / 2;
  const centerYPx = (orbY / 100) * height;
  const bloomSize = displaySize * bloomSizeMultiplier;

  // Environmental light radius grows during dissolution
  const envLightRadius = interpolate(
    frame, [0, 1620, 1860],
           [300, 300, 600],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Even when orbOpacity is 0, bloom may still be visible
  const anythingVisible = orbOpacity > 0.01 || bloomOpacity > 0.01;
  if (!anythingVisible) return null;

  return (
    <>
      {/* Layer 1: Environmental light — large soft gradient following orb */}
      {envLightIntensity > 0.005 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{
            position: "absolute",
            left: centerXPx - envLightRadius,
            top: centerYPx - envLightRadius,
            width: envLightRadius * 2,
            height: envLightRadius * 2,
            background: `radial-gradient(circle, ${alpha(envLightColor, envLightIntensity)}, transparent 70%)`,
          }} />
        </AbsoluteFill>
      )}

      {/* Layer 2: Bloom halo */}
      {bloomOpacity > 0.005 && (
        <div style={{
          position: "absolute",
          left: centerXPx - bloomSize / 2,
          top: centerYPx - bloomSize / 2,
          width: bloomSize,
          height: bloomSize,
          background: `radial-gradient(circle, ${bloomColor}, transparent 55%)`,
          filter: `blur(${bloomBlur}px)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Layer 3: Canvas particles */}
      {particleCount > 0 && (
        <CanvasParticles
          count={particleCount}
          centerX={0.5}
          centerY={orbY / 100}
          radius={baseSize * 0.8}
          color={particleColor}
          behavior={particleBehavior}
          intensity={particleIntensity}
          seed={999}
        />
      )}

      {/* Layer 4: Lottie core — masked, filtered, breathing */}
      {orbOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: centerXPx - (displaySize * lottieScale * breathScale) / 2,
            top: centerYPx - (displaySize * lottieScale * breathScale) / 2,
            width: displaySize * lottieScale * breathScale,
            height: displaySize * lottieScale * breathScale,
            opacity: orbOpacity,
            filter: `hue-rotate(${hueRotate}deg) saturate(${saturate}) brightness(${orbBrightness})`,
            WebkitMaskImage: `radial-gradient(circle, white ${maskWhiteStop}%, transparent ${maskTransparentStop}%)`,
            maskImage: `radial-gradient(circle, white ${maskWhiteStop}%, transparent ${maskTransparentStop}%)`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        >
          {animationData && (
            <Lottie
              animationData={animationData}
              style={{ width: "100%", height: "100%" }}
              playbackRate={lottiePlaybackRate}
              loop
            />
          )}
        </div>
      )}
    </>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd remotion && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Visual verification in Studio**

Run: `cd remotion && npx remotion studio`

Check these frames:
- Frame 0-120: Screen nearly black, no visible orb edge
- Frame 300 (Act1 mid): Text is clearly dominant, faint ambient glow below
- Frame 900 (Act2 early): Orb subtly present, text still dominant
- Frame 1400 (Act2 late): Orb gaining presence, bloom barely visible
- Frame 1560 (Act3 hold): Orb clearly visible at center, particles converging
- Frame 1700 (Act3 burst): Lottie dissolving, bloom expanding, no circle-scaling-up
- Frame 1900 (Act3 afterglow): Lottie gone, warm bloom covers screen

- [ ] **Step 4: Commit**

```bash
git add src/components/MasterOrb.tsx
git commit -m "feat: rewrite MasterOrb with 5-layer compositing and bloom dissolution"
```

---

## Chunk 3: Integration & Verification

### Task 5: DEFERRED — Wire lightSource to Act scene backgrounds

> **SKIP this task.** MasterOrb renders its own environmental light as Layer 1 (a positioned radial gradient div). This is sufficient for the visual effect. Wiring `lightSource` through to CinematicBackground inside Sequences is complex (Sequences reset `useCurrentFrame()` to local frames) and would require React context or prop drilling from LevelUpPromo. Defer to a follow-up iteration if visual verification (Task 6) shows the environmental light needs reinforcement.

---

### Task 6: End-to-end visual verification

- [ ] **Step 1: Launch Studio and scrub full Acts 1-3**

Run: `cd remotion && npx remotion studio`

Verify against spec Section 6:
1. Act 1 (0-10s): Text is the visual focus. Orb is a faint suggestion. No hard circular edge.
2. Act 2 (10-25s): Orb gradually visible but never fights text. ~23s orb begins asserting.
3. Act 3 (25-33s): 2s tension → text → orb dissolves (edges melt, glow spreads) → "Level Up" in afterglow. NO circle scaling up.
4. Pause at any Act 1-2 frame: No hard circular edge on the orb.

- [ ] **Step 2: Test render first 5 seconds**

Run: `cd remotion && npx remotion render LevelUpPromo-Vertical --frames=0-300 out/test-act1.mp4`
Expected: Renders without errors. Visual check: dark screen with faint ambient glow, text appears.

- [ ] **Step 3: Commit final state**

```bash
git add src/components/MasterOrb.tsx src/components/CinematicBackground.tsx src/scenes/Act1_Trigger.tsx src/scenes/Act2_Resonance.tsx src/scenes/Act3_Turning.tsx src/utils/colors.ts
git commit -m "feat: Acts 1-3 visual upgrade complete — 5-layer orb compositing with bloom dissolution"
```
