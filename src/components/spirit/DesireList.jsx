import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, X, CornerDownLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ROMAN_MAP = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100],  ['XC', 90],  ['L', 50],  ['XL', 40],
  ['X', 10],   ['IX', 9],   ['V', 5],   ['IV', 4],
  ['I', 1],
]
function toRoman(n) {
  let r = ''
  for (const [s, v] of ROMAN_MAP) { while (n >= v) { r += s; n -= v } }
  return r
}

function timeAgo(ts, t) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const day = 24 * 60 * 60 * 1000
  const days = Math.floor(diff / day)
  if (days < 1)  return 'hoje'
  if (days < 2)  return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(days / 365)
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`
}

export default function DesireList() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    supabase.from('direction_desires').select('id, title, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map(d => ({
          id: d.id,
          title: d.title || '',
          createdAt: new Date(d.created_at).getTime(),
        })))
        setLoading(false)
      })
  }, [user?.id])

  async function submit() {
    const title = draft.trim()
    if (!title) return
    const { data } = await supabase.from('direction_desires')
      .insert({ user_id: user.id, title })
      .select().single()
    if (data) {
      setDraft('')
      navigate(`/desejos/${data.id}`)
    }
  }

  async function deleteItem(e, id) {
    e.stopPropagation()
    if (!window.confirm(t('spirit.desires.deleteConfirm'))) return
    setItems(prev => prev.filter(it => it.id !== id))
    await supabase.from('direction_desires').delete().eq('id', id).eq('user_id', user.id)
  }

  if (loading) return null

  return (
    <div>
      {items.length > 0 && (
        <>
          {/* Meta row */}
          <div className="flex items-center justify-between pb-3 mb-1 border-b border-zinc-200/60">
            <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 font-medium">
              {t('spirit.desires.savedLabel')}
            </span>
            <span className="text-[13px] tabular-nums text-zinc-700">
              <span className="font-display text-[16px] mr-1">{items.length}</span>
              <span className="italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                {items.length === 1 ? 'desejo' : 'desejos'}
              </span>
            </span>
          </div>

          {/* List */}
          <div>
            {items.map((it, idx) => (
              <div
                key={it.id}
                onClick={() => navigate(`/desejos/${it.id}`)}
                className="group flex items-start gap-6 py-5 border-b border-zinc-200/60 cursor-pointer hover:bg-white/40 -mx-2 px-2 rounded transition-colors"
              >
                <div
                  className="text-zinc-400 font-normal flex-shrink-0 leading-none mt-1"
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: 28,
                    minWidth: 36,
                    textAlign: 'left',
                  }}
                >
                  {toRoman(idx + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[#5C3D1A] leading-tight"
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 24,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {it.title || '—'}.
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] tracking-[0.14em] uppercase text-zinc-500">
                    <span>{t('spirit.desires.firstWhisper')}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{timeAgo(it.createdAt, t)}</span>
                  </div>
                </div>
                <button
                  onClick={e => deleteItem(e, it.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all mt-2 flex-shrink-0"
                  aria-label="excluir"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Composer */}
      <div className="mt-6 flex items-center gap-3 px-2 py-2 rounded-full bg-white border border-zinc-200 focus-within:border-[#8B5A2B]/40 transition-colors">
        <button
          onClick={() => inputRef.current?.focus()}
          className="flex-shrink-0 w-9 h-9 rounded-full border border-zinc-200 bg-white hover:border-[#8B5A2B] hover:text-[#8B5A2B] text-zinc-400 flex items-center justify-center transition-colors"
          tabIndex={-1}
          aria-label="adicionar"
        >
          <Plus size={15} />
        </button>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder={t('spirit.desires.newPlaceholder')}
          className="flex-1 bg-transparent border-0 outline-none text-[15px] text-zinc-800 placeholder-zinc-400 min-w-0"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 18 }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 text-[11px] tracking-[0.16em] uppercase font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100 disabled:hover:text-zinc-600"
        >
          {t('spirit.desires.send')}
          <CornerDownLeft size={11} />
        </button>
      </div>
    </div>
  )
}
