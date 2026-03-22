import React, { useRef, useEffect } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { alpha } from "../utils/colors";

export type ParticleBehavior = "orbit" | "scatter" | "converge" | "explode";

interface Props {
  /** Number of particles */
  count: number;
  /** Center position as fraction of canvas (0-1) */
  centerX?: number;
  centerY?: number;
  /** Orbit/scatter radius in pixels */
  radius?: number;
  /** Particle color (hex) */
  color: string;
  /** Animation behavior */
  behavior: ParticleBehavior;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** PRNG seed for deterministic rendering */
  seed?: number;
  /** Canvas dimensions (defaults to video size) */
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/** Seeded PRNG — deterministic for Remotion rendering */
const createPRNG = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

interface Particle {
  angle: number;
  baseRadius: number;
  speed: number;
  phase: number;
  size: number;
  baseAlpha: number;
  radiusVar: number;
}

const initParticles = (count: number, seed: number, radius: number): Particle[] => {
  const rng = createPRNG(seed);
  return Array.from({ length: count }, () => ({
    angle: rng() * Math.PI * 2,
    baseRadius: radius * (0.3 + rng() * 0.7),
    speed: 0.2 + rng() * 0.8,
    phase: rng() * Math.PI * 2,
    size: 1 + rng() * 2,
    baseAlpha: 0.15 + rng() * 0.45,
    radiusVar: 0.3 + rng() * 0.7,
  }));
};

export const CanvasParticles: React.FC<Props> = ({
  count,
  centerX = 0.5,
  centerY = 0.5,
  radius = 80,
  color,
  behavior,
  intensity = 1,
  seed = 42,
  width: propWidth,
  height: propHeight,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const w = propWidth ?? videoWidth;
  const h = propHeight ?? videoHeight;
  const t = frame / fps;
  const cx = w * centerX;
  const cy = h * centerY;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    const particles = initParticles(count, seed, radius);

    // Parse color once
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    for (const p of particles) {
      let x: number, y: number, a: number;

      switch (behavior) {
        case "orbit": {
          const angle = p.angle + t * p.speed * 0.5;
          const r2 = p.baseRadius * (1 + Math.sin(t * p.speed + p.phase) * p.radiusVar * 0.3);
          x = cx + Math.cos(angle) * r2 * intensity;
          y = cy + Math.sin(angle) * r2 * intensity;
          a = p.baseAlpha * intensity;
          break;
        }
        case "scatter": {
          const angle = p.angle + t * p.speed * 0.1;
          const drift = p.baseRadius + t * p.speed * 15 * intensity;
          x = cx + Math.cos(angle) * drift;
          y = cy + Math.sin(angle) * drift;
          a = p.baseAlpha * Math.max(0, 1 - (drift / (radius * 4)));
          break;
        }
        case "converge": {
          const convergeFactor = Math.max(0, 1 - t * p.speed * 0.3 * intensity);
          const angle = p.angle + t * p.speed * 0.3;
          x = cx + Math.cos(angle) * p.baseRadius * convergeFactor;
          y = cy + Math.sin(angle) * p.baseRadius * convergeFactor;
          a = p.baseAlpha * (1.2 - convergeFactor * 0.5);
          break;
        }
        case "explode": {
          const expandRate = t * p.speed * 80 * intensity;
          const angle = p.angle;
          x = cx + Math.cos(angle) * (expandRate + p.baseRadius * 0.2);
          y = cy + Math.sin(angle) * (expandRate + p.baseRadius * 0.2);
          a = p.baseAlpha * Math.max(0, 1 - expandRate / (radius * 8));
          break;
        }
      }

      // Skip off-screen particles
      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;
      if (a <= 0.01) continue;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a)})`;

      // Glow on larger particles
      if (p.size > 1.5) {
        ctx.shadowBlur = p.size * 4;
        ctx.shadowColor = `rgba(${r},${g},${b},${a * 0.5})`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fill();
    }
  });

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};
