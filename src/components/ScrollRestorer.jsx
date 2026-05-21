import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * ScrollRestorer — place once inside <BrowserRouter>.
 * • PUSH / REPLACE  → scroll to top (new page)
 * • POP (back/fwd)  → restore saved position
 * Persists to sessionStorage so tab-switching works too.
 */
export default function ScrollRestorer() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    const key = `_scroll_${pathname}`

    if (navType === 'POP') {
      // Going back — restore where the user was
      const saved = sessionStorage.getItem(key)
      if (saved !== null) {
        // rAF gives the page time to paint before jumping
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(saved, 10) || 0)
          })
        })
      }
    } else {
      // New navigation — fresh start at top
      window.scrollTo(0, 0)
    }

    // Track scroll while on this page
    let rafId
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(window.scrollY))
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
      // Save final position on unmount (before route changes)
      sessionStorage.setItem(key, String(window.scrollY))
    }
  }, [pathname, navType])

  return null
}
