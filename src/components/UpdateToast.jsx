import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Service-worker update toast (I4).
 * Uses VitePWA's React hook to detect a fresh SW waiting; the user can
 * accept the update (calls skipWaiting + reload) or dismiss it.
 */
export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.warn('[SW] register failed:', err)
    },
  })

  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state if a *new* update lands later
  useEffect(() => { if (needRefresh) setDismissed(false) }, [needRefresh])

  if (!needRefresh || dismissed) return null

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <div className="update-toast-body">
        <strong>New version available.</strong>
        <span> Reload to get the latest questions and fixes.</span>
      </div>
      <div className="update-toast-actions">
        <button className="btn btn-ghost" onClick={() => { setDismissed(true); setNeedRefresh(false) }}>
          Later
        </button>
        <button className="btn btn-primary" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      </div>
    </div>
  )
}
