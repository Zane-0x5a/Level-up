import React from "react";
import { AbsoluteFill } from "remotion";

interface Props {
  opacity?: number;
  seed?: number;
}

/**
 * Full-screen SVG film grain overlay using feTurbulence.
 * Place as the LAST child in a scene (on top of everything).
 */
export const GrainOverlay: React.FC<Props> = ({ opacity = 0.04, seed = 1 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id={`grain-${seed}`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves={4}
          seed={seed}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
    </svg>
  </AbsoluteFill>
);
