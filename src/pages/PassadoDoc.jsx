import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import RichEditor from '../components/spirit/RichEditor'

const CSS = `
.pd-page { min-height: 100vh; background: #fff; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
.pd-bar { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid #f4f4f5;
  padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; height: 56px; box-sizing: border-box; }
.pd-bar-left, .pd-bar-right { display: flex; align-items: center; gap: 12px; }
.pd-back { background: none; border: none; color: #71717a; cursor: pointer; display: flex; align-items: center;
  padding: 6px; border-radius: 8px; transition: all .15s; }
.pd-back:hover { background: #f4f4f5; color: #1a1a1a; }
.pd-status { font-size: 12px; color: #10b981; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.pd-status.saving { color: #f59e0b; }
.pd-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.pd-pagenav { display: flex; align-items: center; gap: 8px; }
.pd-pagenav-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e4e4e7; background: #fff;
  cursor: pointer; color: #71717a; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.pd-pagenav-btn:hover:not(:disabled) { background: #f4f4f5; border-color: #c4a882; color: #8B5A2B; }
.pd-pagenav-btn:disabled { opacity: 0.35; cursor: default; }
.pd-pagenav-label { font-size: 12px; color: #71717a; font-weight: 600; min-width: 38px; text-align: center; }

.pd-content { width: 100%; margin: 0; padding: 48px 80px 80px; background: #fff; }

.pd-title { width: 100%; border: none; background: transparent; outline: none; padding: 0; margin: 0 0 8px;
  font-family: 'Georgia',serif; font-size: 44px; font-weight: 700; color: #1a1a1a; line-height: 1.15; }
.pd-title::placeholder { color: #d4d4d8; font-weight: 400; }
.pd-subtitle { width: 100%; border: none; background: transparent; outline: none; padding: 0; margin: 0 0 32px;
  font-family: 'Georgia',serif; font-size: 20px; color: #71717a; line-height: 1.4; font-style: italic; }
.pd-subtitle::placeholder { color: #d4d4d8; font-style: italic; }

/* Override RichEditor styles for fullscreen experience */
.pd-editor .re-toolbar { top: 56px; border-top: none; padding: 6px 0; background: rgba(255,255,255,0.96); }
.pd-editor .re-content { padding: 0; min-height: 60vh; }

@media (max-width: 640px) {
  .pd-bar { padding: 10px 14px; }
  .pd-content { padding: 24px 20px 60px; }
  .pd-title { font-size: 32px; }
  .pd-subtitle { font-size: 17px; }
}
`

function injectStyles() {
  const id = 'pd-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

export default function PassadoDoc() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('saved') // 'saved' | 'saving'
  const [notFound, setNotFound] = useState(false)
  const saveTimer = useRef(null)
  const pendingRef = useRef({})

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    if (!user || !id) return
    supabase.from('past_documents').select('*').eq('id', id).eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setDoc(data)
      })
  }, [user?.id, id])

  function scheduleSave(changes) {
    setDoc(prev => ({ ...prev, ...changes }))
    pendingRef.current = { ...pendingRef.current, ...changes }
    setStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const payload = { ...pendingRef.current, updated_at: new Date().toISOString() }
      pendingRef.current = {}
      await supabase.from('past_documents').update(payload).eq('id', id).eq('user_id', user.id)
      setStatus('saved')
    }, 700)
  }

  if (notFound) {
    return (
      <div className="pd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#a1a1aa' }}>
          <p style={{ fontSize: 14, marginBottom: 12 }}>{t('spirit.past.notFound')}</p>
          <button onClick={() => navigate('/passado')} className="pd-back" style={{ color: '#8B5A2B' }}>
            {t('spirit.past.back')}
          </button>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="pd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#a1a1aa', fontSize: 13 }}>{t('common.loading')}</span>
      </div>
    )
  }

  const contentField = `content_${page}`

  return (
    <div className="pd-page">
      <div className="pd-bar">
        <div className="pd-bar-left">
          <button className="pd-back" onClick={() => navigate('/passado')} aria-label={t('spirit.past.back')}>
            <ArrowLeft size={20} />
          </button>
          <span className={`pd-status ${status === 'saving' ? 'saving' : ''}`}>
            {status === 'saving' ? (
              <>
                <span className="pd-status-dot" />
                {t('spirit.past.saving')}
              </>
            ) : (
              <>
                <Check size={12} />
                {t('spirit.past.saved')}
              </>
            )}
          </span>
        </div>
        <div className="pd-bar-right">
          <div className="pd-pagenav">
            <button className="pd-pagenav-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ArrowLeft size={14} />
            </button>
            <span className="pd-pagenav-label">{page} / 3</span>
            <button className="pd-pagenav-btn" onClick={() => setPage(p => Math.min(3, p + 1))} disabled={page >= 3}>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="pd-content">
        {page === 1 && (
          <>
            <input
              className="pd-title"
              value={doc.title || ''}
              onChange={e => scheduleSave({ title: e.target.value })}
              placeholder={t('spirit.past.titlePlaceholder')}
            />
            <input
              className="pd-subtitle"
              value={doc.subtitle || ''}
              onChange={e => scheduleSave({ subtitle: e.target.value })}
              placeholder={t('spirit.past.subtitlePlaceholder')}
            />
          </>
        )}

        <div className="pd-editor">
          <RichEditor
            key={`page-${page}-${doc.id}`}
            value={doc[contentField] || ''}
            onChange={html => scheduleSave({ [contentField]: html })}
            placeholder={t('spirit.past.writeHere')}
          />
        </div>
      </div>
    </div>
  )
}
