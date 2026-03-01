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
    <nav className={`top-nav${hidden ? ' hidden' : ''}`}>
      <div className="nav-brand">Level <span>Up</span></div>
      <div className="nav-links">
        {links.map(({ href, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
