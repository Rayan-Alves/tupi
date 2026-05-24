import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/* ─── Design tokens (scoped) ──────────────────────────────────────────────── */
const T = {
  igapo:        '#1A3A1F',
  tabatinga:    '#C4A882',
  paper:        '#FDFAF3',
  neblina:      '#F5F0E8',
  phasePlantar: '#5A6E4C',
  fontHead:     "'Cormorant Garamond', Georgia, serif",
  fontBody:     "'Plus Jakarta Sans', -apple-system, sans-serif",
}

/**
 * NewProjectModal — paper card overlay for creating a new project.
 *
 * Visual:
 *   • Sprout glyph floating above the card
 *   • "Árvore da Vida" serif title
 *   • "dê um nome à sua nova jornada" italic subtitle
 *   • Single italic input — "nome do projeto"
 *   • Two pill buttons: outline cancel · filled sage "plantar semente"
 *
 * Behavior: Enter or "plantar semente" → onConfirm(title). Empty title disables submit.
 */
export default function NewProjectModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setSubmitting(false)
      // delay so the modal mounts and focus lands correctly
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const canSubmit = title.trim().length > 0 && !submitting

  async function handleConfirm() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onConfirm(title.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40, 32, 22, 0.32)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'np-fade-in .2s ease-out',
      }}
    >
      <style>{`
        @keyframes np-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes np-rise-in  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .np-input::placeholder { color: rgba(196, 168, 130, 0.7); font-style: italic; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 480,
          background: T.paper,
          borderRadius: 20,
          padding: '52px 40px 32px',
          boxShadow: '0 30px 60px rgba(60, 45, 20, 0.18), 0 6px 18px rgba(60, 45, 20, 0.08)',
          fontFamily: T.fontBody,
          animation: 'np-rise-in .3s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        {/* Sprout glyph floating */}
        <div style={{
          position: 'absolute',
          top: -28, left: '50%', transform: 'translateX(-50%)',
          width: 56, height: 56, borderRadius: '50%',
          background: T.neblina,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(60,45,20,0.08)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={T.phasePlantar} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21 L 12 12" />
            <path d="M12 14 C 8 14, 6 11, 6 8 C 9 8, 12 10, 12 14 Z" />
            <path d="M12 12 C 16 12, 18 9, 18 6 C 15 6, 12 8, 12 12 Z" />
          </svg>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontFamily: T.fontHead,
          fontSize: 38, lineHeight: 1.05,
          color: T.igapo,
          letterSpacing: '-0.01em',
          marginBottom: 6,
        }}>
          {t('projects.newProjectModal.treeOfLife')}
        </div>
        <div style={{
          textAlign: 'center',
          fontFamily: T.fontHead, fontStyle: 'italic',
          fontSize: 16, color: 'rgba(60,45,20,0.55)',
          marginBottom: 32,
        }}>
          {t('projects.newProjectModal.subtitle')}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          className="np-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          placeholder={t('projects.newProjectModal.namePh')}
          style={{
            width: '100%',
            border: 'none', outline: 'none',
            background: 'transparent',
            fontFamily: T.fontHead, fontStyle: 'italic',
            fontSize: 22,
            color: T.igapo,
            textAlign: 'center',
            padding: '8px 4px 12px',
            borderBottom: `1px solid ${T.tabatinga}`,
            marginBottom: 32,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              border: `1px solid ${T.tabatinga}`,
              background: 'transparent',
              color: '#8B7E6F',
              fontFamily: T.fontHead, fontStyle: 'italic',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background .2s, color .2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,168,130,0.1)'; e.currentTarget.style.color = T.igapo }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B7E6F' }}
          >
            {t('projects.newProjectModal.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              border: 'none',
              background: canSubmit ? T.phasePlantar : 'rgba(90, 110, 76, 0.4)',
              color: T.paper,
              fontFamily: T.fontHead, fontStyle: 'italic',
              fontSize: 16,
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'background .2s, transform .15s',
            }}
            onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = '#4A5C3F' }}
            onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = T.phasePlantar }}
          >
            {submitting ? t('projects.newProjectModal.planting') : t('projects.newProjectModal.plant')}
          </button>
        </div>
      </div>
    </div>
  )
}
