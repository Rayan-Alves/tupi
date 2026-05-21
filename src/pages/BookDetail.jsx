import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Star, X, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import RichEditor from '../components/spirit/RichEditor'

const STATUS_OPTIONS = [
  { key: 'want_to_read', i18n: 'wantToRead', dot: '#3B6DC4' },
  { key: 'reading',      i18n: 'reading',    dot: '#D4890A' },
  { key: 'finished',     i18n: 'finished',   dot: '#10b981' },
]

function CoverImg({ book }) {
  if (book.cover_url) {
    return (
      <img
        src={book.cover_url}
        alt={book.title}
        style={{ width: 220, height: 320, objectFit: 'cover', borderRadius: 6 }}
        className="shadow-xl"
      />
    )
  }
  return (
    <div
      style={{
        width: 220, height: 320,
        background: '#8B5A2B', color: '#F5F0E8',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 20, borderRadius: 6,
        fontFamily: 'Georgia, serif',
      }}
      className="shadow-xl"
    >
      <div className="text-[10px] tracking-[0.18em] uppercase font-bold opacity-80">Library</div>
      <div className="text-[18px] font-medium leading-tight">{book.title}</div>
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete, t, locale }) {
  const dateStr = format(new Date(note.created_at), 'd MMM yyyy', { locale })
  return (
    <div className="bg-white rounded-2xl p-7 mb-4 border border-zinc-100">
      <div className="flex items-start justify-between mb-3 gap-4">
        <div>
          <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-2 font-medium">
            {dateStr}
          </div>
          {note.title && (
            <h3 className="font-display text-[22px] font-medium text-zinc-900 leading-snug">
              {note.title}
            </h3>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-[12px] text-zinc-500 hover:text-zinc-900 px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-400 transition-all"
          >
            {t('library.edit')}
          </button>
          <button
            onClick={onDelete}
            className="text-[12px] text-zinc-400 hover:text-red-600 px-3 py-1 rounded-full border border-zinc-200 hover:border-red-200 transition-all"
          >
            {t('library.delete')}
          </button>
        </div>
      </div>
      <div
        className="prose prose-sm max-w-none text-zinc-800"
        style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: note.content || '' }}
      />
    </div>
  )
}

function NoteEditor({ note, onSave, onCancel, t }) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  return (
    <div className="bg-white rounded-2xl p-6 mb-4 border border-amber-200" style={{ boxShadow: '0 4px 24px rgba(196,168,130,0.15)' }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('library.noteTitlePlaceholder')}
        className="w-full bg-transparent border-0 outline-none mb-3 pb-3 border-b border-zinc-200 text-zinc-900"
        style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500 }}
      />
      <div className="mb-3 -mx-6 -mt-1 max-h-[400px] overflow-y-auto">
        <RichEditor value={content} onChange={setContent} placeholder={t('library.noteContentPlaceholder')} />
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
        <button
          onClick={onCancel}
          className="text-[13px] text-zinc-500 hover:text-zinc-900 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 transition-all"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={() => onSave({ title: title.trim(), content })}
          className="text-[13px] font-semibold bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-700 transition-all"
        >
          {t('common.saved').replace('…','') || t('common.saving')}
        </button>
      </div>
    </div>
  )
}

export default function BookDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [book, setBook]           = useState(null)
  const [notes, setNotes]         = useState([])
  const [notFound, setNotFound]   = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef(null)

  useEffect(() => {
    if (!user || !id) return
    supabase.from('books').select('*').eq('id', id).eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setBook(data)
      })
    supabase.from('book_notes').select('*').eq('book_id', id).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setNotes(data) })
  }, [user?.id, id])

  async function patchBook(changes) {
    let resolved = { ...changes }

    // Auto-complete when current_page reaches total_pages
    if (
      resolved.current_page !== undefined &&
      book.total_pages > 0 &&
      book.status === 'reading' &&
      (parseInt(resolved.current_page) || 0) >= book.total_pages
    ) {
      resolved.current_page = book.total_pages
      resolved.status       = 'finished'
      resolved.finished_at  = new Date().toISOString()
    }

    const finishedTransition = resolved.status === 'finished' && book.status !== 'finished'
    const payload = {
      ...resolved,
      updated_at: new Date().toISOString(),
      ...(finishedTransition && !resolved.finished_at ? { finished_at: new Date().toISOString() } : {}),
    }
    setBook(prev => ({ ...prev, ...payload }))
    await supabase.from('books').update(payload).eq('id', id).eq('user_id', user.id)
  }

  async function removeBook() {
    if (!window.confirm(t('library.removeConfirm'))) return
    await supabase.from('books').delete().eq('id', id).eq('user_id', user.id)
    navigate('/library')
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingCover(true)
    const ext  = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${id}.${ext}`
    const { error } = await supabase.storage
      .from('book-covers')
      .upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('book-covers').getPublicUrl(path)
      await patchBook({ cover_url: data.publicUrl + `?t=${Date.now()}` })
    }
    setUploadingCover(false)
  }

  function startNew() { setEditingNote({ id: null, title: '', content: '' }) }

  async function saveNote({ title, content }) {
    if (!editingNote) return
    if (editingNote.id) {
      await supabase.from('book_notes').update({ title, content, updated_at: new Date().toISOString() }).eq('id', editingNote.id)
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, title, content } : n))
    } else {
      const { data } = await supabase.from('book_notes').insert({ user_id: user.id, book_id: id, title, content }).select().single()
      if (data) setNotes(prev => [data, ...prev])
    }
    setEditingNote(null)
  }

  async function deleteNote(noteId) {
    if (!window.confirm(t('library.deleteNoteConfirm'))) return
    setNotes(prev => prev.filter(n => n.id !== noteId))
    await supabase.from('book_notes').delete().eq('id', noteId)
  }

  const localeMap = { pt: ptBR, en: enUS, es }
  const dateLocale = localeMap[i18n.language] || ptBR

  if (notFound) {
    return (
      <div style={{ background: '#F5F0E8', minHeight: '100vh' }} className="flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="mb-4 text-sm">{t('library.notFound')}</p>
          <button onClick={() => navigate('/library')} className="text-sm text-zinc-900 underline">
            {t('library.backToLibrary')}
          </button>
        </div>
      </div>
    )
  }

  if (!book) {
    return <div style={{ background: '#F5F0E8', minHeight: '100vh' }} className="flex items-center justify-center text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  const meta = STATUS_OPTIONS.find(s => s.key === book.status)

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-2 text-[13px] text-zinc-600 hover:text-zinc-900 mb-8 px-4 py-2 rounded-full bg-white border border-zinc-200 hover:border-zinc-400 transition-all"
        >
          <ArrowLeft size={14} /> {t('library.backToLibrary')}
        </button>

        {/* Header */}
        <div className="flex gap-10 mb-12 flex-wrap">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <CoverImg book={book} />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-400"
            >
              <Upload size={11} />
              {uploadingCover ? t('common.saving') : (book.cover_url ? t('library.changeCover') : t('library.uploadCover'))}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 text-[10px] tracking-[0.18em] uppercase font-bold" style={{ color: meta.dot }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
              {t(`library.status.${meta.i18n}`)}
            </div>
            <h1 className="font-display text-[44px] font-medium text-zinc-900 leading-tight mb-2 tracking-tight">
              {book.title}
            </h1>
            <p className="text-[14px] text-zinc-500 mb-8">
              {[book.author, book.year, book.total_pages ? `${book.total_pages} ${t('library.pages')}` : null].filter(Boolean).join(' · ')}
            </p>

            {/* Status pills */}
            <div className="inline-flex bg-white rounded-full p-1 border border-zinc-200 mb-6">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => patchBook({ status: s.key })}
                  className={`text-[12px] px-4 py-1.5 rounded-full transition-all ${
                    book.status === s.key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {t(`library.status.${s.i18n}`)}
                </button>
              ))}
            </div>

            {/* Reading progress */}
            {book.status === 'reading' && book.total_pages && (
              <div className="mb-6 max-w-md">
                <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-2 font-medium">
                  {t('library.progress')}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={book.current_page || 0}
                    onChange={e => patchBook({ current_page: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 outline-none focus:border-zinc-400"
                  />
                  <span className="text-zinc-400 text-sm">/ {book.total_pages}</span>
                  <div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${Math.min(100, ((book.current_page || 0) / book.total_pages) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="mb-6">
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-2 font-medium">
                {t('library.rating')}
              </div>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => patchBook({ rating: n })}>
                    <Star
                      size={22}
                      strokeWidth={1.5}
                      fill={n <= (book.rating || 0) ? '#D4890A' : 'transparent'}
                      color={n <= (book.rating || 0) ? '#D4890A' : '#d4d4d8'}
                    />
                  </button>
                ))}
                {book.rating > 0 && (
                  <button onClick={() => patchBook({ rating: null })} className="ml-2 text-[12px] text-zinc-400 hover:text-zinc-700 px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-400 transition-all">
                    {t('library.clear')}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={removeBook}
              className="text-[12px] text-zinc-400 hover:text-red-600 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-red-200 transition-all"
            >
              {t('library.removeFromLibrary')}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-zinc-200 pt-10">
          <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 mb-3 font-medium">
            {t('library.notesAndReviews')}
          </div>
          <div className="flex items-end justify-between mb-8 gap-4">
            <h2 className="font-display text-[36px] font-medium text-zinc-900 leading-tight tracking-tight">
              {t('library.whatIWantToRemember')}
            </h2>
            {!editingNote && (
              <button
                onClick={startNew}
                className="flex items-center gap-2 bg-zinc-900 text-white text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors flex-shrink-0"
              >
                <Plus size={14} /> {t('library.newEntry')}
              </button>
            )}
          </div>

          {editingNote && (
            <NoteEditor note={editingNote} onSave={saveNote} onCancel={() => setEditingNote(null)} t={t} />
          )}

          {notes.length === 0 && !editingNote && (
            <p className="text-zinc-400 text-[14px] italic font-display py-8">{t('library.noNotes')}</p>
          )}

          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditingNote(note)}
              onDelete={() => deleteNote(note.id)}
              t={t}
              locale={dateLocale}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
