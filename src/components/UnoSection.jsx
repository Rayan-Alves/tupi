import { useNavigate } from 'react-router-dom'

export default function UnoSection() {
  const navigate = useNavigate()
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
        Jornada dos Desejos Internos da Alma
      </span>
    </div>
  )
}
