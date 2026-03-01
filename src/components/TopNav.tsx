'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '首页' },
  { href: '/focus', label: '专注' },
  { href: '/analysis', label: '分析' },
  { href: '/settings', label: '设置' },
]

export default function TopNav({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        top: hidden ? -80 : 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '8px 10px 8px 24px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        border: '1px solid rgba(43,45,66,0.05)',
        borderRadius: 100,
        boxShadow: '0 4px 24px rgba(43,45,66,0.06)',
        transition: 'top 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {/* Brand */}
      <span
        style={{
          fontFamily: "var(--font-display, 'Sora', sans-serif)",
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--color-text, #2b2d42)',
          whiteSpace: 'nowrap',
        }}
      >
        Level <span style={{ color: 'var(--color-coral, #d4654a)' }}>Up</span>
      </span>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 3 }}>
        {links.map(({ href, label }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body, 'Lexend', sans-serif)",
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#fff' : 'var(--color-text-3, #a3a9b8)',
                textDecoration: 'none',
                padding: '7px 18px',
                borderRadius: 100,
                background: isActive
                  ? 'var(--color-coral, #d4654a)'
                  : 'transparent',
                boxShadow: isActive
                  ? '0 2px 12px var(--color-coral-glow, rgba(212,101,74,0.14))'
                  : 'none',
                transition: 'all 0.25s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-2, #6b7280)'
                  e.currentTarget.style.background = 'rgba(43,45,66,0.03)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color =
                    'var(--color-text-3, #a3a9b8)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
