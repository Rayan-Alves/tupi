import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUno } from '../hooks/useUno'

const STAGE_COLORS = { spirit: '#1B3A5C', mind: '#D4890A', body: '#2D5016' }
const STAGE_LABELS = { spirit: 'Espírito', mind: 'Mente', body: 'Corpo' }

export default function UnoListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { projects, loading } = useUno()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src="/uno-fern.png" alt="UNO" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 14 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A0E8F', marginBottom: 6 }}>
            UNO
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, color: '#0a0a0a', margin: 0, lineHeight: 1.2 }}>
            {t('uno.listTitle')}
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', margin: '6px 0 0' }}>
            {t('uno.listSubtitle')}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f0f0f0' }} />

      {/* Projects */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a1a1aa', fontSize: 13 }}>{t('common.loading')}</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <img src="/uno-fern.png" alt="UNO" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 20, margin: '0 auto 20px', opacity: 0.5 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#71717a', marginBottom: 8 }}>{t('uno.emptyListTitle')}</p>
          <p style={{ fontSize: 13, color: '#a1a1aa', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('uno.emptyListDesc') }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(p => {
            const color = STAGE_COLORS[p.stage] || '#4A0E8F'
            const label = STAGE_LABELS[p.stage] || p.stage
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/uno/${p.id}`)}
                style={{
                  cursor: 'pointer',
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #e4e4e7',
                  borderLeft: '4px solid #4A0E8F',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(74,14,143,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <img src="/uno-fern.png" alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.title || t('uno.soulDesire')}
                  </div>
                  <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 3 }}>
                    {new Date(p.created_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: `${color}18`, padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>
                  {label}
                </span>
                <span style={{ fontSize: 20, color: '#d4d4d8', flexShrink: 0 }}>›</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
