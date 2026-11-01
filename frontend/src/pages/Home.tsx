import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  GraduationCap,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../utils/navigation'

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified organizations',
    description: 'Explore opportunities from organizations reviewed before they can post.',
  },
  {
    icon: Search,
    title: 'A smarter search',
    description: 'Find placements that fit your field of study, location, and goals.',
  },
  {
    icon: CheckCircle,
    title: 'Clear application tracking',
    description: 'Follow each application and know when its status changes.',
  },
]

const studentBenefits = [
  'Build a profile that reflects your skills',
  'Search opportunities that fit your studies',
  'Apply and track every application',
]

const organizationBenefits = [
  'Register and verify your organization',
  'Share SIWES opportunities with students',
  'Review and manage applications',
]

function BenefitList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink-muted">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const { user } = useAuth()

  if (user?.role === 'administrator') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return (
    <div className="overflow-hidden bg-paper text-ink">
      <section aria-labelledby="hero-heading" className="relative isolate scroll-mt-24 bg-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(80,145,99,0.12),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"
        />
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-ink-muted shadow-sm sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_0_4px_rgba(41,185,112,0.14)]" aria-hidden="true" />
              A clearer path to industrial training
            </span>
            <h1
              id="hero-heading"
              className="mx-auto mt-6 max-w-4xl text-balance font-heading text-[clamp(2rem,9.6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink"
            >
              <span className="block">Find your next</span>
              <span className="mt-1 block text-primary-700">SIWES placement</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-ink-muted sm:mt-6 sm:text-lg sm:leading-8">
              Connect with verified organizations, discover meaningful opportunities, and move through your placement journey with confidence.
            </p>
            <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 min-[380px]:flex-row sm:mt-9 sm:w-auto sm:max-w-none sm:justify-center">
              <Link
                to="/register"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/20 transition hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:flex-none sm:px-7"
              >
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface/70 px-6 py-3 text-sm font-semibold text-ink transition hover:border-primary-400/60 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:flex-none sm:px-7"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-ink-muted sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Verified organizations
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Track applications
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        aria-labelledby="features-heading"
        className="scroll-mt-24 border-y border-line bg-surface-soft py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Why ITSync</p>
            <h2 id="features-heading" className="mt-3 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              A better way to find your fit
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
              The tools students and organizations need to make every placement step feel simpler.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-500/50 hover:shadow-xl hover:shadow-black/10 sm:rounded-3xl sm:p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 transition group-hover:bg-primary-200 sm:h-12 sm:w-12">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink sm:text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Made for both sides</p>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              One platform, two clear paths
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <article
              id="students"
              aria-labelledby="students-heading"
              className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 shadow-lg shadow-black/5 sm:p-8 lg:p-9"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 id="students-heading" className="mt-5 font-heading text-xl font-semibold text-ink sm:text-2xl">For students</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
                Build your profile, find training that fits your studies, and keep every application organized.
              </p>
              <BenefitList items={studentBenefits} />
              <Link
                to="/register"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
              >
                Join as a student <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>

            <article
              id="organizations"
              aria-labelledby="organizations-heading"
              className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 shadow-lg shadow-black/5 sm:p-8 lg:p-9"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 id="organizations-heading" className="mt-5 font-heading text-xl font-semibold text-ink sm:text-2xl">For organizations</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
                Share opportunities with motivated students and manage applications in one clear workspace.
              </p>
              <BenefitList items={organizationBenefits} />
              <Link
                to="/register"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
              >
                Join as an organization <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1d3527] via-[#234b34] to-[#1b3e31]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(100,232,157,0.22),transparent_52%)]"
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Your next step starts here</p>
          <h2 id="cta-heading" className="mt-3 font-heading text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:mt-4 sm:text-base sm:leading-7">
            Create your account and take the next step toward a meaningful industrial training experience.
          </p>
          <Link
            to="/register"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#145838] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#145838] sm:mt-8 sm:w-auto sm:px-7"
          >
            Create your free account <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
