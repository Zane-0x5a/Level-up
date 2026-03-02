/**
 * Level Up — Design Tokens
 * Style: Drift 漂流
 * Mediterranean warmth, buoyant lightness, gentle motion
 */

// ─── Colors ───────────────────────────────────────
export const colors = {
  coral: {
    DEFAULT: '#d4654a',
    soft: 'rgba(212,101,74,0.08)',
    glow: 'rgba(212,101,74,0.14)',
    glowLg: 'rgba(212,101,74,0.20)',
  },
  sage: {
    DEFAULT: '#5b9279',
    soft: 'rgba(91,146,121,0.08)',
    glow: 'rgba(91,146,121,0.12)',
  },
  honey: {
    DEFAULT: '#e8b86d',
    soft: 'rgba(232,184,109,0.10)',
    glow: 'rgba(232,184,109,0.16)',
  },
  sky: {
    DEFAULT: '#5b8fb9',
    soft: 'rgba(91,143,185,0.08)',
  },
  rose: {
    DEFAULT: '#c9515b',
    soft: 'rgba(201,81,91,0.08)',
  },
  text: {
    DEFAULT: '#2b2d42',
    secondary: '#6b7280',
    muted: '#a3a9b8',
  },
  bg: {
    DEFAULT: '#faf8f5',
    sub: '#f3efe9',
  },
  card: '#ffffff',
} as const

// ─── Typography ───────────────────────────────────
export const fonts = {
  display: "'Sora', sans-serif",
  body: "'Lexend', sans-serif",
  mono: "'DM Mono', monospace",
  /** Google Fonts import URL */
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=Sora:wght@300..800&family=Lexend:wght@300..700&family=DM+Mono:wght@400;500&display=swap',
} as const

// ─── Border Radius ────────────────────────────────
export const radius = {
  DEFAULT: '18px',
  md: '14px',
  sm: '10px',
  xs: '8px',
} as const

// ─── Shadows ──────────────────────────────────────
export const shadows = {
  sm: '0 2px 8px rgba(43,45,66,0.04)',
  md: '0 4px 20px rgba(43,45,66,0.06)',
  lg: '0 8px 32px rgba(43,45,66,0.08)',
} as const

// ─── Animation Timing ─────────────────────────────
export const animation = {
  /** Smooth spring-like easing for hover/transitions */
  easeSpring: 'cubic-bezier(0.23, 1, 0.32, 1)',
  /** Entrance animation easing */
  easeEntrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Stagger delays for slide-up entrance */
  stagger: ['0.05s', '0.10s', '0.15s', '0.20s', '0.25s'],
} as const
