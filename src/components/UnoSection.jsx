import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function UnoSection({ projects, lockedMessage }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div
      onClick={() => navigate('/uno')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        padding: '8px 0 4px',
        userSelect: 'none',
      }}
    >
      <img
        src="/uno-fern.png"
        alt="UNO"
        style={{
          width: 110,
          height: 110,
          objectFit: 'cover',
          borderRadius: '50%',
          transition: 'transform .3s ease, opacity .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      />
      <span style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#4A3728',
        fontFamily: 'Georgia, serif',
        textAlign: 'center',
      }}>
        {t('uno.listTitle')}
      </span>
      {projects && projects.length === 0 && lockedMessage && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#a1a1aa', textAlign: 'center', maxWidth: 320 }}>
          {lockedMessage}
        </div>
      )}
    </div>
  )
}
