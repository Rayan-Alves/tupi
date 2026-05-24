import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

/**
 * CollapsibleSection
 *
 * A card/section that clamps its content to `collapsedHeight` pixels when
 * there are more items than fit. A gradient + "show more" button appears at
 * the bottom; clicking it expands to full height. Clicking outside collapses
 * it back automatically.
 *
 * Props:
 *   collapsedHeight  number   max-height in px while collapsed (default 240)
 *   alwaysExpanded   boolean  disable collapse entirely (pass when list is short)
 *   className        string   extra classes for the outer <section>
 *   style            object   extra styles for the outer <section>
 *   labelMore        string   label for the expand button  (default "ver mais")
 *   labelLess        string   label for the collapse button (default "↑ ver menos")
 *   children         ReactNode
 */
export default function CollapsibleSection({
  collapsedHeight = 240,
  alwaysExpanded = false,
  className = '',
  style = {},
  labelMore = 'ver mais',
  labelLess = '↑ ver menos',
  children,
}) {
  const [expanded, setExpanded]   = useState(false)
  const [overflows, setOverflows] = useState(false)
  const wrapRef    = useRef(null)
  const contentRef = useRef(null)

  // Measure real content height
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > collapsedHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children, collapsedHeight])

  // Auto-collapse on outside click
  useEffect(() => {
    if (!expanded) return
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [expanded])

  const clamped      = !alwaysExpanded && overflows && !expanded
  const showGradient = clamped
  const showLess     = !alwaysExpanded && overflows && expanded

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', ...style }}>
      {/* Content wrapper */}
      <div
        style={{
          maxHeight: clamped ? collapsedHeight : 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div ref={contentRef}>
          {children}
        </div>

        {/* Gradient fade + expand pill */}
        {showGradient && (
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 72,
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.98))',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 8,
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={() => setExpanded(true)}
              style={{ pointerEvents: 'all' }}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-400 rounded-full px-3 py-1 shadow-sm transition-all"
            >
              <Plus size={11} strokeWidth={2.5} />
              {labelMore}
            </button>
          </div>
        )}
      </div>

      {/* Collapse button below content */}
      {showLess && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          {labelLess}
        </button>
      )}
    </div>
  )
}
