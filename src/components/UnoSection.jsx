import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const PORTAL_CSS = `
.uno-portal-stage {
  background: radial-gradient(120% 90% at 50% 50%,
    oklch(0.95 0.025 80) 0%,
    oklch(0.89 0.035 75) 70%,
    oklch(0.83 0.04 70) 100%);
  border-radius: 24px;
  padding: 32px 24px 28px;
  display: flex; flex-direction: column; align-items: center;
  isolation: isolate;
}
.uno-portal-frame {
  display: flex; flex-direction: column; align-items: center;
}
.uno-portal {
  --size: 200px;
  position: relative;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  border: none; background: transparent; padding: 0;
  cursor: pointer; display: grid; place-items: center;
  isolation: isolate;
  transition: transform 600ms cubic-bezier(.22,1,.36,1);
  -webkit-tap-highlight-color: transparent;
}
.uno-portal:active { transform: scale(0.97); }
.uno-portal:focus-visible { outline: 2px solid oklch(0.48 0.07 150); outline-offset: 14px; }
.uno-portal .uno-logo {
  position: relative; z-index: 3;
  width: 86%; height: 86%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 6px 16px rgba(38, 60, 40, 0.18));
  animation: uno-vortice-logo 60s linear infinite;
  transition: animation-duration 600ms ease;
  will-change: transform;
}
.uno-portal.is-hover .uno-logo { animation-duration: 16s; }

.uno-vortice-swirl {
  position: absolute; inset: -10%;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    transparent 0deg,
    color-mix(in oklch, oklch(0.48 0.07 150) 22%, transparent) 60deg,
    transparent 120deg,
    color-mix(in oklch, oklch(0.62 0.06 145) 28%, transparent) 200deg,
    transparent 260deg,
    color-mix(in oklch, oklch(0.48 0.07 150) 18%, transparent) 320deg,
    transparent 360deg);
  filter: blur(14px);
  animation: uno-vortice-spin 22s linear infinite;
  z-index: 1;
  will-change: transform;
}
.uno-portal.is-hover .uno-vortice-swirl { animation-duration: 8s; }

.uno-vortice-dust {
  position: absolute; inset: 6%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, color-mix(in oklch, oklch(0.97 0.012 90) 55%, transparent) 0%, transparent 35%),
    radial-gradient(circle at 70% 65%, color-mix(in oklch, oklch(0.82 0.04 145) 60%, transparent) 0%, transparent 40%);
  filter: blur(8px);
  z-index: 2;
  opacity: 0.7;
}

@keyframes uno-vortice-spin { to { transform: rotate(360deg); } }
@keyframes uno-vortice-logo { to { transform: rotate(-360deg); } }

.uno-portal-title {
  margin-top: 22px;
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #1A1814;
  text-align: center;
  line-height: 1.1;
}
.uno-portal-sub {
  margin-top: 8px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #8B8378;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .uno-portal .uno-logo, .uno-vortice-swirl { animation: none; }
}
@media (max-width: 640px) {
  .uno-portal-stage { padding: 24px 16px 22px; border-radius: 20px; }
  .uno-portal { --size: 160px; }
  .uno-portal-title { font-size: 16px; margin-top: 16px; }
}
`

function injectStyles() {
  const id = 'uno-portal-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = PORTAL_CSS
    document.head.appendChild(el)
  }
}

export default function UnoSection({ projects, lockedMessage }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)

  useEffect(() => { injectStyles() }, [])

  return (
    <div className="uno-portal-stage">
      <div className="uno-portal-frame">
        <button
          className={`uno-portal ${hover ? 'is-hover' : ''}`}
          onClick={() => navigate('/uno')}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          aria-label={t('uno.portalTitle')}
        >
          <span className="uno-vortice-swirl" aria-hidden="true" />
          <span className="uno-vortice-dust" aria-hidden="true" />
          <img src="/tupi-logo.png" alt="" className="uno-logo" draggable="false" />
        </button>
      </div>
      {projects && projects.length === 0 && lockedMessage && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#8B8378', textAlign: 'center', maxWidth: 320, fontStyle: 'italic', fontFamily: 'Libre Baskerville, Georgia, serif' }}>
          {lockedMessage}
        </div>
      )}
    </div>
  )
}
