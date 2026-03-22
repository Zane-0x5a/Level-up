import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BreathingOrb } from "./BreathingOrb";
import { C, alpha } from "../utils/colors";
import { FONT } from "../utils/fonts";
import { springV, SPRING } from "../utils/spring-presets";

interface Props {
  pressFrame?: number;
}

export const MockReturnButton: React.FC<Props> = ({ pressFrame = 180 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pressed = frame >= pressFrame;
  const pressAge = Math.max(0, frame - pressFrame);

  const count = pressed ? 8 : 7;

  // Press animation: quick scale pulse
  const pressScale = pressed
    ? 1 + 0.15 * Math.max(0, 1 - pressAge / 15)
    : 1;

  // "+1" float up
  const plusOneOpacity = pressed
    ? interpolate(pressAge, [0, 10, 60, 90], [0, 1, 1, 0], { extrapolateRight: "clamp" })
    : 0;
  const plusOneY = pressed
    ? interpolate(pressAge, [0, 90], [0, -60], { extrapolateRight: "clamp" })
    : 0;

  // Counter number spring
  const counterScale = pressed
    ? springV(frame, fps, pressFrame, SPRING.ELASTIC)
    : 1;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: `linear-gradient(180deg, #1a1a2e, #0d0d1a)`,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
    }}>
      {/* Blurred photo placeholder */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${alpha(C.sage, 0.08)}, transparent 70%)`,
      }} />

      {/* Return button */}
      <div style={{ transform: `scale(${pressScale})`, position: "relative" }}>
        <BreathingOrb size={160} color={C.coral} glow={1.2} rate={0.4} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", justifyContent: "center", alignItems: "center",
          fontFamily: FONT, fontSize: 28, fontWeight: 700, color: alpha(C.white, 0.8),
        }}>
          回归
        </div>
      </div>

      {/* "+1" floating */}
      <div style={{
        position: "absolute",
        top: "45%",
        fontFamily: FONT, fontSize: 24, fontWeight: 700,
        color: C.coral,
        opacity: plusOneOpacity,
        transform: `translateY(${plusOneY}px)`,
      }}>
        +1
      </div>

      {/* Counter capsule */}
      <div style={{
        marginTop: 32,
        padding: "8px 24px",
        borderRadius: 20,
        background: alpha(C.white, 0.1),
        backdropFilter: "blur(8px)",
      }}>
        <span style={{
          fontFamily: FONT, fontSize: 20, fontWeight: 700,
          color: C.sage,
          display: "inline-block",
          transform: `scale(${counterScale})`,
        }}>
          {count}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 16, color: alpha(C.white, 0.6), marginLeft: 8 }}>
          次回归
        </span>
      </div>
    </div>
  );
};
