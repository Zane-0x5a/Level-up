'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

const NavContext = createContext<{
  navHidden: boolean
  setNavHidden: (v: boolean) => void
}>({ navHidden: false, setNavHidden: () => {} })

export function NavProvider({ children }: { children: ReactNode }) {
  const [navHidden, setNavHidden] = useState(false)
  return (
    <NavContext.Provider value={{ navHidden, setNavHidden }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNav = () => useContext(NavContext)
