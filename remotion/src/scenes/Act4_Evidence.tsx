import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Sequence } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { DeviceFrame } from "../components/DeviceFrame";
import { MockReturnButton } from "../components/MockReturnButton";
import { MockAnalysisPage } from "../components/MockAnalysisPage";
import { MockHomePage } from "../components/MockHomePage";
import { CinematicBackground } from "../components/CinematicBackground";
import { GrainOverlay } from "../components/GrainOverlay";
import { C } from "../utils/colors";
import { springV, SPRING } from "../utils/spring-presets";

// 1500 frames (25s @ 60fps)
// Segment A: 0-480f (0-8s) — Return button
// Segment B: 480-960f (8-16s) — Analysis page
// Segment C: 960-1500f (16-25s) — Home page

export const Act4_Evidence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneWidth = 480;
  const phoneHeight = 860;

  // --- Segment A: Return Button ---
  const segA_opacity = interpolate(frame, [0, 30, 390, 480], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // 3D perspective: enter from right with slight rotation
  const segA_enter = springV(frame, fps, 0, SPRING.SNAPPY);
  const segA_rotY = interpolate(segA_enter, [0, 1], [-15, 0]);
  const segA_tx = interpolate(segA_enter, [0, 1], [300, 0]);
  // Exit: slide left
  const segA_exitX = interpolate(frame, [390, 480], [0, -400], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // --- Segment B: Analysis Page ---
  const segB_opacity = interpolate(frame, [480, 530, 870, 960], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const segB_enter = springV(frame, fps, 480, SPRING.SNAPPY);
  const segB_rotY = interpolate(segB_enter, [0, 1], [-12, 0]);
  const segB_tx = interpolate(segB_enter, [0, 1], [350, 0]);
  // Subtle tilt during chart animation
  const segB_rotX = interpolate(frame, [580, 700, 900], [0, -2, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // --- Segment C: Home Page ---
  const segC_opacity = interpolate(frame, [960, 1010, 1400, 1500], [0, 1, 1, 0.9], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const segC_enter = springV(frame, fps, 960, SPRING.SNAPPY);
  const segC_rotX = interpolate(segC_enter, [0, 1], [10, 0]);
  const segC_ty = interpolate(segC_enter, [0, 1], [200, 0]);
  // Exit: scale down + tilt back
  const segC_exitScale = interpolate(frame, [1400, 1500], [1, 0.3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const segC_exitRotX = interpolate(frame, [1400, 1500], [0, -5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <CinematicBackground
        colors={[C.coral, C.sage, C.honey]}
        baseColor={C.bg}
        speed={0.2}
        intensity={0.04}
      />

      {/* Segment A: Return Button */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 28,
        opacity: segA_opacity,
        perspective: 1200,
      }}>
        <div style={{
          transform: `translateX(${frame < 390 ? segA_tx : segA_exitX}px) rotateY(${segA_rotY}deg)`,
          transformStyle: "preserve-3d",
        }}>
          <DeviceFrame width={phoneWidth} height={phoneHeight}>
            <Sequence from={0} durationInFrames={480}>
              <MockReturnButton pressFrame={180} />
            </Sequence>
          </DeviceFrame>
        </div>
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <AnimatedText
            text={"每次你把自己拉回来\n这里都记得"}
            startFrame={200}
            fadeInDuration={40}
            fadeOutFrame={370}
            fadeOutDuration={30}
            fontSize={36}
            color={C.charcoal}
          />
        </div>
      </div>

      {/* Segment B: Analysis Page */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 28,
        opacity: segB_opacity,
        perspective: 1200,
      }}>
        <div style={{
          transform: `translateX(${segB_tx}px) rotateY(${segB_rotY}deg) rotateX(${segB_rotX}deg)`,
          transformStyle: "preserve-3d",
        }}>
          <DeviceFrame width={phoneWidth} height={phoneHeight}>
            <Sequence from={480} durationInFrames={480}>
              <MockAnalysisPage />
            </Sequence>
          </DeviceFrame>
        </div>
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <AnimatedText
            text={"你在进步\n这次有据可查"}
            startFrame={580}
            fadeInDuration={40}
            fadeOutFrame={850}
            fadeOutDuration={30}
            fontSize={36}
            color={C.charcoal}
          />
        </div>
      </div>

      {/* Segment C: Home Page */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 28,
        opacity: segC_opacity,
        perspective: 1200,
      }}>
        <div style={{
          transform: `translateY(${segC_ty}px) rotateX(${frame < 1400 ? segC_rotX : segC_exitRotX}deg) scale(${segC_exitScale})`,
          transformStyle: "preserve-3d",
        }}>
          <DeviceFrame width={phoneWidth} height={phoneHeight}>
            <Sequence from={960} durationInFrames={540}>
              <MockHomePage />
            </Sequence>
          </DeviceFrame>
        </div>
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <AnimatedText
            text={"你要去哪里，走了多远\n打开就看到"}
            startFrame={1040}
            fadeInDuration={40}
            fadeOutFrame={1380}
            fadeOutDuration={30}
            fontSize={36}
            color={C.charcoal}
          />
        </div>
      </div>

      <GrainOverlay opacity={0.03} seed={4} />
    </AbsoluteFill>
  );
};
