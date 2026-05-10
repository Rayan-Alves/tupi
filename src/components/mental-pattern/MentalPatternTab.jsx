import { Trash2, Pencil } from 'lucide-react'

export default function MentalPatternTab({ patterns, onNew, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      {patterns.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-zinc-400 text-sm italic">
            clique em + para trabalhar sua primeira crença
          </p>
        </div>
      ) : (
        patterns.map(p => (
          <div
            key={p.id}
            className="group flex items-center justify-between gap-3 bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-card hover:border-zinc-200 transition-all cursor-pointer"
            onClick={() => onEdit(p)}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">
                Nova crença
              </p>
              <p className="text-sm font-medium text-zinc-800 truncate">
                {p.pos_belief || <span className="text-zinc-400 italic">em andamento…</span>}
              </p>
              {p.neg_belief && (
                <p className="text-[11px] text-zinc-400 truncate mt-0.5 line-through">
                  {p.neg_belief}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); onEdit(p) }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-[#C8841A] hover:bg-[#C8841A]/10 transition-all"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
