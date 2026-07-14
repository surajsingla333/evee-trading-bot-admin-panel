import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])

  const value = useMemo(
    () => ({ collapsed, mobileOpen, toggleCollapsed, setMobileOpen }),
    [collapsed, mobileOpen, toggleCollapsed],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
