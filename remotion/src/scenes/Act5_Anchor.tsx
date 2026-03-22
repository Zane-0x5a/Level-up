import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BreathingOrb } from "../components/BreathingOrb";
import { AnimatedText } from "../components/AnimatedText";
import { CinematicBackground } from "../components/CinematicBackground";
import { GrainOverlay } from "../components/GrainOverlay";
import { C, alpha } from "../utils/colors";
import { FONT } from "../utils/fonts";
import { springV, SPRING } from "../utils/spring-presets";

// 1200 frames (20s @ 60fps)
// Segment A: 0-360f (0-6s) — community orbs
// Segment B: 360-660f (6-11s) — science anchor
// Segment C: 660-1200f (11-20s) — CTA

const COMMUNITY_ORBS = [
  { color: C.sage, size: 40, x: -120, y: -80, delay: 30, rate: 0.35 },
  { color: C.honey, size: 28, x: 140, y: -40, delay: 50, rate: 0.45 },
  { color: C.coral, size: 35, x: -80, y: 100, delay: 70, rate: 0.3 },
  { color: C.sage, size: 24, x: 100, y: 120, delay: 90, rate: 0.5 },
  { color: C.honey, size: 32, x: -160, y: 40, delay: 110, rate: 0.4 },
  { color: C.coral, size: 26, x: 170, y: -100, delay: 130, rate: 0.35 },
];

export const Act5_Anchor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Segment A: community
  const communityTextOpacity = interpolate(frame, [60, 80, 320, 360], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Segment B: science
  const scienceOpacity = interpolate(frame, [360, 390, 620, 660], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Segment C: CTA
  const sloganScale = springV(frame, fps, 660, SPRING.HEAVY);
  const sloganOpacity = interpolate(frame, [660, 690], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const inviteOpacity = interpolate(frame, [780, 810], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const filterOpacity = interpolate(frame, [870, 900], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Final dim: last 120 frames (2s)
  const finalDim = interpolate(frame, [1080, 1200], [1, 0.95], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Bokeh transition: orbs become blurred bg after segment A
  const bokehOpacity = interpolate(frame, [320, 400], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const orbsOpacity = interpolate(frame, [320, 400], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Invite code pulse (breathing)
  const pulse = Math.sin((frame / fps) * 1.5 * Math.PI * 2) * 0.5 + 0.5;

  return (
    <AbsoluteFill style={{ opacity: finalDim }}>
      <CinematicBackground
        colors={[C.coral, C.sage, C.honey]}
        baseColor={C.bg}
        speed={0.25}
        intensity={0.05}
      />
      {/* Bokeh background (segments B & C) */}
      <div style={{
        position: "absolute", inset: 0, opacity: bokehOpacity,
        background: `
          radial-gradient(200px at 30% 35%, ${alpha(C.coral, 0.08)}, transparent),
          radial-gradient(150px at 70% 55%, ${alpha(C.sage, 0.06)}, transparent),
          radial-gradient(180px at 50% 75%, ${alpha(C.honey, 0.07)}, transparent)
        `,
      }} />

      {/* Community orbs (segment A) */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", justifyContent: "center", alignItems: "center",
        opacity: orbsOpacity,
      }}>
        {/* Central orb */}
        <BreathingOrb size={80} color={C.coral} glow={1.2} rate={0.4} />

        {/* Surrounding orbs */}
        {COMMUNITY_ORBS.map((orb, i) => {
          const appear = springV(frame, fps, orb.delay, SPRING.GENTLE);
          return (
            <div key={i} style={{
              position: "absolute",
              transform: `translate(${orb.x * appear}px, ${orb.y * appear}px)`,
              opacity: appear,
            }}>
              <BreathingOrb size={orb.size} color={orb.color} glow={0.8} rate={orb.rate} />
            </div>
          );
        })}
      </div>

      {/* Community text */}
      <div style={{
        position: "absolute", bottom: "30%", width: "100%",
        textAlign: "center", opacity: communityTextOpacity,
      }}>
        <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.charcoal, lineHeight: 1.7 }}>
          <div>一个人学很难坚持</div>
          <div>但你<span style={{ color: C.sage }}>不是一个人</span></div>
        </div>
      </div>

      {/* Science anchor (segment B) */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", justifyContent: "center", alignItems: "center",
        opacity: scienceOpacity,
      }}>
        <div style={{ fontFamily: FONT, fontSize: 38, fontWeight: 700, color: C.charcoal, textAlign: "center", lineHeight: 1.7 }}>
          <div>多巴胺不奖励结果</div>
          <div>它奖励<span style={{ color: C.coral }}>「看到进展」</span></div>
        </div>
      </div>

      {/* CTA (segment C) */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        gap: 24,
      }}>
        {/* Slogan */}
        <div style={{
          opacity: sloganOpacity,
          transform: `scale(${0.8 + sloganScale * 0.2})`,
          textAlign: "center",
        }}>
          <AnimatedText
            text="Level Up"
            startFrame={660}
            fadeInDuration={30}
            fontSize={64}
            fontWeight={700}
            gradientColors={[C.coral, C.honey]}
            style={{ letterSpacing: 2 }}
          />
          <div style={{ marginTop: 12 }}>
            <AnimatedText
              text="你的成长，值得被看见"
              startFrame={690}
              fadeInDuration={30}
              fontSize={36}
              fontWeight={700}
              color={C.coral}
              charByChar
              staggerFrames={3}
              glowColor={C.coral}
            />
          </div>
        </div>

        {/* Invite info */}
        <div style={{
          opacity: inviteOpacity,
          padding: "10px 28px",
          borderRadius: 24,
          background: alpha(C.coral, 0.05 + pulse * 0.03),
        }}>
          <span style={{ fontFamily: FONT, fontSize: 18, color: C.coral }}>
            校内邀请制 · 找 [联系方式] 获取邀请码
          </span>
        </div>

        {/* Filter line */}
        <div style={{ opacity: filterOpacity }}>
          <span style={{ fontFamily: FONT, fontSize: 16, color: alpha(C.charcoal, 0.7) }}>
            名额不多。但你看到这里了。
          </span>
        </div>
      </div>

      <GrainOverlay opacity={0.03} seed={5} />
    </AbsoluteFill>
  );
};
