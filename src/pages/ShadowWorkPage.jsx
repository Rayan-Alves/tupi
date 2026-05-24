import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useShadowWork } from '../hooks/useShadowWork'

/* ─── fonts & CSS ─── */
function injectFont() {
  if (document.getElementById('sw-font')) return
  const l = document.createElement('link')
  l.id = 'sw-font'; l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500&display=swap'
  document.head.appendChild(l)
}

const SW_CSS = `
  :root {
    --sw-buriti:#C8841A; --sw-igapo:#1A3A1F; --sw-igapo-deep:#0F2614;
    --sw-tabatinga:#C4A882; --sw-neblina:#F5F0E8;
    --sw-serif:'Cormorant Garamond','Times New Roman',serif;
    --sw-sans:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  }
  @keyframes sw-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.045)} }

  /* canvas container */
  .sw-canvas {
    position:absolute; inset:0; overflow:hidden;
    --sw-canvas-bg:#0A0A0A; --sw-ink:rgba(245,240,232,0.88);
    --sw-ink-soft:rgba(245,240,232,0.5); --sw-ink-faint:rgba(245,240,232,0.18);
    --sw-accent:#C8841A; --sw-accent-soft:rgba(200,132,26,0.4);
    --sw-line:rgba(200,132,26,0.22); --sw-node-bg:rgba(255,255,255,0.02);
    --sw-node-border:rgba(200,132,26,0.25);
    background:var(--sw-canvas-bg); font-family:var(--sw-sans);
  }
  .sw-canvas[data-aes="dark"] {
    --sw-canvas-bg:#0A0F0B; --sw-accent:#C8841A; --sw-accent-soft:rgba(200,132,26,0.5);
    --sw-line:rgba(200,132,26,0.28); --sw-node-bg:rgba(15,38,20,0.5);
    --sw-node-border:rgba(200,132,26,0.28); background:var(--sw-canvas-bg);
  }
  .sw-canvas[data-aes="dark"]::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse at 50% 40%,rgba(26,58,31,0.45) 0%,transparent 60%);
  }
  .sw-canvas[data-aes="paper"] {
    --sw-canvas-bg:#F5F0E8; --sw-ink:#1A3A1F; --sw-ink-soft:rgba(26,58,31,0.62);
    --sw-ink-faint:rgba(26,58,31,0.22); --sw-accent:#C8841A; --sw-accent-soft:rgba(200,132,26,0.65);
    --sw-line:rgba(26,58,31,0.32); --sw-node-bg:rgba(255,255,255,0.4);
    --sw-node-border:rgba(26,58,31,0.22); background:var(--sw-canvas-bg);
  }
  .sw-canvas[data-aes="paper"]::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background-image:radial-gradient(ellipse at 20% 10%,rgba(196,168,130,0.18) 0%,transparent 45%),
      radial-gradient(ellipse at 85% 90%,rgba(196,168,130,0.18) 0%,transparent 45%);
  }
  .sw-canvas[data-aes="mono"] {
    --sw-canvas-bg:#000; --sw-ink:rgba(255,255,255,0.95); --sw-ink-soft:rgba(255,255,255,0.55);
    --sw-ink-faint:rgba(255,255,255,0.18); --sw-accent:rgba(255,255,255,0.85);
    --sw-accent-soft:rgba(255,255,255,0.5); --sw-line:rgba(255,255,255,0.25);
    --sw-node-bg:transparent; --sw-node-border:rgba(255,255,255,0.2); background:#000;
  }
  .sw-canvas[data-aes="cinema"] {
    --sw-canvas-bg:#050505; --sw-ink:rgba(245,240,232,0.95); --sw-ink-soft:rgba(245,240,232,0.55);
    --sw-ink-faint:rgba(245,240,232,0.2); --sw-accent:#C8841A; --sw-accent-soft:rgba(200,132,26,0.55);
    --sw-line:rgba(200,132,26,0.22); --sw-node-bg:rgba(10,15,11,0.7);
    --sw-node-border:rgba(200,132,26,0.32); background:#050505;
  }
  .sw-canvas[data-aes="cinema"]::before {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:3;
    background:radial-gradient(ellipse 70% 60% at 50% 50%,transparent 0%,transparent 35%,rgba(0,0,0,0.85) 100%);
  }

  /* nodes */
  #sw-wrap { position:absolute; inset:0; z-index:2; }
  #sw-svg  { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; }

  .sw-node { position:absolute; transform:translate(-50%,-50%); cursor:grab; user-select:none; transition:filter 240ms ease,opacity 240ms ease; }
  .sw-node.dragging { cursor:grabbing; z-index:20; }
  .sw-node-inner { position:relative; transition:border-color 200ms,background 200ms; }
  .sw-node-text {
    color:var(--sw-ink); background:transparent; border:none; resize:none; outline:none;
    width:100%; text-align:center; font-family:var(--sw-sans); cursor:text; overflow:hidden; padding:0; line-height:1.45;
  }
  .sw-node-text::placeholder { color:var(--sw-ink-faint); font-style:italic; }
  .sw-node.d0 .sw-node-text { font-family:var(--sw-serif); font-weight:400; font-style:italic; font-size:22px; letter-spacing:0.01em; }
  .sw-node.d1 .sw-node-text { font-size:14px; }
  .sw-node.d2 .sw-node-text { font-size:12.5px; }

  /* cards */
  .sw-canvas[data-node="cards"] .sw-node.d0 .sw-node-inner {
    width:180px;min-height:180px;border-radius:50%;background:var(--sw-node-bg);border:1px solid var(--sw-accent-soft);
    backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;
  }
  .sw-canvas[data-node="cards"] .sw-node.d1 .sw-node-inner {
    min-width:130px;max-width:180px;min-height:56px;background:var(--sw-node-bg);border:1px solid var(--sw-node-border);
    border-radius:10px;display:flex;align-items:center;justify-content:center;padding:12px 16px;backdrop-filter:blur(6px);
  }
  .sw-canvas[data-node="cards"] .sw-node.d2 .sw-node-inner {
    min-width:100px;max-width:150px;min-height:44px;background:transparent;border:1px dashed var(--sw-node-border);
    border-radius:6px;display:flex;align-items:center;justify-content:center;padding:8px 12px;
  }

  /* floating */
  .sw-canvas[data-node="floating"] .sw-node-inner {
    padding:8px 14px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;min-width:90px;
  }
  .sw-canvas[data-node="floating"] .sw-node.d0 .sw-node-inner { min-width:140px; }
  .sw-canvas[data-node="floating"] .sw-node.d0 .sw-node-text { font-size:26px; }
  .sw-canvas[data-node="floating"] .sw-node.d1 .sw-node-text { font-size:15px;font-style:italic;font-family:var(--sw-serif); }
  .sw-canvas[data-node="floating"] .sw-node.d2 .sw-node-text { font-size:13px;color:var(--sw-ink-soft); }

  /* organic */
  .sw-canvas[data-node="organic"] .sw-node.d0 .sw-node-inner {
    width:190px;min-height:170px;border-radius:60% 40% 55% 45% / 50% 60% 40% 50%;
    background:var(--sw-node-bg);border:1px solid var(--sw-accent-soft);
    backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;
  }
  .sw-canvas[data-node="organic"] .sw-node.d1 .sw-node-inner {
    min-width:130px;max-width:170px;min-height:60px;background:var(--sw-node-bg);
    border:1px solid var(--sw-node-border);border-radius:55% 45% 50% 50% / 60% 50% 50% 40%;
    display:flex;align-items:center;justify-content:center;padding:14px 18px;
  }
  .sw-canvas[data-node="organic"] .sw-node.d2 .sw-node-inner {
    min-width:100px;max-width:140px;min-height:44px;background:transparent;
    border:1px solid var(--sw-node-border);border-radius:60% 40% 55% 45% / 45% 55% 45% 55%;
    display:flex;align-items:center;justify-content:center;padding:10px 14px;
  }

  /* tags */
  .sw-canvas[data-node="tags"] .sw-node-inner {
    padding:4px 0 6px;background:transparent;border:none;
    border-bottom:1px solid var(--sw-node-border);min-width:100px;
    display:flex;align-items:center;justify-content:center;
  }
  .sw-canvas[data-node="tags"] .sw-node.d0 .sw-node-inner { min-width:160px;border-bottom:1px solid var(--sw-accent-soft);padding:6px 0 10px; }
  .sw-canvas[data-node="tags"] .sw-node.d2 .sw-node-inner { border-bottom:1px dashed var(--sw-node-border); }
  .sw-canvas[data-node="tags"] .sw-node.d1 .sw-node-text { font-style:italic;font-family:var(--sw-serif);font-size:15px; }

  /* add btn */
  .sw-add { position:absolute;bottom:-10px;right:-10px;width:22px;height:22px;border-radius:50%;
    background:var(--sw-accent);color:var(--sw-canvas-bg);border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;padding:0;opacity:0;
    transition:all 200ms;z-index:5; }
  .sw-node:hover .sw-add, .sw-node.focused .sw-add { opacity:1; }
  .sw-add:hover { transform:scale(1.18); }
  .sw-add svg { width:10px;height:10px; }
  .sw-canvas[data-node="tags"] .sw-add { bottom:-8px;right:-2px; }
  .sw-canvas[data-node="floating"] .sw-add { bottom:-2px;right:-2px; }
  .sw-canvas[data-aes="cinema"] .sw-node:not(.focused) { filter:blur(1.2px);opacity:0.5; }
  .sw-canvas[data-aes="cinema"] .sw-node.focused { filter:none;opacity:1; }

  /* canvas mark */
  .sw-mark { position:absolute;bottom:16px;right:16px;width:22px;height:22px;color:var(--sw-ink-faint);pointer-events:none;z-index:5; }

  /* tweaks panel */
  .sw-tweaks {
    position:absolute;bottom:16px;right:16px;width:264px;
    background:rgba(10,10,10,0.92);backdrop-filter:blur(20px) saturate(120%);
    border:1px solid rgba(245,240,232,0.1);border-radius:12px;
    color:rgba(245,240,232,0.92);font-family:var(--sw-sans);font-size:12px;
    z-index:20;padding:14px 14px 12px;box-shadow:0 16px 40px rgba(0,0,0,0.5);
  }
  .sw-tw-head { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; }
  .sw-tw-title { font-family:var(--sw-serif);font-style:italic;font-size:16px;color:var(--sw-buriti);letter-spacing:0.02em; }
  .sw-tw-close { background:transparent;border:none;color:rgba(245,240,232,0.55);cursor:pointer;padding:4px;line-height:1; }
  .sw-tw-close:hover { color:var(--sw-buriti); }
  .sw-tw-group { margin-bottom:12px; }
  .sw-tw-group:last-child { margin-bottom:0; }
  .sw-tw-label { font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(245,240,232,0.45);margin-bottom:6px; }
  .sw-tw-opts { display:grid;grid-template-columns:repeat(4,1fr);gap:4px; }
  .sw-tw-opt {
    background:transparent;border:1px solid rgba(245,240,232,0.12);color:rgba(245,240,232,0.7);
    font-family:var(--sw-sans);font-size:10.5px;padding:7px 4px;border-radius:6px;
    cursor:pointer;transition:all 160ms;text-align:center;
  }
  .sw-tw-opt:hover { border-color:rgba(200,132,26,0.45);color:var(--sw-buriti); }
  .sw-tw-opt.on { border-color:var(--sw-buriti);background:rgba(200,132,26,0.12);color:var(--sw-buriti); }
  .sw-tw-swatch { display:block;width:16px;height:16px;border-radius:50%;margin:0 auto 4px;border:1px solid rgba(245,240,232,0.15); }
`

function injectCSS() {
  if (document.getElementById('sw-canvas-styles')) return
  const el = document.createElement('style')
  el.id = 'sw-canvas-styles'; el.textContent = SW_CSS
  document.head.appendChild(el)
}

/* ─── spiral ─── */
function spiralPath(turns, aStart, aGrow, samples) {
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * turns * Math.PI * 2
    const r = aStart + aGrow * t
    d += (i === 0 ? 'M' : 'L') + (Math.cos(t)*r).toFixed(2) + ' ' + (Math.sin(t)*r).toFixed(2) + ' '
  }
  return d
}
function spiralSVG(viewSize = 14, stroke = 1.2, turns = 2.4, aStart = 0.5, aGrow = 1.4) {
  const p = spiralPath(turns, aStart, aGrow, 200)
  const h = viewSize
  return `<svg viewBox="${-h} ${-h} ${h*2} ${h*2}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"><path d="${p}"/></svg>`
}

/* ─── main component ─── */
export default function ShadowWorkPage() {
  const { id: sessionIdParam } = useParams()
  const sessionId = sessionIdParam === 'new' ? null : sessionIdParam
  const navigate = useNavigate()
  const { saveSession, loadSession, createSession } = useShadowWork()

  const [tweaks, setTweaks] = useState({ canvasAes: 'mono', nodeStyle: 'floating', entryBg: 'neblina' })
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const [dbId, setDbId] = useState(sessionId || null)

  const canvasRef = useRef(null)
  const wrapRef   = useRef(null)
  const svgRef    = useRef(null)
  const markRef   = useRef(null)
  const st = useRef({ nodes: {}, connections: [], nextId: 1, drag: { active: false }, focusedId: null })

  useEffect(() => { injectCSS(); injectFont() }, [])

  /* inject mark spiral */
  useEffect(() => {
    if (markRef.current) markRef.current.innerHTML = spiralSVG()
  }, [])

  /* load existing session */
  useEffect(() => {
    if (!sessionId) return
    loadSession(sessionId).then(s => {
      setTitle(s.title || '')
      setTweaks({ canvasAes: s.canvas_aes || 'mono', nodeStyle: s.node_style || 'floating', entryBg: s.entry_bg || 'neblina' })
      setDbId(s.id)
      // restore canvas after it mounts
      setTimeout(() => restoreCanvas(s.nodes || {}, s.connections || []), 80)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  /* init blank canvas (new session) */
  useEffect(() => {
    if (sessionId) return
    const t = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const id = createNodeEl(canvas.offsetWidth / 2, canvas.offsetHeight / 2, null)
      focusNode(id)
      setTimeout(() => document.getElementById('sw-nd-' + id)?.querySelector('textarea')?.focus(), 50)
    }, 80)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* update canvas attrs when tweaks change */
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.setAttribute('data-aes', tweaks.canvasAes)
    c.setAttribute('data-node', tweaks.nodeStyle)
    updateLines()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tweaks])

  /* drag listeners */
  useEffect(() => {
    function onMove(e) {
      const drag = st.current.drag
      if (!drag?.active) return
      const rect = canvasRef.current?.getBoundingClientRect() || { left:0,top:0,width:800,height:600 }
      const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left - drag.ox
      const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top  - drag.oy
      st.current.nodes[drag.id].x = Math.max(50, Math.min(rect.width  - 50, cx))
      st.current.nodes[drag.id].y = Math.max(30, Math.min(rect.height - 30, cy))
      const el = document.getElementById('sw-nd-' + drag.id)
      if (el) { el.style.left = st.current.nodes[drag.id].x + 'px'; el.style.top = st.current.nodes[drag.id].y + 'px' }
      updateLines()
    }
    function onTouchMove(e) { onMove(e); e.preventDefault() }
    function onUp() {
      if (st.current.drag?.active) document.getElementById('sw-nd-' + st.current.drag.id)?.classList.remove('dragging')
      if (st.current.drag) st.current.drag.active = false
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    window.addEventListener('resize', updateLines)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchend', onUp)
      window.removeEventListener('resize', updateLines)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ─── canvas helpers ─── */
  function getRect() {
    return canvasRef.current?.getBoundingClientRect() || { left:0,top:0,width:800,height:600 }
  }
  function depthOf(id) {
    let d = 0, cur = id
    while (st.current.nodes[cur]?.parentId) { d++; cur = st.current.nodes[cur].parentId; if (d > 10) break }
    return d
  }
  function updateLines() {
    const svg = svgRef.current; if (!svg) return
    const canvas = canvasRef.current
    const lineColor = canvas ? getComputedStyle(canvas).getPropertyValue('--sw-line').trim() || 'rgba(200,132,26,0.22)' : 'rgba(200,132,26,0.22)'
    let html = ''
    st.current.connections.forEach(c => {
      const a = st.current.nodes[c.from], b = st.current.nodes[c.to]
      if (!a || !b) return
      const dx = b.x-a.x, dy = b.y-a.y, len = Math.sqrt(dx*dx+dy*dy) || 1
      const mx = a.x+dx*0.5, my = a.y+dy*0.5, off = Math.min(50, len*0.18)
      const cx = mx+(-dy/len)*off, cy = my+(dx/len)*off
      const foc = st.current.focusedId===a.id || st.current.focusedId===b.id
      html += `<path d="M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}" stroke="${lineColor}" stroke-width="${foc?1.4:1}" fill="none" stroke-linecap="round"/>`
    })
    svg.innerHTML = html
  }
  function focusNode(id) {
    st.current.focusedId = id
    document.querySelectorAll('.sw-node').forEach(n => n.classList.remove('focused'))
    document.getElementById('sw-nd-' + id)?.classList.add('focused')
    updateLines()
  }
  function pickAngle(parentId) {
    const parent = st.current.nodes[parentId]
    const siblings = st.current.connections.filter(c => c.from === parentId).map(c => st.current.nodes[c.to]).filter(Boolean)
    if (!siblings.length) return Math.random() * Math.PI * 2
    let best = 0, bestScore = -Infinity
    for (let i = 0; i < 18; i++) {
      const cand = (i/18)*Math.PI*2; let minD = Infinity
      siblings.forEach(s => { const sa = Math.atan2(s.y-parent.y,s.x-parent.x); let d = Math.abs(cand-sa); if (d>Math.PI) d=Math.PI*2-d; if (d<minD) minD=d })
      if (minD > bestScore) { bestScore = minD; best = cand }
    }
    return best
  }

  function createNodeEl(x, y, parentId) {
    const s = st.current, id = s.nextId++
    s.nodes[id] = { id, x, y, text: '', parentId: parentId || null }
    if (parentId) s.connections.push({ from: parentId, to: id })
    renderNode(id); updateLines()
    return id
  }

  function renderNode(id) {
    const s = st.current, node = s.nodes[id], wrap = wrapRef.current
    if (!wrap || !node) return
    const d = Math.min(depthOf(id), 2)

    const div = document.createElement('div')
    div.className = `sw-node d${d}`; div.id = 'sw-nd-'+id
    div.style.left = node.x+'px'; div.style.top = node.y+'px'

    const inner = document.createElement('div'); inner.className = 'sw-node-inner'

    const ta = document.createElement('textarea'); ta.className = 'sw-node-text'; ta.rows = 1
    ta.placeholder = d === 0 ? '·' : ''; ta.value = node.text
    ta.addEventListener('input', () => { node.text = ta.value; ta.style.height = 'auto'; ta.style.height = ta.scrollHeight+'px' })
    ta.addEventListener('focus', () => focusNode(id))
    ta.addEventListener('mousedown', e => e.stopPropagation())
    ta.addEventListener('touchstart', e => e.stopPropagation())

    const addBtn = document.createElement('button'); addBtn.className = 'sw-add'; addBtn.setAttribute('aria-label', 'expandir')
    addBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 4L8 12M4 8L12 8"/></svg>'
    addBtn.addEventListener('mousedown', e => e.stopPropagation())
    addBtn.addEventListener('touchstart', e => e.stopPropagation())
    addBtn.addEventListener('click', e => {
      e.stopPropagation()
      const angle = pickAngle(id), dist = 170 + Math.random()*40
      const rect = canvasRef.current?.getBoundingClientRect() || { width:800,height:600 }
      const newId = createNodeEl(
        Math.max(80, Math.min(rect.width-80, node.x+Math.cos(angle)*dist)),
        Math.max(60, Math.min(rect.height-60, node.y+Math.sin(angle)*dist)), id
      )
      setTimeout(() => document.getElementById('sw-nd-'+newId)?.querySelector('textarea')?.focus(), 30)
    })

    div.addEventListener('mousedown', e => {
      if (e.target.tagName==='TEXTAREA' || e.target.closest('.sw-add')) return
      const rect = getRect()
      s.drag = { active:true, id, ox:e.clientX-rect.left-node.x, oy:e.clientY-rect.top-node.y }
      div.classList.add('dragging'); focusNode(id); e.preventDefault()
    })
    div.addEventListener('touchstart', e => {
      if (e.target.tagName==='TEXTAREA' || e.target.closest('.sw-add')) return
      const touch = e.touches[0], rect = getRect()
      s.drag = { active:true, id, ox:touch.clientX-rect.left-node.x, oy:touch.clientY-rect.top-node.y }
      div.classList.add('dragging'); focusNode(id)
    }, { passive: true })

    inner.appendChild(ta); inner.appendChild(addBtn); div.appendChild(inner); wrap.appendChild(div)
    setTimeout(() => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight+'px' }, 10)
  }

  function restoreCanvas(nodes, connections) {
    const s = st.current
    s.nodes = {}; s.connections = []; s.nextId = 1; s.focusedId = null
    if (wrapRef.current) wrapRef.current.innerHTML = ''
    if (svgRef.current)  svgRef.current.innerHTML  = ''
    // restore — sort by id to maintain parent refs
    const sorted = Object.values(nodes).sort((a,b) => a.id - b.id)
    sorted.forEach(n => { s.nodes[n.id] = n; s.nextId = Math.max(s.nextId, n.id+1) })
    s.connections = connections.filter(c => s.nodes[c.from] && s.nodes[c.to])
    sorted.forEach(n => renderNode(n.id))
    updateLines()
  }

  function resetCanvas() {
    const s = st.current; s.nodes = {}; s.connections = []; s.nextId = 1; s.focusedId = null
    if (wrapRef.current) wrapRef.current.innerHTML = ''
    if (svgRef.current)  svgRef.current.innerHTML  = ''
    const canvas = canvasRef.current
    const id = createNodeEl((canvas?.offsetWidth||800)/2, (canvas?.offsetHeight||600)/2, null)
    focusNode(id)
    setTimeout(() => document.getElementById('sw-nd-'+id)?.querySelector('textarea')?.focus(), 50)
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const payload = {
        title,
        nodes: st.current.nodes,
        connections: st.current.connections,
        canvasAes: tweaks.canvasAes,
        nodeStyle: tweaks.nodeStyle,
        entryBg: tweaks.entryBg,
      }
      if (dbId) {
        await saveSession(dbId, payload)
      } else {
        const created = await createSession(tweaks)
        await saveSession(created.id, payload)
        setDbId(created.id)
        // update URL without re-mounting
        window.history.replaceState({}, '', '/shadow-work/' + created.id)
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (e) {
      setSaveStatus('idle')
      console.error('save failed', e)
    }
  }

  function setTweak(key, val) { setTweaks(prev => ({ ...prev, [key]: val })) }

  const COLOR_OPTS = [
    { val: 'paper',  name: 'papel'  },
    { val: 'mono',   name: 'mono'   },
    { val: 'cinema', name: 'cinema' },
  ]
  const STYLE_OPTS = [
    { val: 'cards',    name: 'cards'    },
    { val: 'floating', name: 'flutuar'  },
    { val: 'organic',  name: 'orgânico' },
    { val: 'tags',     name: 'tags'     },
  ]

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* chrome bar */}
      <div style={{
        flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px', borderBottom: '1px solid rgba(245,240,232,0.08)',
        background: '#050505', zIndex: 10,
      }}>
        {/* back */}
        <button onClick={() => navigate('/shadow-work')} style={{ width:32,height:32,borderRadius:'50%',border:'1px solid rgba(245,240,232,0.12)',background:'transparent',color:'rgba(245,240,232,0.55)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 160ms' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(200,132,26,0.5)';e.currentTarget.style.color='#C8841A'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(245,240,232,0.12)';e.currentTarget.style.color='rgba(245,240,232,0.55)'}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M10 4L6 8L10 12"/></svg>
        </button>

        {/* title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="sessão sem título"
          style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'rgba(245,240,232,0.88)', fontFamily:'Cormorant Garamond, Georgia, serif', fontStyle:'italic', fontSize:18, letterSpacing:'0.01em' }}
        />

        {/* tweaks toggle */}
        <button onClick={() => setTweaksOpen(o => !o)} style={{ padding:'5px 10px',borderRadius:20,border:'1px solid rgba(245,240,232,0.12)',background:tweaksOpen?'rgba(200,132,26,0.12)':'transparent',color:tweaksOpen?'#C8841A':'rgba(245,240,232,0.45)',fontSize:11,letterSpacing:'0.12em',cursor:'pointer',fontFamily:'inherit',transition:'all 160ms' }}>
          tweaks
        </button>

        {/* reset */}
        <button onClick={resetCanvas} style={{ width:32,height:32,borderRadius:'50%',border:'1px solid rgba(245,240,232,0.12)',background:'transparent',color:'rgba(245,240,232,0.45)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 160ms' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(200,132,26,0.5)';e.currentTarget.style.color='#C8841A'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(245,240,232,0.12)';e.currentTarget.style.color='rgba(245,240,232,0.45)'}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><path d="M8 5L8 8L10 9"/></svg>
        </button>

        {/* save */}
        <button onClick={saveStatus === 'saving' ? undefined : handleSave}
          style={{ padding:'6px 16px',borderRadius:20,border:'none',cursor:saveStatus==='saving'?'wait':'pointer',fontSize:12,fontWeight:600,letterSpacing:'0.08em',transition:'all 160ms', fontFamily:'inherit',
            background: saveStatus==='saved' ? '#16a34a' : saveStatus==='saving' ? 'rgba(200,132,26,0.4)' : '#C8841A',
            color: '#050505',
          }}>
          {saveStatus==='saved' ? '✓ salvo' : saveStatus==='saving' ? '...' : 'salvar'}
        </button>
      </div>

      {/* canvas area */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <div
          ref={canvasRef}
          className="sw-canvas"
          data-aes={tweaks.canvasAes}
          data-node={tweaks.nodeStyle}
        >
          <svg ref={svgRef} id="sw-svg" />
          <div ref={wrapRef} id="sw-wrap" />
          <div ref={markRef} className="sw-mark" />

          {/* tweaks panel */}
          {tweaksOpen && (
            <div className="sw-tweaks">
              <div className="sw-tw-head">
                <span className="sw-tw-title">Tweaks</span>
                <button className="sw-tw-close" onClick={() => setTweaksOpen(false)}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 3L13 13M13 3L3 13"/></svg>
                </button>
              </div>

              {[
                { label: 'color', key: 'canvasAes', opts: COLOR_OPTS },
                { label: 'style', key: 'nodeStyle',  opts: STYLE_OPTS },
              ].map(group => (
                <div key={group.key} className="sw-tw-group">
                  <div className="sw-tw-label">{group.label}</div>
                  <div className="sw-tw-opts">
                    {group.opts.map(opt => (
                      <button key={opt.val}
                        className={`sw-tw-opt${tweaks[group.key]===opt.val?' on':''}`}
                        onClick={() => setTweak(group.key, opt.val)}>
                        {opt.swatch && <span className="sw-tw-swatch" style={{background:opt.swatch}}/>}
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
