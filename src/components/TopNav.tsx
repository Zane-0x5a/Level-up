'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Home, Settings, Target } from 'lucide-react'
import { useNav } from '@/contexts/NavContext'
import './top-nav.css'

const links = [
  { href: '/', label: '首页', Icon: Home },
  { href: '/focus', label: '专注', Icon: Target },
  { href: '/analysis', label: '分析', Icon: BarChart3 },
  { href: '/settings', label: '设置', Icon: Settings },
]

function CornerNavigation({ pathname }: { pathname: string }) {
  const [mode, setMode] = useState<'closed' | 'hover' | 'pinned'>('closed')
  const navRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outsidePointer = useRef(false)
  const open = mode !== 'closed'

  function cancelClose() {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function close(restoreFocus = false) {
    cancelClose()
    if (restoreFocus) triggerRef.current?.focus()
    setMode('closed')
  }

  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return

    function beginOutsidePointer(event: PointerEvent) {
      outsidePointer.current = event.target instanceof Node && !navRef.current?.contains(event.target)
      if (outsidePointer.current) cancelClose()
    }

    // Keep displaced controls still until their pointer gesture has completed.
    function endOutsidePointer() {
      if (!outsidePointer.current) return
      cancelClose()
      closeTimer.current = setTimeout(() => {
        outsidePointer.current = false
        setMode('closed')
      }, 0)
    }

    function dismissOutside(event: MouseEvent) {
      outsidePointer.current = false
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        cancelClose()
        setMode('closed')
      }
    }

    function dismissWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (navRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
      setMode('closed')
    }

    // A resized or backgrounded page must not retain an invisible open menu.
    function dismiss() { setMode('closed') }
    const mobile = window.matchMedia('(max-width: 768px)')
    document.addEventListener('pointerdown', beginOutsidePointer, true)
    document.addEventListener('pointerup', endOutsidePointer)
    document.addEventListener('pointercancel', endOutsidePointer)
    document.addEventListener('click', dismissOutside)
    document.addEventListener('keydown', dismissWithEscape)
    window.addEventListener('blur', dismiss)
    mobile.addEventListener('change', dismiss)
    return () => {
      outsidePointer.current = false
      document.removeEventListener('pointerdown', beginOutsidePointer, true)
      document.removeEventListener('pointerup', endOutsidePointer)
      document.removeEventListener('pointercancel', endOutsidePointer)
      document.removeEventListener('click', dismissOutside)
      document.removeEventListener('keydown', dismissWithEscape)
      window.removeEventListener('blur', dismiss)
      mobile.removeEventListener('change', dismiss)
    }
  }, [open])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowLeft'
    const backward = event.key === 'ArrowUp' || event.key === 'ArrowRight'
    if (!forward && !backward && event.key !== 'Home' && event.key !== 'End') return

    event.preventDefault()
    cancelClose()
    const current = linkRefs.current.findIndex(link => link === document.activeElement)
    let next = forward ? (current + 1) % links.length : (current - 1 + links.length) % links.length
    if (event.key === 'Home' || (current < 0 && forward)) next = 0
    if (event.key === 'End' || (current < 0 && backward)) next = links.length - 1
    // Remove inert before moving focus when an arrow opens the disclosure.
    if (!open) flushSync(() => setMode('pinned'))
    else setMode('pinned')
    linkRefs.current[next]?.focus()
  }

  return (
    <nav
      ref={navRef}
      className="corner-nav"
      aria-label="主导航"
      data-open={open}
      onKeyDown={handleKeyDown}
      onPointerEnter={cancelClose}
      onPointerLeave={() => {
        if (mode !== 'hover' || outsidePointer.current || navRef.current?.contains(document.activeElement)) return
        cancelClose()
        closeTimer.current = setTimeout(() => setMode('closed'), 200)
      }}
      onBlur={event => {
        if (!outsidePointer.current && !event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <div className="corner-nav__hit-area" aria-hidden="true" />
      <div className="corner-nav__surface" aria-hidden="true">
        <div className="corner-nav__inner-arc" />
      </div>

      <button
        ref={triggerRef}
        type="button"
        className="corner-nav__trigger"
        aria-expanded={open}
        aria-controls="corner-nav-links"
        aria-label={open ? 'Level Up，收起导航' : 'Level Up，打开导航'}
        onPointerEnter={event => {
          if (event.pointerType === 'mouse') {
            cancelClose()
            setMode(current => current === 'closed' ? 'hover' : current)
          }
        }}
        onClick={() => {
          cancelClose()
          if (open) close(true)
          else setMode('pinned')
        }}
      >
        <span className="corner-nav__imprint" aria-hidden="true" />
        <span className="corner-nav__brand" aria-hidden="true">Level <span>Up</span></span>
      </button>

      <div id="corner-nav-links" className="corner-nav__links" inert={!open}>
        {links.map(({ href, label, Icon }, index) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              ref={element => { linkRefs.current[index] = element }}
              href={href}
              className="corner-nav__link"
              aria-current={active ? 'page' : undefined}
              onClick={event => {
                if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
                  close(true)
                }
              }}
            >
              <span className="corner-nav__icon"><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span>
              <span className="corner-nav__label">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function TopNav() {
  const pathname = usePathname()
  const { navHidden } = useNav()

  if (pathname === '/auth' || navHidden) return null
  return <CornerNavigation key={pathname} pathname={pathname} />
}
