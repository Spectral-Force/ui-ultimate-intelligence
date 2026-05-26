import { useEffect, useState } from 'react'

/**
 * "Add to Home Screen" banner.
 *  - Chrome/Edge/Android: uses the beforeinstallprompt event for one-tap install
 *  - iOS Safari: no install API; shows manual instructions
 */
const LS_DISMISSED = 'ui.installBanner.dismissed'

function isIos() {
  const ua = navigator.userAgent || navigator.vendor || ''
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export default function InstallBanner() {
  const [deferred, setDeferred] = useState(null)
  const [iosVisible, setIosVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(LS_DISMISSED) === '1')

  useEffect(() => {
    if (isStandalone()) return
    if (dismissed) return

    function onBefore(e) {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onBefore)

    if (isIos()) {
      // Show iOS hint after 8s of usage
      const t = setTimeout(() => setIosVisible(true), 8000)
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', onBefore) }
    }
    return () => window.removeEventListener('beforeinstallprompt', onBefore)
  }, [dismissed])

  function handleInstall() {
    if (!deferred) return
    deferred.prompt()
    deferred.userChoice.finally(() => {
      setDeferred(null)
      setDismissed(true)
      localStorage.setItem(LS_DISMISSED, '1')
    })
  }

  function handleDismiss() {
    setDismissed(true)
    setIosVisible(false)
    localStorage.setItem(LS_DISMISSED, '1')
  }

  if (dismissed) return null
  if (!deferred && !iosVisible) return null

  return (
    <div className="install-banner" role="status">
      <div className="install-banner-body">
        <strong>Install UI on this device</strong>
        <span>
          {deferred
            ? ' for offline study and a full-screen app experience.'
            : ' Tap the Share icon, then "Add to Home Screen".'}
        </span>
      </div>
      <div className="install-banner-actions">
        <button className="btn btn-ghost" onClick={handleDismiss}>Not now</button>
        {deferred && (
          <button className="btn btn-primary" onClick={handleInstall}>Install</button>
        )}
      </div>
    </div>
  )
}
