import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

let draftCounter = 0

function DraftRow({ value, onChange, onCommit, onDelete, placeholder }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="group flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl px-5 py-3 transition-colors focus-within:border-spirit">
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onCommit() } }}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 outline-none text-[15px] text-zinc-800 placeholder-zinc-400"
      />
      <button
        onClick={onDelete}
        className="text-zinc-300 hover:text-red-500 transition-colors"
        aria-label="Remover"
      >
        <X size={16} />
      </button>
    </div>
  )
}

function SavedRow({ title, onClick, onDelete, untitledLabel }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl px-5 py-3 cursor-pointer hover:border-spirit hover:shadow-sm transition-all"
    >
      <span className="flex-1 text-[15px] text-zinc-800" style={{ fontFamily: 'Georgia, serif' }}>
        {title || untitledLabel}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Excluir"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function DesireList() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('direction_desires').select('id, title')
      .eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map(d => ({ id: d.id, title: d.title || '', isDraft: false })))
        setLoading(false)
      })
  }, [user?.id])

  function addDraft() {
    const id = `draft-${++draftCounter}`
    setItems(prev => [...prev, { id, title: '', isDraft: true }])
  }

  function updateDraft(id, title) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, title } : it))
  }

  async function commitDraft(id) {
    const item = items.find(it => it.id === id)
    if (!item || !item.title.trim()) return
    const { data } = await supabase.from('direction_desires')
      .insert({ user_id: user.id, title: item.title.trim() })
      .select().single()
    if (data) navigate(`/desejos/${data.id}`)
  }

  function removeDraft(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  async function deleteItem(id) {
    if (!window.confirm(t('spirit.desires.deleteConfirm'))) return
    setItems(prev => prev.filter(it => it.id !== id))
    await supabase.from('direction_desires').delete().eq('id', id).eq('user_id', user.id)
  }

  if (loading) return null

  return (
    <div className="space-y-2">
      {items.map(it => (
        it.isDraft ? (
          <DraftRow
            key={it.id}
            value={it.title}
            onChange={v => updateDraft(it.id, v)}
            onCommit={() => commitDraft(it.id)}
            onDelete={() => removeDraft(it.id)}
            placeholder={t('spirit.desires.placeholder')}
          />
        ) : (
          <SavedRow
            key={it.id}
            title={it.title}
            onClick={() => navigate(`/desejos/${it.id}`)}
            onDelete={() => deleteItem(it.id)}
            untitledLabel={t('spirit.desires.untitled')}
          />
        )
      ))}
      <button
        onClick={addDraft}
        className="flex items-center gap-1.5 px-2 py-2 text-[13px] text-zinc-400 hover:text-spirit transition-colors"
      >
        <Plus size={15} /> {t('spirit.desires.add')}
      </button>
    </div>
  )
}
