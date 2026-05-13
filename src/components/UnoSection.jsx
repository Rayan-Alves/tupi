import { useNavigate } from 'react-router-dom'

export default function UnoSection({ projects, lockedMessage }) {
  const navigate = useNavigate()
  const hasProjects = projects.length > 0

  return (
    <div
      onClick={() => navigate('/uno')}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: '#FAFAF7',
        borderRadius: 20,
        border: '1px solid #E8E4DC',
        padding: '16px 24px',
        transition: 'all .25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#F5F0E6'
        e.currentTarget.style.borderColor = '#C4A882'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#FAFAF7'
        e.currentTarget.style.borderColor = '#E8E4DC'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Fern image */}
      <img
        src="/uno-fern.png"
        alt="UNO"
        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A0E8F', marginBottom: 4 }}>
          UNO
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
          Jornada dos Desejos
        </div>
        <div style={{ fontSize: 12, color: '#a1a1aa' }}>
          {hasProjects
            ? `${projects.length} projeto${projects.length > 1 ? 's' : ''} criado${projects.length > 1 ? 's' : ''}`
            : lockedMessage}
        </div>
      </div>

      {/* Arrow */}
      <div style={{ fontSize: 22, color: '#C4A882', flexShrink: 0, fontWeight: 300 }}>›</div>
    </div>
  )
}
