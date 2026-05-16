import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`
}
function timeAgo(ts) {
  const diff = Date.now() - ts
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'hoje'
  if (diff < 2 * day) return 'ontem'
  if (diff < 7 * day) return `${Math.floor(diff / day)} dias atrás`
  return formatDate(ts)
}

export default function MentalPatternTab({
  table = 'mental_patterns',
  label = 'Padrão Mental',
  createPath = '/padrao-mental',
  onAdd, onSelect, onDelete,
}) {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPatterns(data); setLoading(false) })
  }, [user?.id, table])

  async function handleDelete(e, id) {
    e.stopPropagation(); e.preventDefault()
    if (!window.confirm('Excluir esta crença?')) return
    setPatterns(p => p.filter(x => x.id !== id))
    await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
    onDelete?.(id)
  }

  function handleSelect(id) {
    if (onSelect) onSelect(id)
    else window.location.href = `${createPath}?id=${id}`
  }
  function handleAdd() {
    if (onAdd) onAdd()
    else window.location.href = createPath
  }

  if (loading) return null

  return (
    <section
      className="px-1"
      style={{
        '--ink': '#1B1814',
        '--ink-soft': '#2A2620',
        '--ink-mute': '#6B6258',
        '--ink-faint': '#9A9085',
        '--paper': '#FBF8F1',
        '--hair': 'rgba(27, 24, 20, 0.10)',
        '--hair-strong': 'rgba(27, 24, 20, 0.18)',
        '--shadow': '#2D5016',
        '--shadow-deep': '#1F3110',
        '--light': '#D4890A',
        '--light-deep': '#6B3B07',
        '--serif': '"Cormorant Garamond", Georgia, serif',
      }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <div
            style={{
              fontFamily: 'inherit',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-mute)',
              marginBottom: 8,
            }}
          >
            {label}
          </div>
          {patterns.length > 0 && (
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                color: 'var(--ink-mute)',
                fontSize: 15,
              }}
            >
              {patterns.length} {patterns.length === 1 ? 'investigação' : 'investigações'}
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all"
          style={{
            background: 'var(--ink)',
            color: '#F5F0E8',
            border: 0,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-soft)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.transform = 'none' }}
          aria-label="novo padrão"
        >
          <Plus size={13} strokeWidth={2} />
          novo padrão
        </button>
      </div>

      {/* Empty state */}
      {patterns.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '0.5px solid var(--hair)',
            borderRadius: 22,
            background: 'var(--paper)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'var(--ink-mute)',
              lineHeight: 1.5,
              maxWidth: 380,
              margin: '0 auto',
            }}
          >
            ainda não há nada aqui.<br/>
            quando você começar, cada padrão vira um par de polos para sentar junto.
          </div>
        </div>
      ) : (
        /* Garden grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {patterns.map((p, i) => (
            <article
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={{
                position: 'relative',
                background: 'var(--paper)',
                border: '0.5px solid var(--hair)',
                borderRadius: 18,
                padding: '20px 22px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                cursor: 'pointer',
                transition: 'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(27, 24, 20, 0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <button
                onClick={e => handleDelete(e, p.id)}
                aria-label="excluir"
                style={{
                  position: 'absolute',
                  top: 12, right: 12,
                  opacity: 0,
                  background: 'transparent',
                  border: '0.5px solid var(--hair)',
                  color: 'var(--ink-faint)',
                  width: 26, height: 26,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'opacity .15s, color .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#b14a4a'; e.currentTarget.style.borderColor = '#b14a4a' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.borderColor = 'var(--hair)' }}
                onFocus={e => { e.currentTarget.style.opacity = 1 }}
                ref={el => {
                  if (!el) return
                  const article = el.closest('article')
                  if (!article) return
                  article.addEventListener('mouseenter', () => { el.style.opacity = 1 })
                  article.addEventListener('mouseleave', () => { el.style.opacity = 0 })
                }}
              >
                <Trash2 size={12} />
              </button>

              {/* Index + when */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                <span>nº {String(i + 1).padStart(2, '0')}</span>
                <span style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: 12,
                }}>{timeAgo(new Date(p.created_at).getTime())}</span>
              </div>

              {/* Pair */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 14px 1fr',
                alignItems: 'stretch',
                gap: 0,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--shadow)',
                  }}>
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--shadow)' }} />
                    sombra
                  </div>
                  <div style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 18,
                    lineHeight: 1.2,
                    color: 'var(--shadow-deep)',
                    letterSpacing: '-0.005em',
                  }}>
                    {p.neg_belief || '—'}
                  </div>
                </div>
                <div style={{ width: '0.5px', background: 'var(--hair-strong)', margin: '4px 6px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--light-deep)',
                  }}>
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--light)' }} />
                    luz
                  </div>
                  <div style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontSize: 18,
                    lineHeight: 1.2,
                    color: 'var(--light-deep)',
                    letterSpacing: '-0.005em',
                  }}>
                    {p.pos_belief || '—'}
                  </div>
                </div>
              </div>

              {/* Foot */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '0.5px solid var(--hair)',
                paddingTop: 12,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-mute)',
              }}>
                <span>4 + 4 desdobramentos</span>
                <span style={{
                  display: 'inline-flex',
                  gap: 6,
                  alignItems: 'center',
                  color: 'var(--ink)',
                }}>
                  abrir <span style={{ fontSize: 12 }}>→</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
