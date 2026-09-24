'use client'

import { GrainGradient, MeshGradient } from '@paper-design/shaders-react'
import { useBackground } from '@/hooks/useBackground'
import { useReducedMotion, useResolvedTheme } from '@/hooks/useAmbientEnv'

// Full-bleed colour fields drawn from the hero book's page colours. Opaque on
// purpose: low-alpha hue mixes over the canvas colour turn grey and read as dirt.
const PALETTE = {
  light: { base: '#f5eee4', coral: '#eca489', sage: '#9fc6b0', sky: '#a7c4e1', honey: '#f1cf90' },
  dark: { base: '#16181a', coral: '#743827', sage: '#294e3f', sky: '#223c5a', honey: '#634923' },
} as const

const fill = { width: '100%', height: '100%' }

/**
 * Page background chosen in Settings: flowing mesh, grain waves, or the static
 * wash from body::before (renders nothing). Sits under page content.
 */
export default function PageBackground() {
  const background = useBackground()
  const theme = useResolvedTheme()
  const reducedMotion = useReducedMotion()
  if (!theme || background === 'static') return null
  const p = PALETTE[theme]
  const motion = reducedMotion ? 0 : 1

  return (
    <div className="page-bg" aria-hidden="true">
      {background === 'mesh' ? (
        <MeshGradient
          style={fill}
          // Areas far from every spot show the palette mean; three base spots keep
          // that mean paper-coloured instead of the khaki the hues average to.
          colors={[p.base, p.coral, p.base, p.sage, p.sky, p.base, p.honey]}
          distortion={0.85}
          swirl={0.35}
          speed={0.3 * motion}
          // Smooth field: a small buffer upscaled by CSS is visually identical.
          maxPixelCount={960 * 600}
          minPixelRatio={1}
        />
      ) : (
        <GrainGradient
          style={fill}
          colorBack={p.base}
          colors={[p.coral, p.honey, p.sage, p.sky]}
          softness={0.85}
          intensity={0.35}
          noise={0.18}
          shape="wave"
          scale={1.2}
          rotation={-12}
          speed={0.4 * motion}
          // Grain needs near-native resolution or it upscales into blotches.
          maxPixelCount={1920 * 1200}
          minPixelRatio={1}
        />
      )}
    </div>
  )
}
