import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { ArrowLeft, Trash2, Check, Save } from 'lucide-react'

function AutoTextarea({ value, onChange, placeholder, className = '' }) {
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = el.scrollHeight + 'px'
  }, [])
  useLayoutEffect(() => { resize() })
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`w-full resize-none bg-transparent border-0 focus:ring-0 p-0 placeholder-zinc-300 ${className}`}
    />
  )
}

export default function PensamentoView({ pensamento, onBack, onSave, onDelete }) {
  const [title, setTitle] = useState(pensamento.title || '')
  const [body, setBody] = useState(pensamento.body || '')
  const [status, setStatus] = useState('clean')
  const titleRef = useRef(null)

  useEffect(() => {
    if (!pensamento.title) titleRef.current?.focus()
  }, [])

  function markDirty() { setStatus('dirty') }

  async function handleSave() {
    setStatus('saving')
    await onSave(pensamento.id, { title: title.trim(), body: body.trim() })
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }

  async function handleDelete() {
    if (!window.confirm('Excluir este pensamento?')) return
    await onDelete(pensamento.id)
    onBack()
  }

  const saveStyles = {
    clean:  'bg-zinc-100 text-zinc-400 cursor-default',
    dirty:  'bg-mind hover:bg-[#b8750a] text-white shadow-sm cursor-pointer',
    saving: 'bg-[#e0a840] text-white cursor-wait',
    saved:  'bg-emerald-500 text-white cursor-default',
  }
  const saveLabels = { clean: 'Salvo', dirty: 'Salvar', saving: 'Salvando…', saved: 'Salvo ✓' }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={14} /> voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={status === 'dirty' ? handleSave : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${saveStyles[status]}`}
          >
            {status === 'saved' ? <Check size={11} /> : <Save size={11} />}
            {saveLabels[status]}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <input
          ref={titleRef}
          value={title}
          onChange={e => { setTitle(e.target.value); markDirty() }}
          placeholder="Título do pensamento…"
          className="w-full bg-transparent border-0 focus:ring-0 p-0 font-display text-2xl font-semibold text-zinc-900 placeholder-zinc-300"
        />
        <div className="border-t border-zinc-100 pt-6">
          <AutoTextarea
            value={body}
            onChange={v => { setBody(v); markDirty() }}
            placeholder="Escreva seus pensamentos aqui…"
            className="text-sm text-zinc-700 leading-relaxed min-h-[200px]"
          />
        </div>
      </div>
    </div>
  )
}
