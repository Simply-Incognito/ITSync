import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Menu, Moon, Sparkles, Sun, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../utils/navigation'

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) return savedTheme === 'dark'
  } catch {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme)
  const navigate = useNavigate()
  const dashboardLink = user ? getDashboardPath(user.role) : '/login'

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light'
    try {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    } catch {
      // Keep the selected theme for this session when storage is unavailable.
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDarkMode ? '#0f1411' : '#fcfcfa')
  }, [isDarkMode])

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  const closeMobileMenu = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link
          to={isAuthenticated ? dashboardLink : '/'}
          onClick={closeMobileMenu}
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-label={isAuthenticated ? 'ITSync dashboard' : 'ITSync home'}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-950/25 sm:h-10 sm:w-10">
            <Sparkles className="h-[18px] w-[18px] text-white" aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink sm:text-lg">ITSync</span>
        </Link>

        {isAuthenticated && (
          <nav aria-label="Primary navigation" className="hidden items-center gap-4 lg:flex xl:gap-6">
            <Link to={dashboardLink} className="rounded-lg px-2 py-2 text-sm font-medium text-ink-muted transition hover:text-primary-700">
              Dashboard
            </Link>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:border-primary-500/50 hover:text-primary-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-ink-muted transition hover:text-primary-700">
                  Sign in
                </Link>
                <Link to="/register" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700">
                  Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsDarkMode((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition hover:border-primary-500/50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            aria-pressed={isDarkMode}
          >
            {isDarkMode ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition hover:border-primary-500/50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="h-[18px] w-[18px]" aria-hidden="true" /> : <Menu className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink} onClick={closeMobileMenu} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-ink-muted hover:bg-surface-soft hover:text-primary-700">
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-ink-muted hover:bg-surface-soft hover:text-primary-700">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={closeMobileMenu} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold text-ink transition hover:bg-surface-soft">
                  Sign in
                </Link>
                <Link to="/register" onClick={closeMobileMenu} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white transition hover:bg-primary-700">
                  Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
