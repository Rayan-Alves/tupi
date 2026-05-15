import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function CoverImg({ book, size = 56 }) {
  const h = Math.round(size * 1.45)
  if (book.cover_url) {
    return (
      <img
        src={book.cover_url}
        alt={book.title}
        style={{ width: size, height: h, objectFit: 'cover', borderRadius: 3 }}
        className="shadow-md flex-shrink-0"
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: h,
        background: '#8B5A2B', color: '#F5F0E8',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: 6,
        borderRadius: 3, fontFamily: 'Georgia, serif',
      }}
      className="shadow-md flex-shrink-0"
    >
      <div style={{ fontSize: 7 }} className="tracking-[0.18em] uppercase font-bold opacity-80">Library</div>
      <div style={{ fontSize: 9 }} className="font-medium leading-tight line-clamp-3">{book.title}</div>
    </div>
  )
}

function PageEditor({ book, userId, onPageChange }) {
  const [page, setPage] = useState(book.current_page || 0)
  const dirty = useRef(false)
  useEffect(() => { setPage(book.current_page || 0) }, [book.id, book.current_page])

  async function commit(value) {
    const next = Math.min(Math.max(0, parseInt(value) || 0), book.total_pages || 99999)
    if (next === book.current_page) return
    setPage(next)
    onPageChange?.(book.id, next)
    await supabase.from('books').update({
      current_page: next,
      updated_at: new Date().toISOString(),
    }).eq('id', book.id).eq('user_id', userId)
  }

  const total = book.total_pages || 0
  const pct   = total ? Math.min(100, Math.round((page / total) * 100)) : 0

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="number"
        value={page}
        onChange={e => { setPage(e.target.value); dirty.current = true }}
        onBlur={e => dirty.current && commit(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (e.target.blur())}
        className="w-14 px-2 py-1 bg-white/70 border border-zinc-300/60 rounded text-[12px] text-zinc-900 outline-none focus:border-zinc-500 tabular-nums text-center"
      />
      <span className="text-[11px] text-zinc-500 tabular-nums whitespace-nowrap">/ {total || '—'}</span>
      <div className="flex-1 h-[3px] bg-white/60 rounded-full overflow-hidden min-w-[40px]">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: '#8B5A2B' }}
        />
      </div>
      <span className="text-[11px] text-zinc-600 tabular-nums whitespace-nowrap font-medium">{pct}%</span>
    </div>
  )
}

export default function ReadingWidget() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBooks(data)
        setLoading(false)
      })
  }, [user?.id])

  const stats = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const finished = books.filter(b => b.status === 'finished')
    const finishedYear = finished.filter(b => b.finished_at && b.finished_at >= yearStart)
    const reading  = books.filter(b => b.status === 'reading')
    const pages    = finished.reduce((s, b) => s + (b.total_pages || 0), 0)
                   + reading.reduce((s, b)  => s + (b.current_page || 0), 0)
    return {
      finishedYear: finishedYear.length,
      pages,
      reading,
      shelf: books.filter(b => b.status !== 'finished').slice(0, 6),
    }
  }, [books])

  function applyPageChange(id, page) {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, current_page: page } : b))
  }

  if (loading) return null

  const noBooks = books.length === 0
  const current = stats.reading[0]

  return (
    <section
      className="rounded-3xl px-6 py-5 flex flex-col"
      style={{ background: '#EFE7D8', border: '1px solid rgba(196,168,130,0.35)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(196,168,130,0.4)' }}
          >
            <BookOpen size={15} style={{ color: '#8B5A2B' }} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[20px] font-medium text-zinc-900 leading-none tracking-tight truncate">
            {t('library.myReadingLife')}
          </h2>
        </div>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 bg-white/70 hover:bg-white text-zinc-900 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors border border-zinc-300/40 flex-shrink-0"
          title={t('library.enterLibrary')}
        >
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Body */}
      {noBooks ? (
        <div className="text-center py-6 flex-1 flex flex-col justify-center">
          <p className="text-[13px] text-zinc-500 italic font-display mb-3">
            {t('library.emptyLibraryHint')}
          </p>
          <button
            onClick={() => navigate('/library')}
            className="text-[12px] font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors mx-auto"
          >
            {t('library.addFirstBook')}
          </button>
        </div>
      ) : current ? (
        <div className="flex gap-4 flex-1">
          <CoverImg book={current} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] tracking-[0.22em] uppercase text-zinc-500 mb-1 font-medium">
              {t('library.currentlyReading')}
            </div>
            <button
              onClick={() => navigate(`/library/${current.id}`)}
              className="font-display text-[18px] font-medium text-zinc-900 leading-tight mb-0.5 truncate text-left hover:underline decoration-zinc-400 underline-offset-2 w-full"
            >
              {current.title}
            </button>
            <div className="text-[11px] text-zinc-500 truncate mb-1">
              {[current.author, current.year].filter(Boolean).join(' · ')}
            </div>
            <PageEditor book={current} userId={user.id} onPageChange={applyPageChange} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[13px] text-zinc-500 italic font-display py-4">
          {t('library.nothingReadingNow')}
        </div>
      )}

      {/* Footer: stats + shelf */}
      <div className="mt-5 pt-4 border-t border-zinc-300/50 flex items-center justify-between gap-4">
        <div className="flex gap-4 text-[11px] tabular-nums whitespace-nowrap">
          <div>
            <span className="font-display text-[16px] font-medium text-zinc-900 leading-none">{stats.finishedYear}</span>
            <span className="text-zinc-500 ml-1">{t('library.finished').toLowerCase()}</span>
          </div>
          <div>
            <span className="font-display text-[16px] font-medium text-zinc-900 leading-none">{stats.pages}</span>
            <span className="text-zinc-500 ml-1">{t('library.pages')}</span>
          </div>
        </div>
        {stats.shelf.length > 0 && (
          <div className="flex gap-1.5 overflow-hidden">
            {stats.shelf.slice(0, 4).map(book => (
              <button
                key={book.id}
                onClick={() => navigate(`/library/${book.id}`)}
                className="transition-transform hover:-translate-y-0.5 flex-shrink-0"
                title={book.title}
              >
                <CoverImg book={book} size={24} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
