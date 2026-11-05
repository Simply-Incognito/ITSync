import { createContext, useContext, useState, type ReactNode } from 'react'

type WorkspaceNavigationContextValue = {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const WorkspaceNavigationContext = createContext<WorkspaceNavigationContextValue | null>(null)

export function WorkspaceNavigationProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <WorkspaceNavigationContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </WorkspaceNavigationContext.Provider>
  )
}

export function useWorkspaceNavigation() {
  const context = useContext(WorkspaceNavigationContext)
  if (!context) {
    throw new Error('useWorkspaceNavigation must be used within WorkspaceNavigationProvider')
  }
  return context
}
