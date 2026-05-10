import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

const NEG_LABELS = [
  { key: 'neg_belief',  label: 'Crença limitante' },
  { key: 'neg_causes',  label: 'Causas' },
  { key: 'neg_feeling', label: 'Sentimento' },
  { key: 'neg_result',  label: 'Resultado' },
]

const POS_LABELS = [
  { key: 'pos_action',  label: 'Ação' },
  { key: 'pos_feeling', label: 'Novo sentimento' },
  { key: 'pos_impact',  label: 'Impacto' },
  { key: 'pos_belief',  label: 'Nova crença' },
]

export default function MentalPatternSaved({ pattern, onBack }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
      >
        <ArrowLeft size={14} /> Voltar para lista
      </button>

      {/* Confirmação */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-card p-8 text-center space-y-3">
        <div className="text-4xl">✨</div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900">
          Padrão registrado
        </h2>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Você deu um passo importante. Sua nova crença foi salva.
        </p>
        <div className="mt-4 bg-[#C8841A]/8 border border-[#C8841A]/20 rounded-xl px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C8841A] mb-1">
            Nova crença
          </p>
          <p className="text-base font-medium text-zinc-800">
            {pattern.pos_belief}
          </p>
        </div>
      </div>

      {/* Expansão — ver detalhes */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-2"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes completos'}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Polo Negativo */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Polo Negativo
              </h3>
            </div>
            {NEG_LABELS.map(({ key, label }) => pattern[key] && (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
                <p className="text-sm text-zinc-700">{pattern[key]}</p>
              </div>
            ))}
          </div>

          {/* Polo Positivo */}
          <div className="bg-white border border-[#C8841A]/20 rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-2 h-2 rounded-full bg-[#C8841A]" />
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#C8841A]">
                Polo Positivo
              </h3>
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
