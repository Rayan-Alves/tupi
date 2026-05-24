import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── crozeira spiral ─── */
function spiralPath(turns, aStart, aGrow, samples) {
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * turns * Math.PI * 2
    const r = aStart + aGrow * t
    d += (i === 0 ? 'M' : 'L') + (Math.cos(t)*r).toFixed(2) + ' ' + (Math.sin(t)*r).toFixed(2) + ' '
  }
  return d
}

function SpiralIcon({ size = 48, color = 'rgba(200,132,26,0.32)' }) {
  const p = spiralPath(2.6, 0.4, 1.6, 200)
  const h = 18
  return (
    <svg width={size} height={size} viewBox={`${-h} ${-h} ${h*2} ${h*2}`} fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={p}/>
    </svg>
  )
}

/* ─── breathing circle button ─── */
const CIRCLE_CSS = `
  @keyframes sw-breathe-entry { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  .sw-entry-btn {
    position:relative; width:88px; height:88px;
    border:none; padding:0; background:transparent; cursor:pointer; outline:none;
    -webkit-tap-highlight-color:transparent;
  }
  .sw-entry-btn .sw-core {
    position:absolute; inset:0; border-radius:50%;
    background:radial-gradient(circle at 35% 28%,#1c1c1c 0%,#0a0a0a 50%,#000 100%);
    box-shadow:0 0 0 1px rgba(0,0,0,0.5),inset 0 -12px 28px rgba(0,0,0,0.55),inset 0 4px 8px rgba(255,255,255,0.03);
    animation:sw-breathe-entry 4.5s ease-in-out infinite;
    transition:transform 200ms ease;
  }
  .sw-entry-btn:hover .sw-core { animation-play-state:paused; }
  .sw-entry-btn:active .sw-core { transform:scale(0.96); }
  .sw-entry-btn .sw-spiral {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    pointer-events:none;
    animation:sw-breathe-entry 4.5s ease-in-out infinite;
    transition:opacity 220ms;
  }
  .sw-entry-btn:hover .sw-spiral { opacity:0.85; }
`

function injectEntryCSS() {
  if (document.getElementById('sw-entry-css')) return
  const el = document.createElement('style'); el.id = 'sw-entry-css'; el.textContent = CIRCLE_CSS
  document.head.appendChild(el)
}

/* ─── main component ─── */
export default function ShadowWork() {
  const navigate = useNavigate()
  useEffect(() => { injectEntryCSS() }, [])

  return (
    <section className="space-y-4">
      <h2 className="type-h1">Shadow Work</h2>

      {/* breathing circle — native, no wrapper */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 20px' }}>
        <button
          className="sw-entry-btn"
          aria-label="entrar no shadow work"
          onClick={() => navigate('/shadow-work')}
        >
          <span className="sw-core" />
          <span className="sw-spiral">
            <SpiralIcon size={38} color="rgba(200,132,26,0.62)" />
          </span>
        </button>
      </div>
    </section>
  )
}
