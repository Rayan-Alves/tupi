import { useState, useEffect, useRef } from 'react'

const SW_CSS = `
@keyframes sw-breathe{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.07)}}
@keyframes sw-ring1{0%{transform:translate(-50%,-50%) scale(1);opacity:.5}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
@keyframes sw-ring2{0%{transform:translate(-50%,-50%) scale(1);opacity:.3}100%{transform:translate(-50%,-50%) scale(2.8);opacity:0}}
.sw-portal-btn{position:relative;width:110px;height:110px}
.sw-ring{position:absolute;left:50%;top:50%;width:110px;height:110px;border-radius:50%;border:1px solid rgba(200,132,26,0.5)}
.sw-r1{animation:sw-ring1 2.4s ease-out infinite}
.sw-r2{animation:sw-ring2 2.4s ease-out infinite 0.6s}
.sw-main-c{position:absolute;left:50%;top:50%;width:80px;height:80px;border-radius:50%;background:#0D0D0D;border:1px solid rgba(200,132,26,0.6);animation:sw-breathe 3s ease-in-out infinite;display:flex;align-items:center;justify-content:center}
.sw-main-c-inner{width:32px;height:32px;border-radius:50%;background:rgba(200,132,26,0.12);border:1px solid rgba(200,132,26,0.4)}
.sw-node{position:absolute;transform:translate(-50%,-50%);cursor:grab;user-select:none}
.sw-node:active{cursor:grabbing}
.sw-node-center{width:130px;min-height:130px;border-radius:50%;background:#0D0D0D;border:1px solid rgba(200,132,26,0.5);display:flex;align-items:center;justify-content:center;padding:16px}
.sw-node-child{min-width:100px;max-width:140px;min-height:54px;background:#0D0D0D;border:0.5px solid rgba(200,132,26,0.35);border-radius:6px;display:flex;align-items:center;justify-content:center;padding:10px 12px}
.sw-node-deep{min-width:80px;max-width:120px;min-height:44px;background:#0D0D0D;border:0.5px solid rgba(200,132,26,0.2);border-radius:4px;display:flex;align-items:center;justify-content:center;padding:8px 10px}
.sw-node-text{color:rgba(200,132,26,0.85);font-size:11.5px;line-height:1.5;text-align:center;outline:none;background:transparent;border:none;resize:none;width:100%;cursor:text;min-height:18px;font-family:inherit}
.sw-node-text::placeholder{color:rgba(200,132,26,0.3)}
.sw-node-add{position:absolute;bottom:-11px;right:-11px;width:22px;height:22px;border-radius:50%;background:rgba(200,132,26,0.75);color:#080808;border:none;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;z-index:5;transition:all .2s;flex-shrink:0}
.sw-node-add:hover{background:rgba(200,132,26,1);transform:scale(1.15)}
`

function injectStyles() {
  if (document.getElementById('sw-styles')) return
  const el = document.createElement('style')
  el.id = 'sw-styles'
  el.textContent = SW_CSS
  document.head.appendChild(el)
}

export default function ShadowWork() {
  const [screen, setScreen] = useState('portal')
  const stRef    = useRef({ nodes: {}, connections: [], nextId: 1, drag: { active: false } })
  const canvasRef = useRef(null)
  const wrapRef   = useRef(null)
  const svgRef    = useRef(null)

  useEffect(() => { injectStyles() }, [])

  /* ── helpers ── */
  function getRect() { return canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 640, height: 500 } }

  function nodeDepth(id) {
    const { nodes } = stRef.current
    if (!nodes[id] || !nodes[id].parentId) return 0
    return 1 + nodeDepth(nodes[id].parentId)
  }

  function nodeClass(id) {
    const d = nodeDepth(id)
    if (d === 0) return 'sw-node-center'
    if (d === 1) return 'sw-node-child'
    return 'sw-node-deep'
  }

  function updateLines() {
    const { nodes, connections } = stRef.current
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    connections.forEach(c => {
      const a = nodes[c.from], b = nodes[c.to]
      if (!a || !b) return
      const dx = b.x - a.x, dy = b.y - a.y
      const mx = a.x + dx * 0.5, my = a.y + dy * 0.5
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const off = 40
      const cx = mx + (-dy / len) * off
      const cy = my + (dx / len) * off
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`)
      path.setAttribute('stroke', 'rgba(200,132,26,0.25)')
      path.setAttribute('stroke-width', '1')
      path.setAttribute('fill', 'none')
      svg.appendChild(path)
    })
  }

  function updateNodePos(id) {
    const { nodes } = stRef.current
    const el = document.getElementById('sw-nd-' + id)
    if (el) { el.style.left = nodes[id].x + 'px'; el.style.top = nodes[id].y + 'px' }
  }

  function renderNode(id) {
    const st = stRef.current
    const node = st.nodes[id]
    const wrap = wrapRef.current
    if (!wrap || !node) return

    const div = document.createElement('div')
    div.className = 'sw-node'
    div.id = 'sw-nd-' + id
    div.style.left = node.x + 'px'
    div.style.top  = node.y + 'px'

    const inner = document.createElement('div')
    inner.className = nodeClass(id)
    inner.style.position = 'relative'

    const ta = document.createElement('textarea')
    ta.className   = 'sw-node-text'
    ta.rows        = 1
    ta.placeholder = node.parentId ? 'explore...' : 'sombra central...'
    ta.value       = node.text
    ta.addEventListener('input', () => {
      node.text = ta.value
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    })
    ta.addEventListener('mousedown', e => e.stopPropagation())
    ta.addEventListener('touchstart', e => e.stopPropagation())

    const addBtn = document.createElement('button')
    addBtn.className = 'sw-node-add'
    addBtn.textContent = '+'
    addBtn.addEventListener('mousedown', e => e.stopPropagation())
    addBtn.addEventListener('click', e => {
      e.stopPropagation()
      const angle = Math.random() * Math.PI * 2
      const dist  = 160 + Math.random() * 60
      const canvas = canvasRef.current
      const cw = canvas?.offsetWidth || 640
      const ch = canvas?.offsetHeight || 500
      const newId = createNode(
        Math.max(70, Math.min(cw - 70, node.x + Math.cos(angle) * dist)),
        Math.max(40, Math.min(ch - 40, node.y + Math.sin(angle) * dist)),
        id
      )
      setTimeout(() => {
        const el = document.getElementById('sw-nd-' + newId)
        if (el) { const t = el.querySelector('textarea'); if (t) t.focus() }
      }, 50)
    })

    inner.appendChild(ta)
    inner.appendChild(addBtn)
    div.appendChild(inner)

    div.addEventListener('mousedown', e => {
      if (e.target.tagName === 'TEXTAREA' || e.target === addBtn) return
      const rect = getRect()
      st.drag = { active: true, id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y }
      div.style.zIndex = 10
      e.preventDefault()
    })

    div.addEventListener('touchstart', e => {
      if (e.target.tagName === 'TEXTAREA' || e.target === addBtn) return
      const touch = e.touches[0]
      const rect = getRect()
      st.drag = { active: true, id, ox: touch.clientX - rect.left - node.x, oy: touch.clientY - rect.top - node.y }
      div.style.zIndex = 10
    }, { passive: true })

    wrap.appendChild(div)
    setTimeout(() => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }, 10)
  }

  function createNode(x, y, parentId) {
    const st = stRef.current
    const id = st.nextId++
    st.nodes[id] = { id, x, y, text: '', parentId: parentId || null }
    if (parentId) st.connections.push({ from: parentId, to: id })
    renderNode(id)
    updateLines()
    return id
  }

  function resetCanvas() {
    const st = stRef.current
    st.nodes = {}; st.connections = []; st.nextId = 1
    if (wrapRef.current) wrapRef.current.innerHTML = ''
    if (svgRef.current)  svgRef.current.innerHTML  = ''
    const canvas = canvasRef.current
    const cw = canvas?.offsetWidth || 640
    const ch = canvas?.offsetHeight || 500
    createNode(cw / 2, ch / 2, null)
  }

  /* ── canvas event listeners ── */
  useEffect(() => {
    if (screen !== 'canvas') return
    const canvas = canvasRef.current
    if (!canvas) return

    // init
    resetCanvas()
    setTimeout(() => {
      const el = document.getElementById('sw-nd-1')
      if (el) { const t = el.querySelector('textarea'); if (t) t.focus() }
    }, 100)

    function onMouseMove(e) {
      const st = stRef.current
      if (!st.drag?.active) return
      const rect = getRect()
      const node = st.nodes[st.drag.id]
      if (!node) return
      node.x = Math.max(50, Math.min(rect.width  - 50, e.clientX - rect.left - st.drag.ox))
      node.y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top  - st.drag.oy))
      updateNodePos(st.drag.id)
      updateLines()
    }

    function onTouchMove(e) {
      const st = stRef.current
      if (!st.drag?.active) return
      const touch = e.touches[0]
      const rect  = getRect()
      const node  = st.nodes[st.drag.id]
      if (!node) return
      node.x = Math.max(50, Math.min(rect.width  - 50, touch.clientX - rect.left - st.drag.ox))
      node.y = Math.max(30, Math.min(rect.height - 30, touch.clientY - rect.top  - st.drag.oy))
      updateNodePos(st.drag.id)
      updateLines()
      e.preventDefault()
    }

    function onUp() {
      const st = stRef.current
      if (st.drag?.active) {
        const el = document.getElementById('sw-nd-' + st.drag.id)
        if (el) el.style.zIndex = ''
      }
      if (st.drag) st.drag.active = false
    }

    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('touchmove',  onTouchMove, { passive: false })
    canvas.addEventListener('mouseup',    onUp)
    canvas.addEventListener('touchend',   onUp)

    return () => {
      canvas.removeEventListener('mousemove',  onMouseMove)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('touchend',   onUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  /* ── render ── */
  return (
    <section className="space-y-4">
      <h2 className="font-display text-4xl font-semibold text-[#2D2A26]">Shadow Work</h2>

      {screen === 'portal' ? (
        <div
          onClick={() => setScreen('canvas')}
          style={{ minHeight: 300, background: '#080808', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', cursor: 'pointer' }}
        >
          <div className="sw-portal-btn">
            <div className="sw-ring sw-r1" />
            <div className="sw-ring sw-r2" />
            <div className="sw-main-c"><div className="sw-main-c-inner" /></div>
          </div>
          <span style={{ color: 'rgba(200,132,26,0.45)', fontSize: 12, letterSpacing: '0.14em' }}>
            entre se estiver pronto
          </span>
        </div>
      ) : (
        <div
          ref={canvasRef}
          style={{ minHeight: 500, background: '#080808', borderRadius: 16, position: 'relative', overflow: 'hidden' }}
        >
          <button
            onClick={() => setScreen('portal')}
            style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(200,132,26,0.08)', border: '0.5px solid rgba(200,132,26,0.25)', borderRadius: 20, color: 'rgba(200,132,26,0.6)', fontSize: 11, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em', zIndex: 20, fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,132,26,0.15)'; e.currentTarget.style.color = 'rgba(200,132,26,0.9)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,132,26,0.08)'; e.currentTarget.style.color = 'rgba(200,132,26,0.6)' }}
          >← sair</button>

          <button
            onClick={resetCanvas}
            style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: 'rgba(200,132,26,0.3)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em', zIndex: 20, fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,132,26,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,132,26,0.3)'}
          >limpar tudo</button>

          <svg
            ref={svgRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
          />
          <div ref={wrapRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />

          <span style={{ position: 'absolute', bottom: '1.2rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(200,132,26,0.2)', fontSize: 11, letterSpacing: '0.08em', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            arraste os nós · clique em + para expandir
          </span>
        </div>
      )}
    </section>
  )
}
