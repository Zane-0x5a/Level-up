import React from "react";
import { alpha } from "../utils/colors";

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
}

/**
 * CSS-only phone device frame with bezel, dynamic island, and glass reflection.
 */
export const DeviceFrame: React.FC<Props> = ({ width, height, children }) => {
  const bezel = 12;
  const innerRadius = 40;
  const outerRadius = 48;
  const notchWidth = 120;
  const notchHeight = 28;

  return (
    <div
      style={{
        position: "relative",
        width: width + bezel * 2,
        height: height + bezel * 2,
        borderRadius: outerRadius,
        background: "linear-gradient(145deg, #2a2a2e, #1a1a1e)",
        border: "3px solid rgba(255,255,255,0.08)",
        boxShadow: [
          "0 20px 80px rgba(0,0,0,0.3)",
          "0 4px 20px rgba(0,0,0,0.2)",
          "inset 0 1px 0 rgba(255,255,255,0.05)",
        ].join(", "),
        padding: bezel,
      }}
    >
      {/* Dynamic island / notch */}
      <div
        style={{
          position: "absolute",
          top: bezel + 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: notchWidth,
          height: notchHeight,
          borderRadius: notchHeight / 2,
          background: "#000",
          zIndex: 10,
        }}
      />

      {/* Screen area */}
      <div
        style={{
          width,
          height,
          borderRadius: innerRadius,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}

        {/* Glass reflection overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: innerRadius,
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};
