import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, X as IconX, ArrowLeft, Plus } from 'lucide-react'
import CollapsibleSection from '../components/ui/CollapsibleSection'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/* ─── Helpers ──────────────────────────────── */

function toRoman(n) {
  const map = [['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]]
  let r = '', rem = n
  for (const [s, v] of map) { while (rem >= v) { r += s; rem -= v } }
  return r
}

function timeSince(ts) {
  const d = Date.now() - ts
  const day = 24 * 60 * 60 * 1000
  if (d < day)            return 'hoje'
  if (d < 2 * day)        return 'ontem'
  if (d < 7 * day)        return `há ${Math.floor(d / day)} dias`
  if (d < 14 * day)       return 'há 1 semana'
  if (d < 30 * day)       return `há ${Math.floor(d / (7 * day))} semanas`
  if (d < 60 * day)       return 'há 1 mês'
  if (d < 365 * day)      return `há ${Math.floor(d / (30 * day))} meses`
  if (d < 2 * 365 * day)  return 'há 1 ano'
  return `há ${Math.floor(d / (365 * day))} anos`
}

/* ─── CSS ──────────────────────────────────── */

const CSS = `
.dsj-root {
  --cream: #F5F0E8; --cream-deep: #EDE5D6; --cream-haze: #F9F5EE; --paper: #FBF8F1;
  --ink: #1B1814; --ink-soft: #2A2620; --ink-mute: #6B6258; --ink-faint: #9A9085; --ink-ghost: #C7BEB1;
  --hair: rgba(27, 24, 20, 0.10); --hair-strong: rgba(27, 24, 20, 0.18);
  --gold: #B97A26; --gold-soft: #C4A882;
  --serif: "Cormorant Garamond", Georgia, serif;
  --sans:  "Nunito Sans", system-ui, sans-serif;
  background: var(--cream); color: var(--ink);
  font-family: var(--sans); font-size: 15px; line-height: 1.5;
  min-height: 100vh; letter-spacing: 0.005em;
  -webkit-font-smoothing: antialiased;
}
.dsj-root * { box-sizing: border-box; }
.dsj-root button { font-family: inherit; cursor: pointer; }
.dsj-root input { font-family: inherit; color: inherit; }

.dsj-wrap { max-width: 760px; margin: 0 auto; padding: 32px 40px 80px; }

/* Back */
.dsj-back {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--sans); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute); background: none; border: 0; padding: 0;
  transition: color .2s;
}
.dsj-back:hover { color: var(--ink); }

/* Head */
.dsj-head { padding: 56px 0 36px; }
.dsj-chapter-label {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--sans); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--ink-mute); margin-bottom: 22px;
}
.dsj-chapter-label .rule { flex: 0 0 36px; height: 0.5px; background: var(--ink-faint); }
.dsj-head h1 {
  font-family: var(--serif); font-size: clamp(56px, 7.5vw, 104px); font-weight: 400;
  line-height: 0.92; letter-spacing: -0.018em; margin: 0 0 22px; color: var(--ink);
}
.dsj-head h1 em { font-style: italic; color: var(--ink-soft); }
.dsj-epigraph {
  font-family: var(--serif); font-style: italic; font-size: 22px; line-height: 1.4;
  color: var(--ink-mute); margin: 0; max-width: 560px; font-weight: 400;
}
.dsj-epigraph .attrib {
  display: block; font-family: var(--sans); font-style: normal; font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); margin-top: 10px;
}

/* Meta */
.dsj-meta {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 0 24px; font-family: var(--sans); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-faint);
  border-top: 0.5px solid var(--hair); border-bottom: 0.5px solid var(--hair); margin-bottom: 8px;
}
.dsj-meta .count {
  font-family: var(--serif); font-style: italic; font-size: 17px;
  text-transform: none; letter-spacing: 0; color: var(--ink-mute);
}
.dsj-meta .count b { font-style: normal; font-weight: 400; color: var(--ink); margin-right: 4px; }

/* Fragments */
.dsj-fragments { display: flex; flex-direction: column; }
.dsj-frag {
  position: relative; display: grid; grid-template-columns: 64px 1fr auto;
  align-items: center; gap: 24px; padding: 32px 0 28px;
  border-bottom: 0.5px solid var(--hair); transition: background .25s;
}
.dsj-frag:hover {
  background: linear-gradient(90deg, transparent, var(--cream-haze) 20%, var(--cream-haze) 80%, transparent);
}
.dsj-ord {
  font-family: var(--serif); font-size: 28px; font-weight: 400;
  color: var(--ink-faint); text-align: center; line-height: 1;
}
.dsj-body { min-width: 0; }
.dsj-text {
  font-family: var(--serif); font-style: italic; font-size: 26px;
  line-height: 1.3; color: var(--ink); letter-spacing: -0.005em; cursor: text;
  word-break: break-word;
}
.dsj-text-edit {
  width: 100%; background: transparent; border: 0; outline: none;
  font-family: var(--serif); font-style: italic; font-size: 26px;
  line-height: 1.3; color: var(--ink); letter-spacing: -0.005em; padding: 0;
  border-bottom: 0.5px solid var(--gold);
}
.dsj-when {
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
  font-family: var(--sans); font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-faint);
}
.dsj-when .sep { color: var(--ink-ghost); }
.dsj-when .pinned { color: var(--gold); display: inline-flex; align-items: center; gap: 5px; }
.dsj-actions {
  display: flex; gap: 4px; opacity: 0; transition: opacity .2s;
}
.dsj-frag:hover .dsj-actions, .dsj-frag:focus-within .dsj-actions { opacity: 1; }
.dsj-action {
  width: 30px; height: 30px; border-radius: 50%; border: 0.5px solid var(--hair);
  background: transparent; color: var(--ink-faint);
  display: inline-flex; align-items: center; justify-content: center;
  transition: color .15s, border-color .15s, background .15s;
}
.dsj-action:hover { color: var(--ink); border-color: var(--ink); }
.dsj-action.pinned { color: var(--gold); border-color: color-mix(in oklch, var(--gold) 50%, transparent); }
.dsj-action.danger:hover { color: #b14a4a; border-color: #b14a4a; }

/* Compose */
.dsj-compose { margin-top: 32px; padding: 18px 0; }
.dsj-compose-inner {
  display: flex; align-items: center; gap: 14px;
  background: var(--paper); border: 0.5px solid var(--hair);
  border-radius: 999px; padding: 8px 16px 8px 8px;
  transition: border-color .2s;
}
.dsj-compose-inner:focus-within { border-color: var(--gold-soft); }
.dsj-sigil {
  width: 36px; height: 36px; border-radius: 50%;
  border: 0.5px solid var(--gold-soft); color: var(--gold);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: white;
}
.dsj-compose-inner input {
  flex: 1; background: transparent; border: 0; outline: none;
  font-family: var(--serif); font-style: italic; font-size: 18px;
  color: var(--ink); padding: 4px 0; min-width: 0;
}
.dsj-compose-inner input::placeholder { color: var(--ink-ghost); }
.dsj-hint {
  font-family: var(--sans); font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-faint); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 6px;
}
.dsj-hint kbd {
  font-family: var(--sans); font-size: 10px; padding: 2px 5px;
  border: 0.5px solid var(--hair-strong); border-radius: 4px;
  color: var(--ink-mute); background: white;
}

/* Empty */
.dsj-empty {
  text-align: center; padding: 80px 24px; display: flex;
  flex-direction: column; align-items: center; gap: 22px;
}
.dsj-empty .glyph {
  width: 64px; height: 64px; border-radius: 50%; border: 0.5px solid var(--hair-strong);
  display: flex; align-items: center; justify-content: center; color: var(--ink-mute);
}
.dsj-empty .line {
  font-family: var(--serif); font-style: italic; font-size: 22px;
  color: var(--ink-mute); line-height: 1.4; max-width: 360px; margin: 0;
}

@media (max-width: 640px) {
  .dsj-wrap { padding: 24px 22px 60px; }
  .dsj-head { padding: 32px 0 24px; }
  .dsj-frag { grid-template-columns: 40px 1fr auto; gap: 14px; padding: 22px 0 20px; }
  .dsj-ord { font-size: 22px; }
  .dsj-text, .dsj-text-edit { font-size: 20px; }
  .dsj-epigraph { font-size: 18px; }
}
`

function injectStyles() {
  const id = 'dsj-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

/* ─── Page ─────────────────────────────────── */

export default function DeepDesires() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems]       = useState([])
  const [editingId, setEditing] = useState(null)
  const [draft, setDraft]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('direction_desires').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data.map(d => ({
          id: d.id,
          text: d.title || '',
          createdAt: new Date(d.created_at).getTime(),
          pinned: !!d.pinned,
        })))
        setLoading(false)
      })
  }, [user?.id])

  async function add() {
    const text = draft.trim()
    if (!text) return
    const { data } = await supabase.from('direction_desires')
      .insert({ user_id: user.id, title: text })
      .select().single()
    if (data) {
      setItems(prev => [{ id: data.id, text, createdAt: Date.now(), pinned: false }, ...prev])
      setDraft('')
    }
  }

  async function editText(id, text) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, text } : it))
    await supabase.from('direction_desires').update({ title: text }).eq('id', id).eq('user_id', user.id)
  }

  async function remove(id) {
    if (!window.confirm('Excluir este desejo?')) return
    setItems(prev => prev.filter(it => it.id !== id))
    await supabase.from('direction_desires').delete().eq('id', id).eq('user_id', user.id)
  }

  async function togglePin(id) {
    const it = items.find(x => x.id === id)
    if (!it) return
    const next = !it.pinned
    setItems(prev => prev.map(x => x.id === id ? { ...x, pinned: next } : x))
    await supabase.from('direction_desires').update({ pinned: next }).eq('id', id).eq('user_id', user.id)
  }

  // sort: pinned first, then newest
  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.createdAt - a.createdAt
  })

  return (
    <div className="dsj-root">
      <div className="dsj-wrap">
        <button className="dsj-back" onClick={() => navigate('/spirit')}>
          <ArrowLeft size={14} /> Spirit
        </button>

        <header className="dsj-head">
          <div className="dsj-chapter-label">
            <span className="rule" />
            <span>Capítulo Três</span>
            <span>·</span>
            <span>Espírito</span>
          </div>
          <h1>Desejos <em>profundos.</em></h1>
          <p className="dsj-epigraph">
            o que dorme em você e ainda não pediu palavra.
            <span className="attrib">um caderno particular · só seu</span>
          </p>
        </header>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9A9085', fontSize: 13 }}>
            {t('common.loading')}
          </div>
        ) : (
          <>
            {items.length > 0 && (
              <div className="dsj-meta">
                <span>guardados em você</span>
                <span className="count"><b>{items.length}</b> {items.length === 1 ? 'desejo' : 'desejos'}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="dsj-empty">
                <div className="glyph">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M18 8 Q12 18 18 28 Q24 18 18 8 Z" />
                    <line x1="18" y1="8" x2="18" y2="28" strokeWidth="0.5" opacity="0.5" />
                  </svg>
                </div>
                <p className="line">
                  ainda não há nada aqui.<br/>
                  o que dorme em você esperando palavra?
                </p>
              </div>
            ) : (
              <CollapsibleSection collapsedHeight={320}>
                <div className="dsj-fragments">
                  {sorted.map((d, i) => (
                    <Fragment
                      key={d.id}
                      desire={d}
                      idx={i}
                      isEditing={editingId === d.id}
                      setEditingId={setEditing}
                      onEdit={editText}
                      onDelete={remove}
                      onPin={togglePin}
                      onOpenEditor={() => navigate(`/desejos/${d.id}`)}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            <div className="dsj-compose">
              <div className="dsj-compose-inner">
                <span className="dsj-sigil"><Plus size={15} /></span>
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
                  placeholder="escreva um desejo que ainda não disse a ninguém…"
                />
                <span className="dsj-hint">enviar <kbd>↵</kbd></span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Fragment({ desire, idx, isEditing, setEditingId, onEdit, onDelete, onPin, onOpenEditor }) {
  const [text, setText] = useState(desire.text)
  const ref = useRef(null)

  useEffect(() => { setText(desire.text) }, [desire.text, isEditing])
  useEffect(() => {
    if (isEditing && ref.current) { ref.current.focus(); ref.current.select() }
  }, [isEditing])

  function commit() {
    const v = text.trim()
    if (v && v !== desire.text) onEdit(desire.id, v)
    setEditingId(null)
  }

  return (
    <div className="dsj-frag">
      <div className="dsj-ord">{toRoman(idx + 1)}</div>
      <div className="dsj-body">
        {isEditing ? (
          <input
            ref={ref}
            className="dsj-text-edit"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') setEditingId(null)
            }}
            onBlur={commit}
          />
        ) : (
          <div
            className="dsj-text"
            onClick={() => setEditingId(desire.id)}
            onDoubleClick={onOpenEditor}
            title="clique pra editar · clique duplo pra abrir"
          >
            {desire.text || '—'}
          </div>
        )}
        <div className="dsj-when">
          <span>primeiro sussurro</span>
          <span className="sep">·</span>
          <span>{timeSince(desire.createdAt)}</span>
          {desire.pinned && (
            <>
              <span className="sep">·</span>
              <span className="pinned"><Star size={10} fill="currentColor" /> guardado</span>
            </>
          )}
        </div>
      </div>
      <div className="dsj-actions">
        <button
          className={'dsj-action' + (desire.pinned ? ' pinned' : '')}
          aria-label="guardar"
          onClick={() => onPin(desire.id)}
        ><Star size={13} fill={desire.pinned ? 'currentColor' : 'none'} /></button>
        <button className="dsj-action danger" aria-label="abrir editor" onClick={onOpenEditor}>
          <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button className="dsj-action danger" aria-label="apagar" onClick={() => onDelete(desire.id)}>
          <IconX size={13} />
        </button>
      </div>
    </div>
  )
}
