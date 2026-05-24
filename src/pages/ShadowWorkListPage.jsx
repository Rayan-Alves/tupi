import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { useShadowWork } from '../hooks/useShadowWork'

function spiralPath(turns, aStart, aGrow, samples) {
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * turns * Math.PI * 2
    const r = aStart + aGrow * t
    d += (i === 0 ? 'M' : 'L') + (Math.cos(t)*r).toFixed(2) + ' ' + (Math.sin(t)*r).toFixed(2) + ' '
  }
  return d
}
function SpiralIcon({ size = 14, color = 'rgba(200,132,26,0.6)' }) {
  const p = spiralPath(2.6, 0.4, 1.6, 200)
  const h = 18
  return (
    <svg width={size} height={size} viewBox={`${-h} ${-h} ${h*2} ${h*2}`} fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d={p}/>
    </svg>
  )
}

const AES_LABELS  = { dark: 'dark', paper: 'papel', mono: 'mono', cinema: 'cinema' }
const NODE_LABELS = { cards: 'cards', floating: 'flutuar', organic: 'orgânico', tags: 'tags' }

export default function ShadowWorkListPage() {
  const navigate = useNavigate()
  const { sessions, loading, deleteSession } = useShadowWork()

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-zinc-900">Shadow Work</h1>
          <p className="text-sm text-zinc-400 mt-1">fluxo de consciência · mapeamento das sombras</p>
        </div>
        <button
          onClick={() => navigate('/shadow-work/new')}
          className="btn-primary flex-shrink-0"
        >
          <Plus size={14} /> nova sessão
        </button>
      </div>

      {/* sessions */}
      {loading ? null : sessions.length === 0 ? (
        <div
          onClick={() => navigate('/shadow-work/new')}
          className="flex flex-col items-center gap-6 py-20 cursor-pointer"
        >
          <SpiralIcon size={48} color="rgba(0,0,0,0.15)" />
          <p className="text-sm text-zinc-400 italic">nenhuma sessão ainda — clique para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sessions.map(s => {
            const date = new Date(s.updated_at || s.created_at)
            const label = s.title || 'sessão sem título'
            const sub   = [AES_LABELS[s.canvas_aes], NODE_LABELS[s.node_style]].filter(Boolean).join(' · ')
            const dateStr = date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })

            return (
              <div
                key={s.id}
                onClick={() => navigate('/shadow-work/' + s.id)}
                className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-card cursor-pointer transition-all"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                  <SpiralIcon size={16} color="rgba(200,132,26,0.7)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-zinc-800 truncate">{label}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{sub}{sub ? ' · ' : ''}{dateStr}</p>
                </div>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
