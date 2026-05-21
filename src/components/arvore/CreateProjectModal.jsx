import { useState, useRef, useEffect } from 'react'

export default function CreateProjectModal({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSave() {
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="arvore-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="arvore-modal">
        <div className="arvore-modal__glyph">🌱</div>
        <h2 className="arvore-modal__heading">Árvore da Vida</h2>
        <p className="arvore-modal__sub">dê um nome à sua nova jornada</p>
        <input
          ref={inputRef}
          className="arvore-modal__input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
          placeholder="nome do projeto"
        />
        <div className="arvore-modal__actions">
          <button className="arvore-modal__cancel" onClick={onCancel}>cancelar</button>
          <button className="arvore-modal__save" onClick={handleSave} disabled={!name.trim()}>
            plantar semente
          </button>
        </div>
      </div>
    </div>
  )
}
