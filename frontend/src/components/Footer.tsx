import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b120e] text-[#e8f1eb]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-12">
          <div>
            <Link to="/" aria-label="ITSync home" className="inline-flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-black/20"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
              <span className="text-lg font-bold tracking-tight">ITSync</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/65">
              Connecting Nigerian students with verified organizations for meaningful industrial training.
            </p>
          </div>

          <nav aria-label="Platform links">
            <h2 className="text-sm font-semibold text-white">Explore ITSync</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-emerald-50/70">
              <li><a href="/#features" className="transition hover:text-white">Why ITSync</a></li>
              <li><a href="/#students" className="transition hover:text-white">For students</a></li>
              <li><a href="/#organizations" className="transition hover:text-white">For organizations</a></li>
            </ul>
          </nav>

          <nav aria-label="Account links">
            <h2 className="text-sm font-semibold text-white">Your account</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-emerald-50/70">
              <li><Link to="/register" className="transition hover:text-white">Create an account</Link></li>
              <li><Link to="/login" className="transition hover:text-white">Sign in</Link></li>
              <li><span>Need help? Use the feedback button.</span></li>
            </ul>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-emerald-50/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ITSync. All rights reserved.</p>
          <p>Built to make the placement journey clearer.</p>
        </div>
      </div>
    </footer>
  )
}
