'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isRecovery } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (isRecovery && pathname !== '/auth') {
      router.replace('/auth')
      return
    }
    if (!user && pathname !== '/auth') router.replace('/auth')
    if (user && !isRecovery && pathname === '/auth') router.replace('/')
  }, [user, loading, pathname, router, isRecovery])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>加载中...</p>
      </div>
    )
  }

  if (isRecovery && pathname !== '/auth') return null
  if (!user && pathname !== '/auth') return null
  if (user && !isRecovery && pathname === '/auth') return null

  return <>{children}</>
}
