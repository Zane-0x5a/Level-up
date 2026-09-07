'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, BarChart3, Settings } from 'lucide-react'
import { useNav } from '@/contexts/NavContext'
import './bottom-tab-bar.css'

const tabs = [
  { href: '/', label: '首页', Icon: Home },
  { href: '/focus', label: '专注', Icon: Target },
  { href: '/analysis', label: '分析', Icon: BarChart3 },
  { href: '/settings', label: '设置', Icon: Settings },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const { navHidden } = useNav()
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    const mobile = window.matchMedia('(max-width: 768px)')
    let baselineHeight = window.innerHeight
    let baselineWidth = window.innerWidth
    let frame = 0

    function update() {
      const focused = document.activeElement
      const editing = focused instanceof HTMLElement && (
        focused.isContentEditable ||
        (focused instanceof HTMLTextAreaElement && !focused.readOnly && !focused.disabled) ||
        (focused instanceof HTMLInputElement && !focused.readOnly && !focused.disabled &&
          /^(text|search|email|password|tel|url|number)$/.test(focused.type))
      )
      if (!editing || Math.abs(window.innerWidth - baselineWidth) > 1) {
        baselineHeight = window.innerHeight
        baselineWidth = window.innerWidth
      }
      // Cover browsers that resize either the visual viewport or the whole layout.
      const availableHeight = Math.max(baselineHeight, window.innerHeight, document.documentElement.clientHeight)
      const visibleHeight = viewport?.height ?? window.innerHeight
      const zoomed = viewport && Math.abs(viewport.scale - 1) > 0.05
      setKeyboardVisible(Boolean(mobile.matches && editing && !zoomed &&
        availableHeight - visibleHeight > Math.max(120, availableHeight * 0.18)))
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    scheduleUpdate()
    document.addEventListener('focusin', scheduleUpdate)
    document.addEventListener('focusout', scheduleUpdate)
    window.addEventListener('resize', scheduleUpdate)
    viewport?.addEventListener('resize', scheduleUpdate)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('focusin', scheduleUpdate)
      document.removeEventListener('focusout', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      viewport?.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  if (navHidden) return null
  if (pathname === '/auth') return null

  const activeIndex = tabs.findIndex(({ href }) => href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <nav
      className="bottom-tab-bar"
      aria-label="主导航"
      aria-hidden={keyboardVisible || undefined}
      inert={keyboardVisible}
      data-keyboard-hidden={keyboardVisible}
    >
      <div className="bottom-tab-bar__items" style={{ '--tab-index': Math.max(0, activeIndex) } as CSSProperties}>
        {tabs.map(({ href, label, Icon }, index) => {
          const isActive = activeIndex === index
          return (
            <Link
              key={href}
              href={href}
              className={`tab-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="tab-icon"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className="tab-label">{label}</span>
            </Link>
          )
        })}
        <span className="bottom-tab-bar__indicator" data-visible={activeIndex >= 0} aria-hidden="true" />
      </div>
    </nav>
  )
}
