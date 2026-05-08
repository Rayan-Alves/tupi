import { useState, useRef, useEffect } from 'react'

const LEAF_PATH = 'M60 6 C78 6 108 22 110 50 C112 76 88 90 60 90 C32 90 8 76 10 50 C12 22 42 6 60 6 Z'

function LeafSVG({ isNew = false }) {
  const stroke = isNew ? '#C8841A' : '#C4A882'
  const fill   = isNew ? '#F5F0E8' : '#EEE8DC'
  return (
    <svg viewBox="0 0 120 96" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
      <path
        d={LEAF_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        strokeDasharray={isNew ? '5 3' : undefined}
      />
      {/* Central vein */}
      <line x1="60" y1="8" x2="60" y2="88" stroke={stroke} strokeWidth="0.7" opacity="0.35" />
      {/* Side veins */}
      <path d="M60 32 Q44 40 36 50" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
      <path d="M60 46 Q76 52 86 60" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
      <path d="M60 60 Q46 66 40 74" fill="none" stroke={stroke} strokeWidth="0.4" opacity="0.25" />
      <path d="M60 38 Q72 42 80 48" fill="none" stroke={stroke} strokeWidth="0.4" opacity="0.25" />
    </svg>
  )
}

export default function LeafCard({ project, onClick, isNew = false, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isNew) setTimeout(() => inputRef.current?.focus(), 40)
  }, [isNew])

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); if (title.trim()) onSave(title.trim()) }
    if (e.key === 'Escape') onCancel()
  }

  function handleBlur() {
    if (title.trim()) onSave(title.trim())
    else onCancel()
  }

  const pct = project?.progress ?? 0

  return (
    <div className="flex flex-col items-center">
      {/* Stem */}
      <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #C4A882)' }} />

      {/* Leaf */}
      <div
        role={isNew ? undefined : 'button'}
        tabIndex={isNew ? undefined : 0}
        aria-label={isNew ? 'Novo projeto' : `Abrir projeto ${project?.title}`}
        onClick={isNew ? undefined : onClick}
        onKeyDown={isNew ? undefined : e => e.key === 'Enter' && onClick()}
        className={`relative w-[120px] h-[96px] ${!isNew ? 'cursor-pointer transition-transform duration-[250ms] hover:-translate-y-[5px] hover:rotate-[2deg]' : ''} focus:outline-none`}
      >
        <LeafSVG isNew={isNew} />

        {/* Content overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-3 pb-2 pt-3">
          {isNew ? (
            <>
              <input
                ref={inputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="nome..."
                aria-label="Nome do novo projeto"
                className="w-20 text-center text-[12px] bg-transparent border-0 border-b border-[#C8841A] focus:ring-0 text-[#1A3A1F] placeholder-[#C4A882] font-sans py-0.5 block mx-auto"
              />
              <span className="text-[10px] text-[#C4A882] mt-1">enter para salvar</span>
            </>
          ) : (
            <>
              <span className="text-[12px] font-medium text-[#1A3A1F] text-center leading-snug break-words line-clamp-3 font-sans">
                {project?.title || '—'}
              </span>
              {pct > 0 && (
                <span className="text-[10px] text-[#633806] mt-0.5">{pct}%</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
