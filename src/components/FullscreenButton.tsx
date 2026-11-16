import { useEffect, useState } from 'react'

/** Hides the browser's address bar where the page cannot be installed as an app (e.g. Silk). */
export default function FullscreenButton() {
  const [full, setFull] = useState(!!document.fullscreenElement)

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const standalone = window.matchMedia('(display-mode: standalone)').matches
  if (!document.fullscreenEnabled || standalone) return null

  const toggle = () => {
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    action.catch(() => {})
  }

  return (
    <button className="fullscreen" onClick={toggle} aria-label={full ? 'Exit full screen' : 'Full screen'}>
      <svg viewBox="0 0 24 24" width="1.4em" height="1.4em" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {full ? (
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        ) : (
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  )
}
