import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

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
  const timerRef = useRef(null)

  useEffect(() => {
    const key = `_scroll_${pathname}`
    const saved = sessionStorage.getItem(key)

    clearTimeout(timerRef.current)

    if (saved !== null) {
      // Page was visited before — restore its position.
      // Retry until the container has enough height (content may still be loading).
      const target = parseInt(saved, 10) || 0
      let attempts = 0
      const tryRestore = () => {
        const el = getEl()
        const maxScroll =
          el === window
            ? document.body.scrollHeight - window.innerHeight
            : el.scrollHeight - el.clientHeight
        if (maxScroll >= target || attempts >= 20) {
          setY(el, target)
        } else {
          attempts++
          timerRef.current = setTimeout(tryRestore, 50)
        }
      }
      timerRef.current = setTimeout(tryRestore, 20)
    } else {
      // First visit to this route — start at top
      setY(getEl(), 0)
    }

    // Save scroll position while on this page
    let rafId
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(getY(getEl())))
      })
    }

    const el = getEl()
    el.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timerRef.current)
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', onScroll)
      // Save final position the moment we leave
      sessionStorage.setItem(key, String(getY(el)))
    }
  }, [pathname])

  return null
}
