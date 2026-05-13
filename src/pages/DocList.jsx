import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, FileText, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function fmtRel(d, t, i18nNs) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60) return t(`${i18nNs}.timeAgo.now`)
  if (diff < 3600) return Math.floor(diff / 60) + 'min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  const days = Math.floor(diff / 86400)
  if (days < 7) return days + 'd'
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getFullYear()).slice(2)}`
}

function DocTile({ doc, onClick, onDelete, t, i18nNs }) {
  const preview = stripHtml(doc.content_1 || doc.content_2 || doc.content_3)
  return (
    <div onClick={onClick} className="group relative cursor-pointer bg-white border border-zinc-200 rounded-xl p-5 transition-all duration-200 hover:border-[#8B5A2B] hover:shadow-lg"
      style={{ aspectRatio: '4 / 3', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all border border-zinc-100"
        aria-label={t(`${i18nNs}.delete`)}>
        <Trash2 size={12} />
      </button>
      <FileText size={20} className="text-[#8B5A2B] mb-3 flex-shrink-0" />
      <div className="font-semibold text-zinc-900 text-[15px] leading-snug mb-1.5 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
        {doc.title || t(`${i18nNs}.untitled`)}
      </div>
      {doc.subtitle && (
        <div className="text-xs text-zinc-500 mb-2 line-clamp-1" style={{ fontFamily: 'Georgia, serif' }}>
          {doc.subtitle}
        </div>
      )}
      {preview && (
        <div className="text-[12px] text-zinc-500 leading-relaxed flex-1 overflow-hidden line-clamp-4">
          {preview}
        </div>
      )}
      <div className="mt-auto pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
        {fmtRel(doc.updated_at || doc.created_at, t, i18nNs)}
      </div>
    </div>
  )
}

function NewDocTile({ onClick, t, i18nNs }) {
  return (
    <div onClick={onClick} className="group cursor-pointer bg-[#FFFBF1] border-[1.5px] border-dashed border-[#C4A882] rounded-xl p-5 transition-all duration-200 hover:bg-[#FAF0E0] hover:border-[#8B5A2B] flex flex-col items-center justify-center text-center"
      style={{ aspectRatio: '4 / 3' }}>
      <div className="w-12 h-12 rounded-full bg-[#FAF0E0] group-hover:bg-[#F0E2C7] flex items-center justify-center mb-3 transition-colors">
        <Plus size={22} className="text-[#8B5A2B]" />
      </div>
      <div className="font-semibold text-[#8B5A2B] text-[14px]">{t(`${i18nNs}.newDocument`)}</div>
      <div className="text-[11px] text-[#a78a5f] mt-1 italic">{t(`${i18nNs}.clickToStart`)}</div>
    </div>
  )
}

export default function DocList({ table, basePath, i18nNs, introKey, introPromptKey }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [introHidden, setIntroHidden] = useState(() => {
    try { return localStorage.getItem(introKey) === '1' } catch { return false }
  })

  function hideIntro() {
    setIntroHidden(true)
    try { localStorage.setItem(introKey, '1') } catch {}
  }

  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*')
      .eq('user_id', user.id).order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDocs(data)
        setLoading(false)
      })
  }, [user?.id, table])

  async function createNew() {
    const { data } = await supabase.from(table)
      .insert({ user_id: user.id, title: '', subtitle: '' })
      .select().single()
    if (data) {
      setDocs(prev => [data, ...prev])
      navigate(`${basePath}/${data.id}`)
    }
  }

  async function deleteDoc(id) {
    if (!window.confirm(t(`${i18nNs}.deleteConfirm`))) return
    setDocs(prev => prev.filter(d => d.id !== id))
    await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {!introHidden && (
        <div className="relative pr-8 mb-8 max-w-2xl">
          <p className="text-[15px] leading-relaxed text-zinc-400 italic" style={{ fontFamily: 'Georgia, serif' }}>
            {t(introPromptKey)}
          </p>
          <button
            onClick={hideIntro}
            aria-label={t(`${i18nNs}.hidePrompt`)}
            className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <NewDocTile onClick={createNew} t={t} i18nNs={i18nNs} />
        {docs.map(d => (
          <DocTile key={d.id} doc={d} onClick={() => navigate(`${basePath}/${d.id}`)} onDelete={() => deleteDoc(d.id)} t={t} i18nNs={i18nNs} />
        ))}
      </div>
    </div>
  )
}
