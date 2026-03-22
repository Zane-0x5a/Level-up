import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, alpha } from "../utils/colors";
import { FONT } from "../utils/fonts";
import { springV, SPRING } from "../utils/spring-presets";

export const MockHomePage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = (delay: number) => springV(frame, fps, delay, SPRING.SNAPPY);

  const s1 = cardSpring(0);
  const s2 = cardSpring(15);
  const s3 = cardSpring(30);

  return (
    <div style={{
      width: "100%", height: "100%",
      background: C.bg,
      padding: "80px 40px",
      fontFamily: FONT,
      display: "flex", flexDirection: "column", gap: 24,
    }}>
      {/* Hero row */}
      <div style={{ opacity: s1, transform: `translateY(${(1 - s1) * 20}px)` }}>
        <div style={{ fontSize: 16, color: C.muted }}>2026年3月14日 · 周六</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.charcoal, marginTop: 8 }}>
          又是充实的一天
        </div>
        <div style={{
          marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20,
          background: alpha(C.sage, 0.1),
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.sage }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.sage }}>第 42 天</span>
        </div>
      </div>

      {/* Countdown */}
      <div style={{
        background: C.white, borderRadius: 20, padding: 24,
        boxShadow: `0 4px 24px ${alpha(C.coral, 0.06)}`,
        opacity: s1, transform: `translateY(${(1 - s1) * 20}px)`,
      }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: C.coral, textAlign: "center" }}>23</div>
        <div style={{ fontSize: 14, color: C.muted, textAlign: "center" }}>距离期末</div>
      </div>

      {/* Progress cards */}
      <div style={{
        display: "flex", gap: 12,
        opacity: s2, transform: `translateY(${(1 - s2) * 20}px)`,
      }}>
        {[
          { label: "课内", val: "2.5h", color: C.sage },
          { label: "课外", val: "1.8h", color: C.coral },
          { label: "回归", val: "8次", color: C.honey },
        ].map((c, i) => (
          <div key={i} style={{
            flex: 1, padding: 16, background: C.white, borderRadius: 14, textAlign: "center",
            boxShadow: `0 2px 12px ${alpha(c.color, 0.08)}`,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Sticky note */}
      <div style={{
        background: C.white, borderRadius: 16, padding: 20,
        boxShadow: `0 2px 12px ${alpha(C.honey, 0.08)}`,
        opacity: s3, transform: `translateY(${(1 - s3) * 20}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.honey }} />
          <span style={{ fontSize: 15, color: C.charcoal }}>享受过程，结果是附赠品</span>
        </div>
      </div>
    </div>
  );
};
