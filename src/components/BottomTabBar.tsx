'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/focus', label: '专注', icon: '🎯' },
  { href: '/analysis', label: '分析', icon: '📊' },
  { href: '/settings', label: '设置', icon: '⚙️' },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="bottom-tab-bar">
      {tabs.map(({ href, label, icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`tab-item${isActive ? ' active' : ''}`}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
