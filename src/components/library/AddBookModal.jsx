import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, BookOpen } from 'lucide-react'
import { searchOpenLibrary } from '../../hooks/useLibrary'

function CoverThumb({ url, title, size = 60 }) {
  if (!url) {
    return (
      <div
        style={{
          width: size, height: size * 1.45,
          background: '#8B5A2B',
          color: '#F5F0E8',
          display: 'flex', alignItems: 'flex-end',
          padding: 6, fontSize: 9, fontWeight: 600,
          letterSpacing: '0.05em', borderRadius: 3,
          fontFamily: 'Georgia, serif',
        }}
        className="flex-shrink-0"
      >
        {title}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      style={{ width: size, height: size * 1.45, objectFit: 'cover', borderRadius: 3 }}
      className="flex-shrink-0 shadow-sm"
    />
  )
}

export default function AddBookModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked]   = useState(null)
  const [shelf, setShelf]     = useState('reading')
  const [totalPages, setTotalPages]   = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const debounceRef = useRef(null)
  const abortRef    = useRef(null)

  useEffect(() => {
    if (!open) {
      setQuery(''); setResults([]); setPicked(null)
      setShelf('reading'); setTotalPages(''); setCurrentPage(0)
    }
  }, [open])

  useEffect(() => {
    if (!query || picked) { setResults([]); setSearching(false); return }
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchOpenLibrary(query, ac.signal)
        setResults(r)
      } catch {} finally { setSearching(false) }
    }, 320)
    return () => clearTimeout(debounceRef.current)
  }, [query, picked])

  function pick(book) {
    setPicked(book)
    setTotalPages(book.total_pages || '')
  }

  async function commit() {
    if (!picked) return
    const total = parseInt(totalPages) || null
    const current = Math.min(parseInt(currentPage) || 0, total || 99999)
    await onAdd({
      title:        picked.title,
      author:       picked.author,
      year:         picked.year,
      cover_url:    picked.cover_url,
      external_id:  picked.external_id,
      total_pages:  total,
      current_page: shelf === 'finished' ? (total || 0) : current,
      status:       shelf,
      finished_at:  shelf === 'finished' ? new Date().toISOString() : null,
    })
    onClose()
  }

  async function commitManual() {
    if (!query.trim()) return
    const total = parseInt(totalPages) || null
    await onAdd({
      title:        query.trim(),
      total_pages:  total,
      current_page: shelf === 'finished' ? (total || 0) : 0,
      status:       shelf,
      finished_at:  shelf === 'finished' ? new Date().toISOString() : null,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans"
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100">
          <Search size={18} className="text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setPicked(null) }}
            placeholder={t('library.searchPlaceholder')}
            className="flex-1 bg-transparent border-0 outline-none text-[14px] uppercase tracking-[0.05em] text-zinc-900 placeholder-zinc-400 font-display"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, textTransform: 'uppercase' }}
          />
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Picked → form */}
        {picked ? (
          <div className="p-6 flex gap-6">
            <CoverThumb url={picked.cover_url} title={picked.title} size={120} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[26px] font-medium text-zinc-900 leading-tight mb-1">
                {picked.title}
              </h3>
              <p className="text-[13px] text-zinc-500 mb-5">
                {picked.author}{picked.year ? ` · ${picked.year}` : ''}
              </p>

              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-2 font-medium">
                {t('library.shelf')}
              </div>
              <div className="flex bg-zinc-100 rounded-full p-1 mb-4 w-full max-w-xs">
                {['want_to_read', 'reading', 'finished'].map(s => (
                  <button
                    key={s}
                    onClick={() => setShelf(s)}
                    className={`flex-1 text-[12px] py-1.5 rounded-full font-medium transition-all ${
                      shelf === s ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {t(`library.status.${s === 'want_to_read' ? 'wantToRead' : s}`)}
                  </button>
                ))}
              </div>

              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-1 font-medium">
                {t('library.totalPages')}
              </div>
              <input
                type="number"
                value={totalPages}
                onChange={e => setTotalPages(e.target.value)}
                className="w-full mb-4 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
              />

              {shelf === 'reading' && (
                <>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-1 font-medium">
                    {t('library.currentPage')}
                  </div>
                  <input
                    type="number"
                    value={currentPage}
                    onChange={e => setCurrentPage(e.target.value)}
                    className="w-full mb-4 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
                  />
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setPicked(null)}
                  className="text-[13px] text-zinc-500 hover:text-zinc-900 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 transition-all"
                >
                  {t('library.backToSearch')}
                </button>
                <button
                  onClick={commit}
                  className="text-[13px] font-semibold bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-700 transition-all"
                >
                  {t('library.addToLibrary')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Search results */
          <div className="max-h-[50vh] overflow-y-auto">
            {searching && (
              <div className="px-6 py-12 text-center text-sm text-zinc-400">{t('library.searching')}</div>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-zinc-400 mb-4">{t('library.noResults')}</p>
                <button
                  onClick={() => pick({ title: query.trim(), author: null, year: null, cover_url: null, external_id: null, total_pages: null })}
                  className="text-[12px] font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-all"
                >
                  {t('library.addManually')}
                </button>
              </div>
            )}
            {!searching && results.length > 0 && results.map(book => (
              <button
                key={book.external_id || book.title}
                onClick={() => pick(book)}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-b-0"
              >
                <CoverThumb url={book.cover_url} title={book.title} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[18px] font-medium text-zinc-900 leading-snug truncate">
                    {book.title}
                  </div>
                  <div className="text-[12px] text-zinc-500 truncate">
                    {book.author || '—'}
                    {book.year ? ` · ${book.year}` : ''}
                    {book.total_pages ? ` · ${book.total_pages} p.` : ''}
                  </div>
                </div>
                <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-zinc-400 group-hover:text-zinc-900">
                  {t('library.add')}
                </span>
              </button>
            ))}
            {!searching && !query && (
              <div className="px-6 py-12 text-center text-sm text-zinc-400 italic">
                <BookOpen size={24} className="mx-auto mb-3 text-zinc-300" />
                {t('library.searchHint')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
