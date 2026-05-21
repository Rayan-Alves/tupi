import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NEG_KEYS = ['neg_belief', 'neg_causes', 'neg_feeling', 'neg_result']
const POS_KEYS = ['pos_action', 'pos_feeling', 'pos_impact',  'pos_belief']

function Field({ label, placeholder, value, onChange, disabled, autoFocus }) {
  const ref = useRef(null)
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus() }, [autoFocus])

  return (
    <div className={`space-y-1 transition-opacity duration-200 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="w-full resize-none bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-500 focus:ring-0 text-sm text-zinc-800 placeholder-zinc-300 py-1.5 transition-colors"
      />
    </div>
  )
}

export default function MentalPatternExercise({ pattern, onSave, onBack }) {
  const { t } = useTranslation()
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

  const fieldFor = (key) => ({
    key,
    label: t(`mentalPattern.exerciseFields.${key}.label`),
    placeholder: t(`mentalPattern.exerciseFields.${key}.placeholder`),
  })
  const NEG_FIELDS = NEG_KEYS.map(fieldFor)
  const POS_FIELDS = POS_KEYS.map(fieldFor)

  const negComplete = NEG_FIELDS.every(f => form[f.key].trim().length > 0)
  const posComplete = POS_FIELDS.every(f => form[f.key].trim().length > 0)

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSave() {
    setSaving(true)
    await onSave(pattern.id, form)
    setSaving(false)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> {t('mentalPattern.back')}
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          {t('mentalPattern.title')}
        </p>
      </div>

      {/* Kybalion quote */}
      <div className="bg-[#fdf8f0] border border-[#C8841A]/15 rounded-2xl px-5 py-4 text-center">
        <p className="text-[12px] italic text-zinc-500 leading-relaxed">
          {t('mentalPattern.caibalionQuote')}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8841A]/70 mt-2">
          {t('mentalPattern.caibalionSource')}
        </p>
      </div>

      {/* Two-column exercise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Polo Positivo — LEFT (locked until neg complete) */}
        <div className={`rounded-2xl border p-5 space-y-5 transition-all duration-300 ${
          negComplete
            ? 'bg-[#fdf8f0] border-[#C8841A]/30'
            : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            {negComplete
              ? <div className="w-2 h-2 rounded-full bg-[#C8841A]" />
              : <Lock size={11} className="text-zinc-300" />
            }
            <h3 className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${
              negComplete ? 'text-[#C8841A]' : 'text-zinc-300'
            }`}>
              {t('mentalPattern.polePositive')}
            </h3>
            {!negComplete && (
              <span className="ml-auto text-[9px] text-zinc-300 leading-tight text-right">
                {t('mentalPattern.completeNegFirst')}
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
              disabled={!negComplete}
              autoFocus={negComplete && i === 0 && !form[f.key]}
            />
          ))}
        </div>

        {/* Polo Negativo — RIGHT (active) */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 space-y-5 shadow-card">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <div className="w-2 h-2 rounded-full bg-zinc-400" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              {t('mentalPattern.poleNegative')}
            </h3>
          </div>
          {NEG_FIELDS.map((f, i) => (
            <Field
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={val => set(f.key, val)}
              autoFocus={i === 0 && !form[f.key]}
            />
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving || !negComplete || !posComplete}
          className="px-6 py-2.5 rounded-xl bg-[#C8841A] hover:bg-[#b8750a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
        >
          {saving ? t('mentalPattern.saving') : t('mentalPattern.savePattern')}
        </button>
      </div>
    </div>
  )
}
