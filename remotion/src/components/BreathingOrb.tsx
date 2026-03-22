import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { alpha } from "../utils/colors";

interface Props {
  size: number;
  color: string;
  glow?: number;
  rate?: number;
  paused?: boolean;
  opacity?: number;
  style?: React.CSSProperties;
}

export const BreathingOrb: React.FC<Props> = ({
  size,
  color,
  glow = 1,
  rate = 0.5,
  paused = false,
  opacity: baseOpacity,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const breath = paused ? 1 : Math.sin(t * rate * Math.PI * 2) * 0.5 + 0.5;

  const scale = 1 + breath * 0.08;
  const opac = baseOpacity ?? 0.6 + breath * 0.4;

  // Layered glow for volumetric feel
  const innerSpread = size * 0.2 * glow * (0.8 + breath * 0.2);
  const midSpread = size * 0.4 * glow * (0.7 + breath * 0.3);
  const outerSpread = size * 0.7 * glow * (0.6 + breath * 0.4);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        // Multi-layer radial gradient: bright core → mid ring → outer haze
        background: `
          radial-gradient(circle at 40% 38%, ${alpha(color, 0.6)} 0%, transparent 40%),
          radial-gradient(circle, ${alpha(color, 0.35)} 0%, ${alpha(color, 0.15)} 50%, transparent 70%),
          radial-gradient(circle, ${alpha(color, 0.1)} 0%, transparent 100%)
        `,
        // 3-layer box-shadow for depth
        boxShadow: [
          `0 0 ${innerSpread}px ${alpha(color, opac * 0.5)}`,
          `0 0 ${midSpread}px ${alpha(color, opac * 0.3)}`,
          `0 0 ${outerSpread}px ${alpha(color, opac * 0.15)}`,
        ].join(", "),
        transform: `scale(${scale})`,
        ...style,
      }}
    />
  );
};
