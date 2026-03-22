import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, fadeOut, slideIn } from "../utils/animations";
import { alpha } from "../utils/colors";
import { FONT } from "../utils/fonts";

interface Props {
  text: string;
  startFrame: number;
  fadeInDuration?: number;
  fadeOutFrame?: number;
  fadeOutDuration?: number;
  slideFrom?: "left" | "right" | "bottom";
  slideDistance?: number;
  slideDuration?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  lineHeight?: number;
  textAlign?: React.CSSProperties["textAlign"];
  style?: React.CSSProperties;
  /** Enable character-by-character animation */
  charByChar?: boolean;
  /** Frames between each character start (default 3) */
  staggerFrames?: number;
  /** Apply multi-layer text-shadow glow (hex color) */
  glowColor?: string;
  /** Apply gradient text fill [startColor, endColor] */
  gradientColors?: [string, string];
}

export const AnimatedText: React.FC<Props> = ({
  text,
  startFrame,
  fadeInDuration = 15,
  fadeOutFrame,
  fadeOutDuration = 15,
  slideFrom,
  slideDistance = 60,
  slideDuration,
  fontSize = 48,
  color = "#ffffff",
  fontWeight = 700,
  lineHeight = 1.6,
  textAlign = "center",
  style,
  charByChar = false,
  staggerFrames = 3,
  glowColor,
  gradientColors,
}) => {
  const frame = useCurrentFrame();

  // Global opacity envelope
  const inOpacity = fadeIn(frame, startFrame, fadeInDuration);
  const outOpacity = fadeOutFrame != null
    ? fadeOut(frame, fadeOutFrame, fadeOutDuration)
    : 1;
  const opacity = Math.min(inOpacity, outOpacity);

  // Slide transform
  let transform = "";
  if (slideFrom) {
    const dur = slideDuration ?? fadeInDuration;
    const dir = slideFrom === "left" ? -1 : slideFrom === "right" ? 1 : 0;
    const yDir = slideFrom === "bottom" ? 1 : 0;
    const x = slideIn(frame, startFrame, dur, slideDistance * dir);
    const y = slideIn(frame, startFrame, dur, slideDistance * yDir);
    transform = `translate(${x}px, ${y}px)`;
  }

  // Glow text-shadow
  const glowShadow = glowColor
    ? [
        `0 0 10px ${alpha(glowColor, 0.4)}`,
        `0 0 30px ${alpha(glowColor, 0.2)}`,
        `0 0 60px ${alpha(glowColor, 0.1)}`,
      ].join(", ")
    : undefined;

  // Gradient text styles
  const gradientStyle: React.CSSProperties = gradientColors
    ? {
        background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : {};

  const baseStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize,
    fontWeight,
    color: gradientColors ? undefined : color,
    lineHeight,
    textAlign,
    opacity: charByChar ? 1 : opacity,
    transform: charByChar ? undefined : transform,
    whiteSpace: "pre-line",
    textShadow: glowShadow,
    ...gradientStyle,
    ...style,
  };

  // Character-by-character mode
  if (charByChar) {
    const lines = text.split("\n");
    let globalCharIndex = 0;

    return (
      <div style={{ ...baseStyle, opacity }}>
        {lines.map((line, lineIdx) => {
          const chars = [...line];
          const charElements = chars.map((char, charIdx) => {
            const charDelay = startFrame + globalCharIndex * staggerFrames;
            const charOpacity = fadeIn(frame, charDelay, Math.max(8, fadeInDuration / 3));
            const charY = slideIn(frame, charDelay, 12, 20);
            globalCharIndex++;
            return (
              <span
                key={`${lineIdx}-${charIdx}`}
                style={{
                  display: "inline-block",
                  opacity: charOpacity,
                  transform: `translateY(${charY}px)`,
                  // Preserve spaces
                  whiteSpace: char === " " ? "pre" : undefined,
                }}
              >
                {char}
              </span>
            );
          });
          return (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {charElements}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      {text}
    </div>
  );
};
