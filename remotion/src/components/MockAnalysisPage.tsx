import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, alpha } from "../utils/colors";
import { FONT } from "../utils/fonts";
import { springV, SPRING } from "../utils/spring-presets";

export const MockAnalysisPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pie chart: sweep angle animation
  const sweep = interpolate(frame, [0, 60], [0, 360], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Line chart: path progress
  const lineProgress = interpolate(frame, [30, 120], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Metric cards stagger
  const cards = [
    { label: "连续", value: "42", unit: "天", color: C.sage, delay: 60 },
    { label: "日均", value: "3.2", unit: "小时", color: C.coral, delay: 75 },
    { label: "回归", value: "36", unit: "次", color: C.honey, delay: 90 },
  ];

  // SVG pie segments
  const segments = [
    { ratio: 0.45, color: C.sage },
    { ratio: 0.30, color: C.coral },
    { ratio: 0.25, color: C.honey },
  ];

  let startAngle = 0;
  const pieRadius = 60;
  const pieSegments = segments.map((seg, i) => {
    const angle = seg.ratio * Math.min(sweep, 360);
    if (angle <= 0) { startAngle += 0; return null; }
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = pieRadius + pieRadius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = pieRadius + pieRadius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = pieRadius + pieRadius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = pieRadius + pieRadius * Math.sin((endAngle * Math.PI) / 180);
    const d = `M${pieRadius},${pieRadius} L${x1},${y1} A${pieRadius},${pieRadius} 0 ${largeArc} 1 ${x2},${y2} Z`;
    startAngle = endAngle;
    return <path key={i} d={d} fill={seg.color} />;
  });

  // Line chart points
  const linePoints = [20, 35, 28, 45, 52, 48, 60, 55, 70, 65, 75];
  const lineWidth = 280;
  const lineHeight = 80;
  const pointsStr = linePoints
    .map((y, i) => {
      const x = (i / (linePoints.length - 1)) * lineWidth;
      const yPos = lineHeight - (y / 80) * lineHeight;
      return `${x},${yPos}`;
    })
    .join(" ");

  return (
    <div style={{
      width: "100%", height: "100%",
      background: C.bg,
      padding: "80px 48px",
      fontFamily: FONT,
      display: "flex", flexDirection: "column", gap: 32,
    }}>
      {/* Header */}
      <div style={{ fontSize: 28, fontWeight: 700, color: C.charcoal }}>反思与分析</div>

      {/* Charts row */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
        {/* Pie */}
        <svg width={pieRadius * 2} height={pieRadius * 2}>
          {pieSegments}
        </svg>
        {/* Line */}
        <svg width={lineWidth} height={lineHeight} style={{ overflow: "visible" }}>
          <polyline
            points={pointsStr}
            fill="none"
            stroke={C.sage}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={lineWidth * 2}
            strokeDashoffset={lineWidth * 2 * (1 - lineProgress)}
          />
        </svg>
      </div>

      {/* Metric cards */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {cards.map((card, i) => {
          const s = springV(frame, fps, card.delay, SPRING.SNAPPY);
          return (
            <div key={i} style={{
              flex: 1, padding: "20px 12px",
              background: C.white,
              borderRadius: 16,
              boxShadow: `0 4px 20px ${alpha(card.color, 0.1)}`,
              textAlign: "center",
              transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
              opacity: s,
            }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 14, color: C.charcoal, marginTop: 4 }}>
                {card.label} <span style={{ color: C.muted }}>{card.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
