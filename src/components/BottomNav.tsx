'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Focus, BarChart2 } from 'lucide-react'

const links = [
  { href: '/', label: '首页', icon: Home },
  { href: '/focus', label: '专注', icon: Focus },
  { href: '/analysis', label: '分析', icon: BarChart2 },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/focus') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="glass-2" style={{ borderRadius: 0 }}>
        <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
                  transition: 'all 0.4s var(--ease-spring)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-glass-xs)',
                    background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                    transition: 'all 0.4s var(--ease-spring)',
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
