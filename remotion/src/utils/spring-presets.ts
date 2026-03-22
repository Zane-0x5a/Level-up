import { spring } from "remotion";

// Unified spring configurations for consistent motion language

export const SPRING = {
  /** Slow, graceful reveals — text fading in, gentle transitions */
  GENTLE: { stiffness: 40, damping: 16 },
  /** Crisp UI element entrances — cards, phone frames */
  SNAPPY: { stiffness: 120, damping: 14 },
  /** Bouncy feedback — button presses, counter bumps */
  ELASTIC: { stiffness: 200, damping: 10 },
  /** Weighty objects — orb expansion, large-scale motion */
  HEAVY: { stiffness: 80, damping: 20 },
  /** Quick micro-pops — "+1" floats, badges */
  POP: { stiffness: 300, damping: 12 },
} as const;

export type SpringPreset = (typeof SPRING)[keyof typeof SPRING];

/** Shorthand: spring value with delay, using a preset config */
export const springV = (
  frame: number,
  fps: number,
  delay: number,
  preset: SpringPreset,
  from = 0,
  to = 1,
): number =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    from,
    to,
    config: preset,
  });
