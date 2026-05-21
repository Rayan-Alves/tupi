import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * ScrollRestorer — placed inside <BrowserRouter>.
 * Targets #main-scroll (Layout pages) or window (full-page routes).
 * • PUSH / REPLACE  → scroll to top
 * • POP (back/fwd)  → restore saved position
 */
function getScroller() {
  return document.getElementById('main-scroll') || window
}

function getScrollTop(el) {
  return el === window ? window.scrollY : el.scrollTop
}

function scrollTo(el, y) {
  if (el === window) {
    window.scrollTo(0, y)
  } else {
    el.scrollTop = y
  }
}

export default function ScrollRestorer() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    const key = `_scroll_${pathname}`
    const el = getScroller()

    if (navType === 'POP') {
      const saved = sessionStorage.getItem(key)
      if (saved !== null) {
        // Double rAF: first frame mounts DOM, second frame applies scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollTo(el, parseInt(saved, 10) || 0)
          })
        })
      }
    } else {
      scrollTo(el, 0)
    }

    let rafId
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(getScrollTop(el)))
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
      sessionStorage.setItem(key, String(getScrollTop(el)))
    }
  }, [pathname, navType])

  return null
}
