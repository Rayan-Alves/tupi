import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, BookOpen, Upload } from 'lucide-react'
import { searchOpenLibrary } from '../../hooks/useLibrary'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user } = useAuth()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked]   = useState(null)
  const [shelf, setShelf]     = useState('reading')
  const [totalPages, setTotalPages]   = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [coverFile, setCoverFile]       = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [localAuthor, setLocalAuthor]   = useState('')
  const [localYear,   setLocalYear]     = useState('')
  const [localTitle,  setLocalTitle]    = useState('')
  const debounceRef = useRef(null)
  const abortRef    = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setQuery(''); setResults([]); setPicked(null)
      setShelf('reading'); setTotalPages(''); setCurrentPage(0)
      setCoverFile(null); setCoverPreview(null)
      setLocalAuthor(''); setLocalYear(''); setLocalTitle('')
    }
  }, [open])

  function handleCoverFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

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
    setLocalAuthor(book.author || '')
    setLocalYear(book.year ? String(book.year) : '')
    setLocalTitle(book.title || '')
  }

  async function commit() {
    if (!picked) return
    setUploading(true)
    let coverUrl = picked.cover_url

    // Convert to base64 — works without any Supabase Storage bucket
    if (coverFile) {
      try { coverUrl = await fileToBase64(coverFile) } catch {}
    }

    const total   = parseInt(totalPages) || null
    const current = Math.min(parseInt(currentPage) || 0, total || 99999)
    await onAdd({
      title:        (localTitle || picked.title).trim(),
      author:       localAuthor.trim() || null,
      year:         parseInt(localYear) || null,
      cover_url:    coverUrl,
      external_id:  picked.external_id,
      total_pages:  total,
      current_page: shelf === 'finished' ? (total || 0) : current,
      status:       shelf,
      finished_at:  shelf === 'finished' ? new Date().toISOString() : null,
    })
    setUploading(false)
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
        <div className="border-b border-zinc-100">
          <div className="flex items-center gap-3 px-6 py-5">
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
          {!picked && query.trim().length >= 2 && (
            <div className="px-6 pb-3 flex items-center justify-between">
              <span className="text-[12px] text-zinc-400">{t('library.notMyBook')}</span>
              <button
                onClick={() => pick({ title: query.trim(), author: null, year: null, cover_url: null, external_id: null, total_pages: null })}
                className="text-[12px] font-semibold bg-zinc-900 text-white px-4 py-1.5 rounded-full hover:bg-zinc-700 transition-all"
              >
                {t('library.addManually')}
              </button>
            </div>
          )}
        </div>

        {/* Picked → form */}
        {picked ? (
          <div className="p-6 flex gap-6">
            {/* Cover + upload */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <CoverThumb url={coverPreview || picked.cover_url} title={picked.title} size={120} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded-full border border-zinc-200 hover:border-zinc-400"
              >
                <Upload size={11} />
                {coverFile ? t('library.changeCover') : (picked.cover_url ? t('library.changeCover') : t('library.uploadCover'))}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {/* Title — editable for manual books */}
              {picked.external_id ? (
                <h3 className="font-display text-[26px] font-medium text-zinc-900 leading-tight mb-3">
                  {picked.title}
                </h3>
              ) : (
                <input
                  value={localTitle}
                  onChange={e => setLocalTitle(e.target.value)}
                  placeholder="Título do livro"
                  className="w-full mb-3 px-0 py-1 bg-transparent border-0 border-b border-zinc-200 font-display text-[26px] font-medium text-zinc-900 outline-none focus:border-zinc-600 transition-colors"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                />
              )}
              {/* Author + Year */}
              <div className="mb-1">
                <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-1 font-medium">Autor</div>
                <div className="flex gap-2 mb-4">
                  <input
                    value={localAuthor}
                    onChange={e => setLocalAuthor(e.target.value)}
                    placeholder={t('library.authorPlaceholder')}
                    className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
                  />
                  <input
                    value={localYear}
                    onChange={e => setLocalYear(e.target.value)}
                    placeholder={t('library.yearPlaceholder')}
                    type="number"
                    className="w-20 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
              </div>

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
                  disabled={uploading}
                  className={`text-[13px] font-semibold px-5 py-2 rounded-full transition-all ${uploading ? 'bg-zinc-400 text-white cursor-wait' : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}
                >
                  {uploading ? t('common.saving') : t('library.addToLibrary')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Search results */
          <>
            <div className="max-h-[40vh] overflow-y-auto">
              {searching && (
                <div className="px-6 py-12 text-center text-sm text-zinc-400">{t('library.searching')}</div>
              )}
              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-zinc-400 mb-4">{t('library.noResults')}</p>
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

          </>
        )}
      </div>
    </div>
  )
}
