import toast from 'react-hot-toast'

/**
 * Single entry point for app-wide notifications.
 *
 * Usage:
 *   notify.success('Profile saved')
 *   notify.error(getErrorMessage(err, 'Unable to save your profile.'))
 *   await notify.promise(saveProfile(), { loading: 'Saving…', success: 'Saved', error: 'Failed' })
 */
export const notify = {
  success(message: string) {
    return toast.success(message, { className: 'app-toast app-toast--success' })
  },
  error(message: string) {
    return toast.error(message, { className: 'app-toast app-toast--error' })
  },
  loading(message: string) {
    return toast.loading(message, { className: 'app-toast app-toast--loading' })
  },
  info(message: string) {
    return toast(message, { className: 'app-toast' })
  },
  promise: toast.promise,
  dismiss(toastId?: string) {
    toast.dismiss(toastId)
  },
  /** Escape hatch for advanced toast usage (custom renderers, etc.). */
  raw: toast,
}

export type { Toast } from 'react-hot-toast'
