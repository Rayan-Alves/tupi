import { useState, useEffect, useRef } from 'react'

/* ─── font injection ─── */
function injectFont() {
  if (document.getElementById('sw-font')) return
  const link = document.createElement('link')
  link.id = 'sw-font'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500&display=swap'
  document.head.appendChild(link)
}

/* ─── CSS ─── */
const CSS = `
  :root {
    --sw-buriti: #C8841A;
    --sw-igapo: #1A3A1F;
    --sw-igapo-deep: #0F2614;
    --sw-tabatinga: #C4A882;
    --sw-neblina: #F5F0E8;
    --sw-serif: 'Cormorant Garamond', 'Times New Roman', serif;
    --sw-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  }

  /* ── entry ── */
  .sw-entry {
    border-radius: 16px;
    min-height: 260px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 600ms ease;
  }
  .sw-entry[data-bg="neblina"] {
    background: radial-gradient(ellipse at 50% 40%, #faf6ee 0%, #ebe3d4 100%);
  }
  .sw-entry[data-bg="igapo"] {
    background: radial-gradient(ellipse at center, var(--sw-igapo) 0%, var(--sw-igapo-deep) 100%);
  }
  .sw-entry[data-bg="noir"] {
    background: radial-gradient(ellipse at 50% 45%, #131313 0%, #050505 100%);
  }
  .sw-entry[data-bg="tabatinga"] {
    background: radial-gradient(ellipse at center, #cfb796 0%, #b39971 100%);
  }
  .sw-entry::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      radial-gradient(ellipse at 30% 20%, rgba(0,0,0,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.05) 0%, transparent 55%);
  }

  /* ── circle button ── */
  .sw-circle-btn {
    position: relative; width: 140px; height: 140px;
    border: none; padding: 0; background: transparent;
    cursor: pointer; outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .sw-circle-btn .sw-halo {
    position: absolute; inset: -40px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 60%);
    opacity: 0.6; pointer-events: none;
  }
  .sw-entry[data-bg="noir"] .sw-halo { display: none; }
  .sw-entry[data-bg="igapo"] .sw-halo {
    background: radial-gradient(circle, rgba(0,0,0,0.5) 0%, transparent 60%);
  }
  .sw-circle-btn .sw-core {
    position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #1f1f1f 0%, #0a0a0a 45%, #000 100%);
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.4),
      inset 0 -20px 40px rgba(0,0,0,0.6),
      inset 0 6px 12px rgba(255,255,255,0.03);
    animation: sw-breathe 4.5s ease-in-out infinite;
    transition: transform 200ms ease;
  }
  .sw-entry[data-bg="noir"] .sw-core {
    box-shadow:
      0 0 0 1px rgba(200,132,26,0.18),
      inset 0 -20px 40px rgba(0,0,0,0.7),
      inset 0 6px 12px rgba(200,132,26,0.04);
  }
  .sw-circle-btn:hover .sw-core { animation-play-state: paused; }
  .sw-circle-btn:active .sw-core { transform: scale(0.97); }
  .sw-circle-btn .sw-spiral-host {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
    animation: sw-breathe 4.5s ease-in-out infinite;
  }
  .sw-circle-btn .sw-spiral-host svg {
    width: 48px; height: 48px;
    color: rgba(200,132,26,0.32);
    transition: color 220ms ease;
  }
  .sw-circle-btn:hover .sw-spiral-host svg { color: rgba(200,132,26,0.7); }
  @keyframes sw-breathe {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.045); }
  }

  /* ── canvas overlay ── */
  .sw-canvas-overlay {
    position: fixed; inset: 0; z-index: 50;
    overflow: hidden;
    font-family: var(--sw-sans);
    --sw-canvas-bg: #0A0A0A;
    --sw-ink: rgba(245,240,232,0.88);
    --sw-ink-soft: rgba(245,240,232,0.5);
    --sw-ink-faint: rgba(245,240,232,0.18);
    --sw-accent: var(--sw-buriti);
    --sw-accent-soft: rgba(200,132,26,0.4);
    --sw-line: rgba(200,132,26,0.22);
    --sw-node-bg: rgba(255,255,255,0.02);
    --sw-node-border: rgba(200,132,26,0.25);
    background: var(--sw-canvas-bg);
  }
  .sw-canvas-overlay[data-aes="dark"] {
    --sw-canvas-bg: #0A0F0B;
    --sw-ink: rgba(245,240,232,0.88);
    --sw-ink-soft: rgba(245,240,232,0.5);
    --sw-ink-faint: rgba(245,240,232,0.18);
    --sw-accent: #C8841A;
    --sw-accent-soft: rgba(200,132,26,0.5);
    --sw-line: rgba(200,132,26,0.28);
    --sw-node-bg: rgba(15,38,20,0.5);
    --sw-node-border: rgba(200,132,26,0.28);
    background: var(--sw-canvas-bg);
  }
  .sw-canvas-overlay[data-aes="dark"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at 50% 40%, rgba(26,58,31,0.45) 0%, transparent 60%);
  }
  .sw-canvas-overlay[data-aes="paper"] {
    --sw-canvas-bg: #F5F0E8;
    --sw-ink: #1A3A1F;
    --sw-ink-soft: rgba(26,58,31,0.62);
    --sw-ink-faint: rgba(26,58,31,0.22);
    --sw-accent: #C8841A;
    --sw-accent-soft: rgba(200,132,26,0.65);
    --sw-line: rgba(26,58,31,0.32);
    --sw-node-bg: rgba(255,255,255,0.4);
    --sw-node-border: rgba(26,58,31,0.22);
    background: var(--sw-canvas-bg);
  }
  .sw-canvas-overlay[data-aes="paper"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(196,168,130,0.18) 0%, transparent 45%),
      radial-gradient(ellipse at 85% 90%, rgba(196,168,130,0.18) 0%, transparent 45%);
  }
  .sw-canvas-overlay[data-aes="mono"] {
    --sw-canvas-bg: #000;
    --sw-ink: rgba(255,255,255,0.95);
    --sw-ink-soft: rgba(255,255,255,0.55);
    --sw-ink-faint: rgba(255,255,255,0.18);
    --sw-accent: rgba(255,255,255,0.85);
    --sw-accent-soft: rgba(255,255,255,0.5);
    --sw-line: rgba(255,255,255,0.25);
    --sw-node-bg: transparent;
    --sw-node-border: rgba(255,255,255,0.2);
    background: var(--sw-canvas-bg);
  }
  .sw-canvas-overlay[data-aes="cinema"] {
    --sw-canvas-bg: #050505;
    --sw-ink: rgba(245,240,232,0.95);
    --sw-ink-soft: rgba(245,240,232,0.55);
    --sw-ink-faint: rgba(245,240,232,0.2);
    --sw-accent: #C8841A;
    --sw-accent-soft: rgba(200,132,26,0.55);
    --sw-line: rgba(200,132,26,0.22);
    --sw-node-bg: rgba(10,15,11,0.7);
    --sw-node-border: rgba(200,132,26,0.32);
    background: var(--sw-canvas-bg);
  }
  .sw-canvas-overlay[data-aes="cinema"]::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 3;
    background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, transparent 35%, rgba(0,0,0,0.85) 100%);
  }

  /* ── chrome ── */
  .sw-chrome {
    position: absolute; top: 18px; left: 18px; right: 18px;
    display: flex; justify-content: space-between; align-items: center;
    pointer-events: none; z-index: 6;
  }
  .sw-icon-btn {
    width: 32px; height: 32px; border-radius: 50%;
    background: transparent; border: 1px solid var(--sw-ink-faint);
    color: var(--sw-ink-soft);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; pointer-events: auto;
    transition: all 180ms ease; padding: 0;
  }
  .sw-icon-btn:hover {
    color: var(--sw-accent);
    border-color: var(--sw-accent-soft);
    background: rgba(200,132,26,0.06);
  }
  .sw-canvas-overlay[data-aes="paper"] .sw-icon-btn:hover { background: rgba(26,58,31,0.06); }
  .sw-icon-btn svg { width: 14px; height: 14px; }

  /* ── canvas mark ── */
  .sw-canvas-mark {
    position: absolute; bottom: 16px; right: 16px;
    width: 22px; height: 22px;
    color: var(--sw-ink-faint);
    pointer-events: none; z-index: 5;
  }

  /* ── nodes ── */
  #sw-nodes-wrap { position: absolute; inset: 0; z-index: 2; }
  #sw-svg-lines  { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }

  .sw-node {
    position: absolute;
    transform: translate(-50%, -50%);
    cursor: grab; user-select: none;
    transition: filter 240ms ease, opacity 240ms ease;
  }
  .sw-node.dragging { cursor: grabbing; z-index: 20; }
  .sw-node-inner {
    position: relative;
    transition: border-color 200ms ease, background 200ms ease;
  }
  .sw-node-text {
    color: var(--sw-ink);
    background: transparent; border: none; resize: none; outline: none;
    width: 100%; text-align: center;
    font-family: var(--sw-sans);
    cursor: text; overflow: hidden; padding: 0; line-height: 1.45;
  }
  .sw-node-text::placeholder { color: var(--sw-ink-faint); font-style: italic; }
  .sw-node.depth-0 .sw-node-text {
    font-family: var(--sw-serif); font-weight: 400; font-style: italic; letter-spacing: 0.01em; font-size: 22px;
  }
  .sw-node.depth-1 .sw-node-text { font-size: 14px; }
  .sw-node.depth-2 .sw-node-text { font-size: 12.5px; }

  /* node style: cards */
  .sw-canvas-overlay[data-node="cards"] .sw-node.depth-0 .sw-node-inner {
    width: 180px; min-height: 180px; border-radius: 50%;
    background: var(--sw-node-bg); border: 1px solid var(--sw-accent-soft);
    backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 28px;
  }
  .sw-canvas-overlay[data-node="cards"] .sw-node.depth-1 .sw-node-inner {
    min-width: 130px; max-width: 180px; min-height: 56px;
    background: var(--sw-node-bg); border: 1px solid var(--sw-node-border);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 12px 16px;
    backdrop-filter: blur(6px);
  }
  .sw-canvas-overlay[data-node="cards"] .sw-node.depth-2 .sw-node-inner {
    min-width: 100px; max-width: 150px; min-height: 44px;
    background: transparent; border: 1px dashed var(--sw-node-border);
    border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 8px 12px;
  }

  /* node style: floating */
  .sw-canvas-overlay[data-node="floating"] .sw-node-inner {
    padding: 8px 14px; border: none; background: transparent;
    display: flex; align-items: center; justify-content: center; min-width: 90px;
  }
  .sw-canvas-overlay[data-node="floating"] .sw-node.depth-0 .sw-node-inner { min-width: 140px; }
  .sw-canvas-overlay[data-node="floating"] .sw-node.depth-0 .sw-node-text { font-size: 26px; }
  .sw-canvas-overlay[data-node="floating"] .sw-node.depth-1 .sw-node-text { font-size: 15px; font-style: italic; font-family: var(--sw-serif); }
  .sw-canvas-overlay[data-node="floating"] .sw-node.depth-2 .sw-node-text { font-size: 13px; color: var(--sw-ink-soft); }

  /* node style: organic */
  .sw-canvas-overlay[data-node="organic"] .sw-node.depth-0 .sw-node-inner {
    width: 190px; min-height: 170px;
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
    background: var(--sw-node-bg); border: 1px solid var(--sw-accent-soft);
    backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 28px;
  }
  .sw-canvas-overlay[data-node="organic"] .sw-node.depth-1 .sw-node-inner {
    min-width: 130px; max-width: 170px; min-height: 60px;
    background: var(--sw-node-bg); border: 1px solid var(--sw-node-border);
    border-radius: 55% 45% 50% 50% / 60% 50% 50% 40%;
    display: flex; align-items: center; justify-content: center; padding: 14px 18px;
  }
  .sw-canvas-overlay[data-node="organic"] .sw-node.depth-2 .sw-node-inner {
    min-width: 100px; max-width: 140px; min-height: 44px;
    background: transparent; border: 1px solid var(--sw-node-border);
    border-radius: 60% 40% 55% 45% / 45% 55% 45% 55%;
    display: flex; align-items: center; justify-content: center; padding: 10px 14px;
  }

  /* node style: tags */
  .sw-canvas-overlay[data-node="tags"] .sw-node-inner {
    padding: 4px 0 6px; background: transparent; border: none;
    border-bottom: 1px solid var(--sw-node-border);
    min-width: 100px; display: flex; align-items: center; justify-content: center;
  }
  .sw-canvas-overlay[data-node="tags"] .sw-node.depth-0 .sw-node-inner {
    min-width: 160px; border-bottom: 1px solid var(--sw-accent-soft); padding: 6px 0 10px;
  }
  .sw-canvas-overlay[data-node="tags"] .sw-node.depth-2 .sw-node-inner {
    border-bottom: 1px dashed var(--sw-node-border);
  }
  .sw-canvas-overlay[data-node="tags"] .sw-node.depth-1 .sw-node-text {
    font-style: italic; font-family: var(--sw-serif); font-size: 15px;
  }

  /* add button */
  .sw-node-add {
    position: absolute; bottom: -10px; right: -10px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--sw-accent); color: var(--sw-canvas-bg);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    padding: 0; line-height: 1; opacity: 0;
    transition: all 200ms ease; z-index: 5;
  }
  .sw-node:hover .sw-node-add,
  .sw-node.focused .sw-node-add { opacity: 1; }
  .sw-node-add:hover { transform: scale(1.18); }
  .sw-node-add svg { width: 10px; height: 10px; }
  .sw-canvas-overlay[data-node="tags"] .sw-node-add    { bottom: -8px; right: -2px; }
  .sw-canvas-overlay[data-node="floating"] .sw-node-add { bottom: -2px; right: -2px; }

  /* cinema blur */
  .sw-canvas-overlay[data-aes="cinema"] .sw-node:not(.focused) { filter: blur(1.2px); opacity: 0.5; }
  .sw-canvas-overlay[data-aes="cinema"] .sw-node.focused        { filter: none; opacity: 1; }

  /* ── tweaks panel ── */
  .sw-tweaks {
    position: fixed; bottom: 16px; right: 16px;
    width: 264px;
    background: rgba(10,10,10,0.92);
    backdrop-filter: blur(20px) saturate(120%);
    border: 1px solid rgba(245,240,232,0.1);
    border-radius: 12px;
    color: rgba(245,240,232,0.92);
    font-family: var(--sw-sans); font-size: 12px;
    z-index: 60; padding: 14px 14px 12px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  }
  .sw-tweaks-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .sw-tweaks-title { font-family: var(--sw-serif); font-style: italic; font-size: 16px; color: var(--sw-buriti); letter-spacing: 0.02em; }
  .sw-tweaks-close { background: transparent; border: none; color: rgba(245,240,232,0.55); cursor: pointer; padding: 4px; line-height: 1; }
  .sw-tweaks-close:hover { color: var(--sw-buriti); }
  .sw-tweak-group { margin-bottom: 12px; }
  .sw-tweak-group:last-child { margin-bottom: 0; }
  .sw-tweak-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(245,240,232,0.45); margin-bottom: 6px; }
  .sw-tweak-opts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .sw-tweak-opt {
    background: transparent; border: 1px solid rgba(245,240,232,0.12);
    color: rgba(245,240,232,0.7); font-family: var(--sw-sans); font-size: 10.5px;
    padding: 7px 4px; border-radius: 6px; cursor: pointer;
    transition: all 160ms ease; text-align: center;
  }
  .sw-tweak-opt:hover { border-color: rgba(200,132,26,0.45); color: var(--sw-buriti); }
  .sw-tweak-opt.on { border-color: var(--sw-buriti); background: rgba(200,132,26,0.12); color: var(--sw-buriti); }
  .sw-tweak-swatch { display: block; width: 16px; height: 16px; border-radius: 50%; margin: 0 auto 4px; border: 1px solid rgba(245,240,232,0.15); }
`

function injectCSS() {
  if (document.getElementById('sw-styles-v2')) return
  const el = document.createElement('style')
  el.id = 'sw-styles-v2'
  el.textContent = CSS
  document.head.appendChild(el)
}

/* ─── spiral path generator ─── */
function makeSpiralPath(turns, aStart, aGrow, samples) {
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * turns * Math.PI * 2
    const r = aStart + aGrow * t
    const x = Math.cos(t) * r
    const y = Math.sin(t) * r
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
  }
  return d
}
function spiralSVG({ turns = 2.4, aStart = 0.6, aGrow = 1.5, samples = 240, stroke = 1.4, viewSize = 18 } = {}) {
  const path = makeSpiralPath(turns, aStart, aGrow, samples)
  const h = viewSize
  return `<svg viewBox="${-h} ${-h} ${h*2} ${h*2}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`
}

/* ─── component ─── */
export default function ShadowWork() {
  const [screen,     setScreen]     = useState('portal')
  const [tweaks,     setTweaks]     = useState({ entryBg: 'neblina', canvasAes: 'mono', nodeStyle: 'floating' })
  const [tweaksOpen, setTweaksOpen] = useState(false)

  const canvasRef = useRef(null)
  const wrapRef   = useRef(null)
  const svgRef    = useRef(null)
  const markRef   = useRef(null)
  const spiralRef = useRef(null)
  const st = useRef({ nodes: {}, connections: [], nextId: 1, drag: { active: false }, focusedId: null })

  useEffect(() => { injectCSS(); injectFont() }, [])

  /* inject spirals after portal mounts */
  useEffect(() => {
    if (screen === 'portal' && spiralRef.current) {
      spiralRef.current.innerHTML = spiralSVG({ turns: 2.6, aStart: 0.4, aGrow: 1.6, viewSize: 18 })
    }
    if (screen === 'canvas' && markRef.current) {
      markRef.current.innerHTML = spiralSVG({ turns: 2.4, aStart: 0.5, aGrow: 1.4, viewSize: 14, stroke: 1.2 })
    }
  }, [screen])

  /* ─── canvas helpers ─── */
  function getRect() { return canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } }

  function depthOf(id) {
    let d = 0, cur = id
    while (st.current.nodes[cur]?.parentId) { d++; cur = st.current.nodes[cur].parentId; if (d > 10) break }
    return d
  }

  function updateLines() {
    const { nodes, connections } = st.current
    const svg = svgRef.current
    if (!svg) return
    const canvas = canvasRef.current
    const lineColor = canvas
      ? getComputedStyle(canvas).getPropertyValue('--sw-line').trim() || 'rgba(200,132,26,0.22)'
      : 'rgba(200,132,26,0.22)'
    let html = ''
    connections.forEach(c => {
      const a = nodes[c.from], b = nodes[c.to]
      if (!a || !b) return
      const dx = b.x - a.x, dy = b.y - a.y
      const len = Math.sqrt(dx*dx + dy*dy) || 1
      const mx = a.x + dx * 0.5, my = a.y + dy * 0.5
      const off = Math.min(50, len * 0.18)
      const cx = mx + (-dy / len) * off, cy = my + (dx / len) * off
      const focused = st.current.focusedId === a.id || st.current.focusedId === b.id
      html += `<path d="M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}" stroke="${lineColor}" stroke-width="${focused ? 1.4 : 1}" fill="none" stroke-linecap="round"/>`
    })
    svg.innerHTML = html
  }

  function updateNodePos(id) {
    const { nodes } = st.current
    const el = document.getElementById('sw-nd-' + id)
    if (el) { el.style.left = nodes[id].x + 'px'; el.style.top = nodes[id].y + 'px' }
  }

  function pickAngle(parentId) {
    const parent = st.current.nodes[parentId]
    const siblings = st.current.connections
      .filter(c => c.from === parentId)
      .map(c => st.current.nodes[c.to])
      .filter(Boolean)
    if (siblings.length === 0) return Math.random() * Math.PI * 2
    let best = Math.random() * Math.PI * 2, bestScore = -Infinity
    for (let i = 0; i < 18; i++) {
      const cand = (i / 18) * Math.PI * 2
      let minD = Infinity
      siblings.forEach(s => {
        const sa = Math.atan2(s.y - parent.y, s.x - parent.x)
        let diff = Math.abs(cand - sa)
        if (diff > Math.PI) diff = Math.PI * 2 - diff
        if (diff < minD) minD = diff
      })
      if (minD > bestScore) { bestScore = minD; best = cand }
    }
    return best
  }

  function focusNode(id) {
    st.current.focusedId = id
    document.querySelectorAll('.sw-node').forEach(n => n.classList.remove('focused'))
    document.getElementById('sw-nd-' + id)?.classList.add('focused')
    updateLines()
  }

  function renderNode(id) {
    const { nodes } = st.current
    const node = nodes[id]
    const wrap = wrapRef.current
    if (!wrap || !node) return
    const d = Math.min(depthOf(id), 2)

    const div = document.createElement('div')
    div.className = `sw-node depth-${d}`
    div.id = 'sw-nd-' + id
    div.style.left = node.x + 'px'
    div.style.top  = node.y + 'px'

    const inner = document.createElement('div')
    inner.className = 'sw-node-inner'

    const ta = document.createElement('textarea')
    ta.className   = 'sw-node-text'
    ta.rows        = 1
    ta.placeholder = d === 0 ? '·' : ''
    ta.value       = node.text
    ta.addEventListener('input', () => {
      node.text = ta.value
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    })
    ta.addEventListener('focus', () => focusNode(id))
    ta.addEventListener('mousedown', e => e.stopPropagation())
    ta.addEventListener('touchstart', e => e.stopPropagation())

    const addBtn = document.createElement('button')
    addBtn.className = 'sw-node-add'
    addBtn.setAttribute('aria-label', 'expandir')
    addBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 4L8 12M4 8L12 8"/></svg>'
    addBtn.addEventListener('mousedown', e => e.stopPropagation())
    addBtn.addEventListener('touchstart', e => e.stopPropagation())
    addBtn.addEventListener('click', e => {
      e.stopPropagation()
      const angle = pickAngle(id)
      const dist  = 170 + Math.random() * 40
      const rect  = canvasRef.current?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight }
      const newId = createNode(
        Math.max(80, Math.min(rect.width  - 80, node.x + Math.cos(angle) * dist)),
        Math.max(60, Math.min(rect.height - 60, node.y + Math.sin(angle) * dist)),
        id
      )
      setTimeout(() => {
        const el = document.getElementById('sw-nd-' + newId)
        if (el) el.querySelector('textarea')?.focus()
      }, 30)
    })

    div.addEventListener('mousedown', e => {
      if (e.target.tagName === 'TEXTAREA' || e.target.closest('.sw-node-add')) return
      const rect = getRect()
      st.current.drag = { active: true, id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y }
      div.classList.add('dragging')
      focusNode(id)
      e.preventDefault()
    })
    div.addEventListener('touchstart', e => {
      if (e.target.tagName === 'TEXTAREA' || e.target.closest('.sw-node-add')) return
      const touch = e.touches[0], rect = getRect()
      st.current.drag = { active: true, id, ox: touch.clientX - rect.left - node.x, oy: touch.clientY - rect.top - node.y }
      div.classList.add('dragging')
      focusNode(id)
    }, { passive: true })

    inner.appendChild(ta)
    inner.appendChild(addBtn)
    div.appendChild(inner)
    wrap.appendChild(div)
    setTimeout(() => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }, 10)
  }

  function createNode(x, y, parentId) {
    const s = st.current
    const id = s.nextId++
    s.nodes[id] = { id, x, y, text: '', parentId: parentId || null }
    if (parentId) s.connections.push({ from: parentId, to: id })
    renderNode(id)
    updateLines()
    return id
  }

  function resetCanvas() {
    const s = st.current
    s.nodes = {}; s.connections = []; s.nextId = 1; s.focusedId = null
    if (wrapRef.current) wrapRef.current.innerHTML = ''
    if (svgRef.current)  svgRef.current.innerHTML  = ''
    const canvas = canvasRef.current
    const cw = canvas?.offsetWidth  || window.innerWidth
    const ch = canvas?.offsetHeight || window.innerHeight
    const id = createNode(cw / 2, ch / 2, null)
    focusNode(id)
    setTimeout(() => {
      document.getElementById('sw-nd-' + id)?.querySelector('textarea')?.focus()
    }, 50)
  }

  /* ─── canvas event listeners ─── */
  useEffect(() => {
    if (screen !== 'canvas') return

    // small delay so the div is actually in the DOM
    const t = setTimeout(() => resetCanvas(), 60)

    function onMove(e) {
      const drag = st.current.drag
      if (!drag?.active) return
      const rect  = getRect()
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left - drag.ox
      const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top  - drag.oy
      st.current.nodes[drag.id].x = Math.max(50, Math.min(rect.width  - 50, x))
      st.current.nodes[drag.id].y = Math.max(30, Math.min(rect.height - 30, y))
      updateNodePos(drag.id)
      updateLines()
    }
    function onTouchMove(e) { onMove(e); e.preventDefault() }
    function onUp() {
      const drag = st.current.drag
      if (drag?.active) document.getElementById('sw-nd-' + drag.id)?.classList.remove('dragging')
      if (st.current.drag) st.current.drag.active = false
    }

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('touchmove',  onTouchMove, { passive: false })
    document.addEventListener('mouseup',    onUp)
    document.addEventListener('touchend',   onUp)
    window.addEventListener('resize', updateLines)

    return () => {
      clearTimeout(t)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('mouseup',    onUp)
      document.removeEventListener('touchend',   onUp)
      window.removeEventListener('resize', updateLines)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  /* ─── update CSS attrs when tweaks change ─── */
  useEffect(() => {
    if (screen === 'canvas' && canvasRef.current) {
      canvasRef.current.setAttribute('data-aes',  tweaks.canvasAes)
      canvasRef.current.setAttribute('data-node', tweaks.nodeStyle)
      updateLines()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tweaks, screen])

  function setTweak(key, val) {
    setTweaks(prev => ({ ...prev, [key]: val }))
  }

  /* ─── render ─── */
  return (
    <section className="space-y-4">
      <h2 className="font-display text-4xl font-semibold text-[#2D2A26]">Shadow Work</h2>

      {/* ENTRY PORTAL */}
      <div
        className="sw-entry"
        data-bg={tweaks.entryBg}
        onClick={() => setScreen('canvas')}
      >
        <button
          className="sw-circle-btn"
          aria-label="entrar"
          onClick={e => { e.stopPropagation(); setScreen('canvas') }}
        >
          <span className="sw-halo" />
          <span className="sw-core" />
          <span className="sw-spiral-host" ref={spiralRef} />
        </button>
      </div>

      {/* CANVAS OVERLAY */}
      {screen === 'canvas' && (
        <div
          ref={canvasRef}
          className="sw-canvas-overlay"
          data-aes={tweaks.canvasAes}
          data-node={tweaks.nodeStyle}
        >
          {/* chrome */}
          <div className="sw-chrome">
            <button
              className="sw-icon-btn"
              aria-label="voltar"
              onClick={() => { setScreen('portal'); setTweaksOpen(false) }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4L6 8L10 12"/>
              </svg>
            </button>
            <button
              className="sw-icon-btn"
              aria-label="limpar"
              onClick={resetCanvas}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="5"/>
                <path d="M8 5L8 8L10 9"/>
              </svg>
            </button>
          </div>

          <svg ref={svgRef} id="sw-svg-lines" />
          <div ref={wrapRef} id="sw-nodes-wrap" />
          <div ref={markRef} className="sw-canvas-mark" />

          {/* tweaks toggle dot */}
          <button
            onClick={() => setTweaksOpen(o => !o)}
            style={{
              position: 'absolute', bottom: 14, left: 14,
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(200,132,26,0.45)',
              border: 'none', cursor: 'pointer', padding: 0,
              zIndex: 10, transition: 'all 200ms'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,132,26,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,132,26,0.45)'}
            aria-label="tweaks"
          />
        </div>
      )}

      {/* TWEAKS PANEL */}
      {screen === 'canvas' && tweaksOpen && (
        <div className="sw-tweaks">
          <div className="sw-tweaks-head">
            <span className="sw-tweaks-title">Tweaks</span>
            <button className="sw-tweaks-close" onClick={() => setTweaksOpen(false)} aria-label="fechar">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M3 3L13 13M13 3L3 13"/>
              </svg>
            </button>
          </div>

          {[
            {
              label: 'entrada', key: 'entryBg',
              opts: [
                { val: 'neblina',   swatch: '#F5F0E8', name: 'neblina'   },
                { val: 'igapo',     swatch: '#1A3A1F', name: 'igapó'     },
                { val: 'tabatinga', swatch: '#C4A882', name: 'tabatinga' },
                { val: 'noir',      swatch: '#0A0A0A', name: 'noir'      },
              ]
            },
            {
              label: 'canvas', key: 'canvasAes',
              opts: [
                { val: 'dark',   name: 'dark'   },
                { val: 'paper',  name: 'papel'  },
                { val: 'mono',   name: 'mono'   },
                { val: 'cinema', name: 'cinema' },
              ]
            },
            {
              label: 'nós', key: 'nodeStyle',
              opts: [
                { val: 'cards',    name: 'cards'    },
                { val: 'floating', name: 'flutuar'  },
                { val: 'organic',  name: 'orgânico' },
                { val: 'tags',     name: 'tags'     },
              ]
            },
          ].map(group => (
            <div key={group.key} className="sw-tweak-group">
              <div className="sw-tweak-label">{group.label}</div>
              <div className="sw-tweak-opts">
                {group.opts.map(opt => (
                  <button
                    key={opt.val}
                    className={`sw-tweak-opt${tweaks[group.key] === opt.val ? ' on' : ''}`}
                    onClick={() => setTweak(group.key, opt.val)}
                  >
                    {opt.swatch && (
                      <span className="sw-tweak-swatch" style={{ background: opt.swatch }} />
                    )}
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
