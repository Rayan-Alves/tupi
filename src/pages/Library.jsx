import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Star } from 'lucide-react'
import { useLibrary } from '../hooks/useLibrary'
import AddBookModal from '../components/library/AddBookModal'

const STATUS = {
  want_to_read: { dotClass: 'bg-blue-500',    textClass: 'text-blue-700',    keyShort: 'wantToRead' },
  reading:      { dotClass: 'bg-amber-600',   textClass: 'text-amber-700',   keyShort: 'reading'    },
  finished:     { dotClass: 'bg-emerald-600', textClass: 'text-emerald-700', keyShort: 'finished'   },
}

function CoverImg({ book, size = 'large' }) {
  const w = size === 'large' ? 160 : 100
  const h = w * 1.45
  if (book.cover_url) {
    return (
      <img
        src={book.cover_url}
        alt={book.title}
        style={{ width: w, height: h, objectFit: 'cover', borderRadius: 4 }}
        className="shadow-md"
      />
    )
  }
  return (
    <div
      style={{
        width: w, height: h,
        background: '#8B5A2B',
        color: '#F5F0E8',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 12, borderRadius: 4,
        fontFamily: 'Georgia, serif',
      }}
      className="shadow-md"
    >
      <div className="text-[9px] tracking-[0.18em] uppercase font-bold opacity-80">Library</div>
      <div className="text-[15px] font-medium leading-tight">{book.title}</div>
    </div>
  )
}

function BookCard({ book, onClick, t }) {
  const meta = STATUS[book.status]
  const pct  = book.total_pages && book.current_page
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col"
    >
      <div className="relative mb-3 transition-transform group-hover:-translate-y-1 duration-200">
        <CoverImg book={book} size="large" />
        {book.rating > 0 && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-900/80 text-white text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-sm"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            <Star size={10} fill="white" /> {book.rating}
          </div>
        )}
      </div>
      <div className="font-display text-[18px] font-medium text-zinc-900 leading-tight mb-0.5 max-w-[160px] line-clamp-2">
        {book.title}
      </div>
      {book.author && (
        <div className="text-[12px] text-zinc-500 mb-2 max-w-[160px] truncate">{book.author}</div>
      )}
      <div className={`text-[10px] tracking-[0.18em] uppercase font-bold ${meta.textClass} flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        {book.status === 'reading' && pct > 0 ? `${pct}% ${t('library.read')}` : t(`library.status.${meta.keyShort}`)}
      </div>
    </div>
  )
}

export default function Library() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { books, loading, addBook } = useLibrary()
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  const counts = useMemo(() => ({
    all:          books.length,
    reading:      books.filter(b => b.status === 'reading').length,
    want_to_read: books.filter(b => b.status === 'want_to_read').length,
    finished:     books.filter(b => b.status === 'finished').length,
  }), [books])

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter)
  const year = new Date().getFullYear()

  if (loading) {
    return <div className="text-center py-16 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-12 flex items-start justify-between gap-8">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 mb-3 font-medium">
            {t('library.title')} · {year}
          </div>
          <h1 className="font-display text-[56px] font-medium text-zinc-900 leading-[0.95] tracking-tight max-w-xl">
            {t('library.tagline')}
          </h1>
        </div>
        <div className="flex gap-8 pt-2">
          {[
            ['finished', counts.finished],
            ['reading',  counts.reading],
            ['wantTo',   counts.want_to_read],
          ].map(([key, n]) => (
            <div key={key} className="text-center">
              <div className="font-display text-[42px] font-medium leading-none mb-1 text-zinc-900">{n}</div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 font-medium">
                {t(`library.${key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex bg-white rounded-full p-1 border border-zinc-200">
          {[
            ['all',          t('library.shelves.all')],
            ['reading',      t('library.shelves.reading')],
            ['want_to_read', t('library.shelves.wantToRead')],
            ['finished',     t('library.shelves.finished')],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[13px] px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                filter === key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {label}
              <span className={filter === key ? 'text-zinc-300' : 'text-zinc-400'}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} /> {t('library.addBook')}
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-500 text-[15px] italic font-display">
            {books.length === 0 ? t('library.emptyLibrary') : t('library.emptyShelf')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {filtered.map(book => (
            <BookCard key={book.id} book={book} onClick={() => navigate(`/library/${book.id}`)} t={t} />
          ))}
        </div>
      )}

      <AddBookModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addBook} />
    </div>
  )
}
