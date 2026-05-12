import { useState } from 'react'
import { ArrowLeft, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

const NEG_LABELS = [
  { key: 'neg_belief',  label: 'Crença' },
  { key: 'neg_causes',  label: 'Causas' },
  { key: 'neg_feeling', label: 'Sentimento' },
  { key: 'neg_result',  label: 'Resultado' },
]

const POS_LABELS = [
  { key: 'pos_action',  label: 'Ação' },
  { key: 'pos_feeling', label: 'Sentimento' },
  { key: 'pos_impact',  label: 'Impacto' },
  { key: 'pos_belief',  label: 'Nova crença' },
]

export default function MentalPatternSaved({ pattern, onBack, onEdit }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> voltar
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Padrão Mental
        </p>
      </div>

      {/* Title */}
      <div className="text-center pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Crença salva</p>
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
              Polo Negativo
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {pattern.neg_belief || <span className="text-zinc-300 italic">—</span>}
            </p>
          </div>

          {/* Polo Positivo */}
          <div className="bg-[#fdf8f0] p-5 space-y-1 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8841A]">
                Polo Positivo
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
          {expanded ? 'ocultar detalhes' : 'toque para ver o exercício completo'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Polo Negativo details */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Polo Negativo</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C8841A]">Polo Positivo</p>
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
