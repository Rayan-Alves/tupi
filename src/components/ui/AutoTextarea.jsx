import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

/**
 * AutoTextarea — looks like a <input> but wraps text automatically.
 * - resize: none (user can't drag it)
 * - auto-height driven by scrollHeight
 * - Enter key calls onEnter (no real newline)
 * - Escape calls onEscape if provided
 * - All other props forwarded to <textarea>
 */
const AutoTextarea = forwardRef(function AutoTextarea(
  { value, onChange, onEnter, onEscape, onBlur, className, style, placeholder, ...rest },
  ref
) {
  const innerRef = useRef(null)

  // Expose the inner DOM node via the forwarded ref
  useImperativeHandle(ref, () => innerRef.current)

  // Auto-resize every time value changes
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (onEnter) onEnter()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (onEscape) onEscape()
    }
  }

  return (
    <textarea
      ref={innerRef}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.45',
        ...style,
      }}
      className={className}
      {...rest}
    />
  )
})

export default AutoTextarea
