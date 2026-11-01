import { createContext, useContext, useState, type ReactNode } from 'react'

type StudentNavigationContextValue = {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const StudentNavigationContext = createContext<StudentNavigationContextValue | null>(null)

export function StudentNavigationProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <StudentNavigationContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </StudentNavigationContext.Provider>
  )
}

export function useStudentNavigation() {
  const context = useContext(StudentNavigationContext)
  if (!context) {
    throw new Error('useStudentNavigation must be used within StudentNavigationProvider')
  }
  return context
}
