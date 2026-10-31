import { Toaster } from 'react-hot-toast'

/**
 * App-wide toast host. Rendered once in the layout, so every page can call
 * `notify.*` without mounting its own container.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerStyle={{ top: 88 }}
      toastOptions={{
        duration: 4000,
        className: 'app-toast',
        success: {
          className: 'app-toast app-toast--success',
          duration: 4000,
          iconTheme: { primary: '#238653', secondary: '#effdf4' },
        },
        error: {
          className: 'app-toast app-toast--error',
          duration: 5000,
          iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
        },
        loading: {
          className: 'app-toast app-toast--loading',
          iconTheme: { primary: '#238653', secondary: '#ffffff' },
        },
      }}
    />
  )
}
