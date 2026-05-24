import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUno } from '../hooks/useUno'

const STAGE_META = {
  spirit: { dot: '#3A4A8A', label: 'Espírito' },
  mind:   { dot: '#C8841A', label: 'Mente'    },
  body:   { dot: '#5A7A3D', label: 'Corpo'    },
}

// Organic plant SVG icon — same for all cards
function PlantIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 56 56" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <pattern id="hatch-uno" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#3d5236" strokeWidth="0.4" opacity="0.18"/>
        </pattern>
        <clipPath id="clip-uno">
          <path d="M6 8 Q4 6 6 4 H50 Q52 6 50 8 V48 Q52 50 50 52 H6 Q4 50 6 48 Z"/>
        </clipPath>
      </defs>
      <path d="M6 8 Q4 6 6 4 H50 Q52 6 50 8 V48 Q52 50 50 52 H6 Q4 50 6 48 Z"
            fill="#f4efe1" stroke="#2b3a26" strokeWidth="0.8"/>
      <g clipPath="url(#clip-uno)">
        <rect x="0" y="0" width="56" height="56" fill="url(#hatch-uno)"/>
        <path d="M28 50 Q28 36 26 26 Q24 18 28 12 Q30 17 30 24 Q30 36 28 50"
              fill="none" stroke="#3d5236" strokeWidth="1"/>
        <path d="M28 14 Q24 13 23 15.5"       fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 14 Q32 13 33 15.5"       fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 18.2 Q22.8 17.2 21.8 19.7" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 18.2 Q33.2 17.2 34.2 19.7" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 22.4 Q21.6 21.4 20.6 23.9" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 22.4 Q34.4 21.4 35.4 23.9" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 26.6 Q20.4 25.6 19.4 28.1" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 26.6 Q35.6 25.6 36.6 28.1" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 30.8 Q19.2 29.8 18.2 32.3" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 30.8 Q36.8 29.8 37.8 32.3" fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 35 Q18 34 17 36.5"          fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 35 Q38 34 39 36.5"          fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 39.2 Q16.8 38.2 15.8 40.7"  fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <path d="M28 39.2 Q39.2 38.2 40.2 40.7"  fill="none" stroke="#3d5236" strokeWidth="0.9" opacity="0.85"/>
        <circle cx="28" cy="11.5" r="1.6" fill="none" stroke="#3d5236" strokeWidth="0.8"/>
      </g>
    </svg>
  )
}

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
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A0E8F', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            UNO
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, fontWeight: 400, color: '#0a0a0a', margin: 0, lineHeight: 1.2 }}>
            {t('uno.listTitle')}
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', margin: '6px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
            const meta = STAGE_META[p.stage] || { dot: '#4A0E8F', label: p.stage }
            const date = new Date(p.created_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/uno/${p.id}`)}
                style={{
                  cursor: 'pointer',
                  background: '#fff',
                  borderRadius: 14,
                  border: '0.5px solid rgba(26,58,31,0.1)',
                  padding: '14px 20px 14px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'rgba(60,40,10,0.10) 0px 8px 20px'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <PlantIcon />

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, minHeight: 44 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 19, color: '#1a1a1a', lineHeight: 1.35, letterSpacing: '0.01em' }}>
                      {p.title || t('uno.soulDesire')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.8px', textTransform: 'uppercase', color: '#6b6655', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Gradient divider */}
                  <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, #d9cfb0 0%, transparent 80%)', marginTop: 10 }} />

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#a8a290', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{date}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#4F2DA8', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.01em' }}>
                      open →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
