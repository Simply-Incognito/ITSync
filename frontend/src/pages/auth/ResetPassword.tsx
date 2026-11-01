import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'
import { authApi } from '../../services/api'
import { getErrorMessage } from '../../utils/errors'
import { notify } from '../../lib/notify'

const minimumPasswordLength = 12

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < minimumPasswordLength) {
      notify.error(`Use at least ${minimumPasswordLength} characters.`)
      return
    }

    if (password !== confirmPassword) {
      notify.error('The two passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword(token, password, confirmPassword)
      setIsComplete(true)
      notify.success('Password updated. You can sign in now.')
    } catch (err) {
      notify.error(getErrorMessage(err, 'This reset link is no longer valid. Request a new one.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-surface rounded-2xl border border-line p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <ShieldAlert size={24} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-ink">This link is incomplete</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Password reset links include a one-time token. Request a fresh link to continue.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex items-center justify-center w-full py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors"
            >
              Request a new link
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-title font-display font-semibold text-ink">Choose a new password</h1>
          <p className="mt-3 text-ink-muted">
            Your new password must be at least {minimumPasswordLength} characters long.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-8">
          {isComplete ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink">Password updated</h2>
              <p className="mt-2 text-sm text-ink-muted">You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center w-full py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="At least 12 characters"
                      required
                      minLength={minimumPasswordLength}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Repeat your new password"
                      required
                      minLength={minimumPasswordLength}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>
            </>
          )}

          {!isComplete && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
