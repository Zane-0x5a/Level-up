/**
 * Level Up — Design Tokens
 * Style: Liquid Glass (H version)
 * iOS 26 inspired glass morphism with living landscape background
 */

// ─── Colors ───────────────────────────────────────
export const colors = {
  text: {
    DEFAULT: '#1a1a2e',
    secondary: 'rgba(26,26,46,0.6)',
    muted: 'rgba(26,26,46,0.35)',
    onDark: '#f0f0f8',
  },
  accent: {
    DEFAULT: '#3b82f6',
    soft: 'rgba(59,130,246,0.12)',
    hover: '#2563eb',
  },
  success: {
    DEFAULT: '#10b981',
    soft: 'rgba(16,185,129,0.12)',
  },
  rose: {
    DEFAULT: '#f43f5e',
    soft: 'rgba(244,63,94,0.10)',
  },
  amber: {
    DEFAULT: '#f59e0b',
  },
  purple: {
    DEFAULT: '#8b5cf6',
    soft: 'rgba(139,92,246,0.10)',
  },
} as const

// ─── Glass System ─────────────────────────────────
export const glass = {
  level1: {
    bg: 'rgba(255,255,255,0.38)',
    bgHover: 'rgba(255,255,255,0.48)',
    blur: 'blur(40px) saturate(1.8) brightness(1.05)',
  },
  level2: {
    bg: 'rgba(255,255,255,0.22)',
    blur: 'blur(24px) saturate(1.5)',
  },
  level3: {
    bg: 'rgba(255,255,255,0.12)',
    blur: 'blur(12px) saturate(1.2)',
  },
  border: {
    top: 'rgba(255,255,255,0.65)',
    left: 'rgba(255,255,255,0.40)',
    right: 'rgba(255,255,255,0.18)',
    bottom: 'rgba(255,255,255,0.12)',
    uniform: 'rgba(255,255,255,0.30)',
    light: 'rgba(255,255,255,0.20)',
  },
  shadow: {
    DEFAULT: '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    lg: '0 16px 48px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
    highlight: 'inset 0 1px 0 rgba(255,255,255,0.55)',
  },
} as const

// ─── Typography ───────────────────────────────────
export const fonts = {
  body: "'Outfit', sans-serif",
  mono: "'IBM Plex Mono', monospace",
  /** Google Fonts import URL */
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap',
} as const

// ─── Border Radius ────────────────────────────────
export const radius = {
  DEFAULT: '24px',
  md: '18px',
  sm: '14px',
  xs: '10px',
  pill: '100px',
} as const

// ─── Background Scene ─────────────────────────────
export const background = {
  /** Main landscape gradient (home + analysis pages) */
  landscape: [
    'radial-gradient(ellipse 130% 80% at 25% 15%, rgba(96,165,250,0.35) 0%, transparent 55%)',
    'radial-gradient(ellipse 100% 70% at 75% 85%, rgba(251,191,36,0.22) 0%, transparent 50%)',
    'radial-gradient(ellipse 90% 90% at 55% 50%, rgba(52,211,153,0.18) 0%, transparent 55%)',
    'radial-gradient(ellipse 70% 50% at 85% 25%, rgba(244,114,182,0.12) 0%, transparent 50%)',
    'linear-gradient(160deg, #dbeafe 0%, #d1fae5 30%, #fef3c7 60%, #fce7f3 100%)',
  ].join(', '),
  /** Focus page — cooler/deeper tones */
  focus: [
    'radial-gradient(ellipse 120% 90% at 30% 30%, rgba(56,120,200,0.3) 0%, transparent 60%)',
    'radial-gradient(ellipse 100% 80% at 70% 70%, rgba(139,92,246,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(52,211,153,0.15) 0%, transparent 50%)',
    'linear-gradient(160deg, #c7d9f0 0%, #b4d5c8 35%, #ddd6f3 65%, #d4e4f7 100%)',
  ].join(', '),
} as const

// ─── Animation Timing ─────────────────────────────
export const animation = {
  /** Smooth spring-like easing for hover/transitions */
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  /** Blob drift durations */
  blob: { a: '18s', b: '22s', c: '20s', d: '25s' },
  /** Breathing ring on return button */
  breathe: '4s',
  /** Stagger delays for slide-up entrance */
  stagger: ['0.06s', '0.12s', '0.18s', '0.24s', '0.30s'],
} as const
