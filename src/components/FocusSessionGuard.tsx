'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { readFocusState } from '@/lib/focus-state'

export default function FocusSessionGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    // Only guard once the user is signed in, otherwise we'd fight with
    // AuthGuard on /auth: that page wants to keep the user there to log in,
    // and we'd keep redirecting to /focus in a loop until auth resolves.
    if (!user) return
    if (pathname === '/focus') return
    if (readFocusState(user.id) !== 'default') {
      router.replace('/focus')
    }
  }, [pathname, router, user])

  return null
}
