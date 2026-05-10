import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'

const NEG_FIELDS = [
  { key: 'neg_belief',  label: 'Qual é a crença limitante?',         placeholder: 'Ex: Eu nunca consigo terminar nada…' },
  { key: 'neg_causes',  label: 'O que causa essa crença?',            placeholder: 'Situações, pessoas, memórias…' },
  { key: 'neg_feeling', label: 'Como isso te faz sentir?',            placeholder: 'Emoções, sensações no corpo…' },
  { key: 'neg_result',  label: 'Qual o resultado disso na sua vida?', placeholder: 'O que essa crença te impede de fazer…' },
]

const POS_FIELDS = [
  { key: 'pos_action',  label: 'Que ação você pode tomar?', placeholder: 'Um pequeno passo concreto…' },
  { key: 'pos_feeling', label: 'Como isso te fará sentir?', placeholder: 'A emoção que vem com essa ação…' },
  { key: 'pos_impact',  label: 'Qual será o impacto?',      placeholder: 'O que muda na sua vida…' },
  { key: 'pos_belief',  label: 'Qual é sua nova crença?',   placeholder: 'Ex: Eu sou capaz de completar o que começo…' },
]

function Field({ label, placeholder, value, onChange, onEnter, autoFocus, disabled }) {
  const ref = useRef(null)

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus()
  }, [autoFocus])

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter?.()
    }
  }

  return (
    <div className={`space-y-1.5 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="w-full resize-none bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-500 focus:ring-0 text-sm text-zinc-800 placeholder-zinc-300 py-1.5 transition-colors"
      />
    </div>
  )
}

export default function MentalPatternExercise({ pattern, onSave, onBack }) {
  const [form, setForm] = useState({
    neg_belief:  pattern?.neg_belief  || '',
    neg_causes:  pattern?.neg_causes  || '',
    neg_feeling: pattern?.neg_feeling || '',
    neg_result:  pattern?.neg_result  || '',
    pos_action:  pattern?.pos_action  || '',
    pos_feeling: pattern?.pos_feeling || '',
    pos_impact:  pattern?.pos_impact  || '',
    pos_belief:  pattern?.pos_belief  || '',
  })
  const [saving, setSaving] = useState(false)
  const [activeField, setActiveField] = useState(0)

  const allFields = [...NEG_FIELDS, ...POS_FIELDS]
  const negComplete = NEG_FIELDS.every(f => form[f.key].trim().length > 0)

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function advanceTo(index) {
    if (index < allFields.length) setActiveField(index)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(pattern.id, form)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* Polo Negativo */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-card p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <div className="w-2 h-2 rounded-full bg-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Polo Negativo — a crença atual
          </h3>
        </div>
        {NEG_FIELDS.map((f, i) => (
          <Field
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={val => set(f.key, val)}
            onEnter={() => advanceTo(i + 1)}
            autoFocus={activeField === i}
          />
        ))}
      </div>

      {/* Polo Positivo */}
      <div className={`bg-white border rounded-2xl shadow-card p-6 space-y-6 transition-all ${
        negComplete ? 'border-[#C8841A]/30' : 'border-zinc-100'
      }`}>
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          {negComplete
            ? <div className="w-2 h-2 rounded-full bg-[#C8841A]" />
            : <Lock size={12} className="text-zinc-300" />
          }
          <h3 className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${
            negComplete ? 'text-[#C8841A]' : 'text-zinc-300'
          }`}>
            Polo Positivo — a nova crença
          </h3>
          {!negComplete && (
            <span className="ml-auto text-[10px] text-zinc-300">
              complete o polo negativo primeiro
            </span>
          )}
        </div>
        {POS_FIELDS.map((f, i) => (
          <Field
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={val => set(f.key, val)}
            onEnter={() => advanceTo(NEG_FIELDS.length + i + 1)}
            autoFocus={activeField === NEG_FIELDS.length + i}
            disabled={!negComplete}
          />
        ))}
      </div>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving || !negComplete}
          className="px-6 py-2.5 rounded-xl bg-[#C8841A] hover:bg-[#b8750a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
        >
          {saving ? 'Salvando…' : 'Salvar padrão'}
        </button>
      </div>
    </div>
  )
}
