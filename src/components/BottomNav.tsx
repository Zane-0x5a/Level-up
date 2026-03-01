'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Focus, BarChart2 } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '首页', icon: Home },
    { href: '/focus', label: '专注', icon: Focus },
    { href: '/analysis', label: '分析', icon: BarChart2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Liquid Glass 效果背景 */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-t border-white/20 dark:border-slate-700/30" />

      <div className="relative flex justify-around items-center py-3 px-4 max-w-md mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive
                  ? 'text-indigo-500 scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* 底部安全区域填充 */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  )
}
