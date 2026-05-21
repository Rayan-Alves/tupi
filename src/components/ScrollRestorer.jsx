import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const MAIN_ID = 'main-scroll'

function getEl() {
  return document.getElementById(MAIN_ID) || window
}
function getY(el) {
  return el === window ? window.scrollY : el.scrollTop
}
function setY(el, y) {
  if (el === window) window.scrollTo(0, y)
  else el.scrollTop = y
}

export default function ScrollRestorer() {
  const { pathname } = useLocation()
  const navType      = useNavigationType()
  const timerRef     = useRef(null)

  useEffect(() => {
    const key = `_scroll_${pathname}`

    if (navType === 'POP') {
      const saved = sessionStorage.getItem(key)
      if (saved !== null) {
        const target = parseInt(saved, 10) || 0
        // Retry until the container has enough height (content may still be loading)
        let attempts = 0
        const tryRestore = () => {
          const el = getEl()
          const maxScroll = el === window
            ? document.body.scrollHeight - window.innerHeight
            : el.scrollHeight - el.clientHeight
          if (maxScroll >= target || attempts >= 15) {
            setY(el, target)
          } else {
            attempts++
            timerRef.current = setTimeout(tryRestore, 60)
          }
        }
        timerRef.current = setTimeout(tryRestore, 30)
      }
    } else {
      // New navigation — go to top
      const el = getEl()
      setY(el, 0)
    }

    // Track scroll while on this page
    let rafId
    const onScroll = (e) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const el = e?.currentTarget ?? getEl()
        sessionStorage.setItem(key, String(getY(el)))
      })
    }

    const el = getEl()
    el.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timerRef.current)
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
      sessionStorage.setItem(key, String(getY(el)))
    }
  }, [pathname, navType])

  return null
}
