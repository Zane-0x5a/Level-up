'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNav } from '@/contexts/NavContext'

const links = [
  { href: '/', label: '首页' },
  { href: '/focus', label: '专注' },
  { href: '/analysis', label: '分析' },
  { href: '/settings', label: '设置' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { navHidden } = useNav()

  return (
    <nav className={`top-nav${navHidden ? ' hidden' : ''}`}>
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
