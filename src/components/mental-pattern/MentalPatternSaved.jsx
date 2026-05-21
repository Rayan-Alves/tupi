import { useState } from 'react'
import { ArrowLeft, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NEG_KEYS = ['neg_belief', 'neg_causes', 'neg_feeling', 'neg_result']
const POS_KEYS = ['pos_action', 'pos_feeling', 'pos_impact',  'pos_belief']

export default function MentalPatternSaved({ pattern, onBack, onEdit }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const NEG_LABELS = NEG_KEYS.map(key => ({ key, label: t(`mentalPattern.shortLabels.${key}`) }))
  const POS_LABELS = POS_KEYS.map(key => ({ key, label: t(`mentalPattern.shortLabels.${key}`) }))

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

      {/* Title */}
      <div className="text-center pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{t('mentalPattern.savedBelief')}</p>
        <p className="text-xl font-semibold text-zinc-800 mt-1 max-w-xs mx-auto">
          {pattern.pos_belief}
        </p>
      </div>

      {/* Two-column card */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-card overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-zinc-100">
          {/* Polo Negativo */}
          <div className="bg-zinc-50 p-5 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              {t('mentalPattern.poleNegative')}
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {pattern.neg_belief || <span className="text-zinc-300 italic">—</span>}
            </p>
          </div>

          {/* Polo Positivo */}
          <div className="bg-[#fdf8f0] p-5 space-y-1 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8841A]">
                {t('mentalPattern.polePositive')}
              </p>
              {onEdit && (
                <button
                  onClick={() => onEdit(pattern)}
                  className="p-1 rounded-lg text-[#C8841A]/50 hover:text-[#C8841A] hover:bg-[#C8841A]/10 transition-all"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {pattern.pos_belief || <span className="text-zinc-300 italic">—</span>}
            </p>
          </div>
        </div>

        {/* Expandable row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-2 py-3 border-t border-zinc-100 text-[11px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? t('mentalPattern.hideDetails') : t('mentalPattern.expandFull')}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Polo Negativo details */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{t('mentalPattern.poleNegative')}</p>
            </div>
            {NEG_LABELS.map(({ key, label }) => pattern[key] && (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300 mb-0.5">{label}</p>
                <p className="text-sm text-zinc-600">{pattern[key]}</p>
              </div>
            ))}
          </div>

          {/* Polo Positivo details */}
          <div className="bg-[#fdf8f0] border border-[#C8841A]/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#C8841A]/15">
              <div className="w-2 h-2 rounded-full bg-[#C8841A]" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C8841A]">{t('mentalPattern.polePositive')}</p>
            </div>
            {POS_LABELS.map(({ key, label }) => pattern[key] && (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
                <p className="text-sm text-zinc-700">{pattern[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
