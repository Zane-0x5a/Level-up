# Acts 1-3 Visual Upgrade: Orb Compositing & Atmosphere

## Context

The MasterOrb (Lottie core) is integrated but looks "pasted on" — hard circular edge, no environmental interaction, no atmospheric depth. The orb needs to fuse with the scene as a living light source. Additionally, the orb must not overpower text in Acts 1-2; it transitions from atmospheric backdrop to protagonist only in Act 3.

This spec covers the first 33 seconds (Acts 1-3, frames 0-1980).

---

## 1. MasterOrb Compositing: 5-Layer Structure

Render order (bottom to top):

### Layer 1: Environmental Light
- A radial gradient on the CinematicBackground, centered at the orb's current `(centerX, centerY)` position
- Moves with the orb as it drifts from Y=68% to Y=50%
- Color: cool blue-white `rgba(180,195,220, opacity)` in Acts 1-2, transitioning to warm `rgba(220,180,150, opacity)` in Act 3
- Opacity governed by the visual hierarchy curve (see Section 2)
- Radius: ~400-600px, very soft falloff

### Layer 2: Bloom Halo
- A div behind the Lottie, same center position
- Size: `displaySize * 3` (grows during burst)
- Background: `radial-gradient(circle, rgba(lightColor, bloomOpacity), transparent 55%)`
- `filter: blur(20px)` (increases during burst)
- This layer is what creates the "light illuminating the air" effect

### Layer 3: Canvas Particles
- Existing CanvasParticles system, unchanged in structure
- Color shifts from cool `#c0c8e8` to warm `#e8c0b0` during Act 3
- Behavior: orbit → converge → explode (as designed)

### Layer 4: Lottie Core
- The Circle Lottie animation
- **Edge mask**: `mask-image: radial-gradient(circle, white 25%, transparent 65%)` — softens the hard boundary
- CSS filters for color control: `hue-rotate()`, `saturate()`, `brightness()`
- Breathing scale: `scale(1 + sin(t * 0.4π) * 0.03)` for subtle volume pulsation

### Layer 5: Vignette (global overlay on Acts 1-3)
- `radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)`
- Draws eye to center, adds cinematic depth
- Applied as an AbsoluteFill overlay in each Act scene, or as part of MasterOrb

---

## 2. Visual Hierarchy: Text-First, Then Orb

The orb's visibility follows this curve to avoid competing with text:

| Phase | Global Frames | Orb Brightness | Bloom Opacity | Particles | Role |
|---|---|---|---|---|---|
| Act1 | 0-600 | 0.15→0.3 | 0 (off) | 0 | Barely visible ambient hint |
| Act2 early | 600-1080 | 0.3→0.4 | 0.03 | 5-10 | Background element, noticed but not distracting |
| Act2 late | 1080-1500 | 0.4→0.6 | 0.03→0.08 | 10→40 | Gaining presence as text fades |
| Act3 hold | 1500-1620 | 0.6→1.0 | 0.08→0.15 | 40→120 converge | Building tension |
| Act3 burst | 1620-1860 | 1.0→1.6 | 0.15→0.5+ | 200+ explode | Protagonist, fills screen |
| Act3 fade | 1860-1980 | fading | bloom IS the bg | scattered | Light becomes the world |

---

## 3. Act 3 Burst: Sphere Dissolves Into Light

The climax is NOT "a circle scaling up to fill the screen." It is the sphere **losing its form and becoming diffused light** — 球体化为光晕.

### Frame-by-frame choreography (Act3 local frames):

**Beat 1: Silence (0-120f, 2s)**
- Orb at center, motionless
- Particles converge from all directions, accelerating
- Brightness creeping up to 1.0
- Background completely still — contrast before the storm

**Beat 2: Text arrives (120-240f, 2s)**
- "如果你的每一次努力 / 都被记住了呢？" appears char-by-char
- Orb begins subtle expansion: scale 1→1.3 (NOT dramatic)
- Bloom layer starts growing: 3x→5x displaySize
- Particles converge faster, density peaks

**Beat 3: Dissolution (240-380f, ~2.3s)**
- White flash: 4 frames, peak opacity 0.6
- **Lottie mask dissolves**: `white 25%, transparent 65%` → `white 5%, transparent 30%` (center starts showing through)
- **Lottie opacity fades**: 0.85→0 over 120 frames
- **Bloom takes over**: size 5x→15x, blur 20→80px, opacity 0.15→0.5
- **Environmental light floods**: covers full screen, transitioning from cool to warm
- Particles explode outward
- Ripple rings expand (color shifting cold→warm)
- The viewer perceives ONE continuous transformation: solid sphere → dissolving edges → formless glow → warm atmosphere

**Beat 4: Afterglow + Level Up (380-480f, ~1.5s)**
- Lottie is gone (opacity=0). Bloom has merged with the warm background.
- The entire screen IS the orb's light now — warm, bright, #faf8f5 base with soft warm gradients
- "Level Up" text appears with gradient fill (coral→honey)
- Particles have scattered beyond screen edges
- Peaceful warmth

---

## 4. Color Narrative

### Cold phase (Acts 1-2, frames 0-1500)
- Orb: original pearl/iridescent Lottie, `saturate(0.7)`, `brightness(low)`
- Bloom color: `rgba(180, 195, 220, x)` — cool blue-white
- Particle color: `#c0c8e8` — icy blue-gray
- Background: deep navy `#0d0d1a` → `#151530`

### Transition (Act 3 burst, frames 1620-1860)
- Orb: `hue-rotate(0→40deg)`, `saturate(0.7→1.8)`, `brightness(1.0→1.6)`
- Bloom color: interpolates from `rgba(180,195,220)` to `rgba(220,170,130)`
- Particle color: `#c0c8e8` → `#e8c0b0`
- Background: `rgb(21,21,48)` → `rgb(250,248,245)` (the warm bg color)

### Warm phase (Act 3 afterglow, frames 1860-1980)
- Orb: dissolved, gone
- Bloom: merged with background, indistinguishable
- Background: warm cream `#faf8f5` with soft coral/honey gradients

---

## 5. Files to Modify

| File | Changes |
|---|---|
| `src/components/MasterOrb.tsx` | Complete rewrite: 5-layer compositing, mask dissolution, bloom-driven burst (replace old burstScale circle-scaling with bloom expansion), visual hierarchy curve |
| `src/components/CinematicBackground.tsx` | Add optional `lightSource: {x: number, y: number, color: string, intensity: number}` prop — renders an additional `radial-gradient` centered at (x,y) with the given color/intensity |
| `src/scenes/Act1_Trigger.tsx` | Add vignette overlay |
| `src/scenes/Act2_Resonance.tsx` | Add vignette overlay |
| `src/scenes/Act3_Turning.tsx` | Add vignette overlay, adjust flash to 4 frames at 0.6 peak (shorter/softer than current 38 frames at 0.7) |

No new files needed. No new packages needed.

### Implementation notes
- **Vignette**: Apply in each Act scene (not MasterOrb), since MasterOrb returns null at start and end
- **Particle color interpolation**: Compute interpolated hex in MasterOrb per-frame, pass as single `color` prop to CanvasParticles (no need to change CanvasParticles interface)
- **Particle count curve**: Replaces the current ramp in MasterOrb entirely (see Section 2 table)

---

## 6. Verification

In Remotion Studio:
1. **Act 1 scrub (0-10s)**: Text is clearly the visual focus. Orb is a faint suggestion in the lower screen. No hard circular edge visible.
2. **Act 2 scrub (10-25s)**: Orb gradually becomes noticeable but never fights the text for attention. At ~23s, as text fades, orb begins to assert itself.
3. **Act 3 scrub (25-33s)**: 2s of tension. Text appears. Then the orb dissolves — its edges melt, glow spreads, the entire screen warms. "Level Up" appears in the afterglow. At no point does a circle scale up to fill the screen.
4. **Pause at any frame in Acts 1-2**: No hard circular edge visible on the orb. It blends smoothly into the dark background.
