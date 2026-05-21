import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { STAGES } from './KanbanBoard'
import { computeProgress, computeCheckUpdate } from '../../lib/recurring'
import NewProjectModal from './NewProjectModal'

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const T = {
  igapo:           '#1A3A1F',
  buriti:          '#C8841A',
  tabatinga:       '#C4A882',
  neblina:         '#F5F0E8',
  paper:           '#FDFAF3',
  paperShadow:     'rgba(60, 45, 20, 0.06)',
  paperShadowSoft: 'rgba(60, 45, 20, 0.04)',
  phaseSolo:       '#5A6E4C',
  phasePlantar:    '#2E5D2E',
  phaseRegar:      '#4A7A78',
  phaseColher:     '#C8841A',
  fioColor:        'rgba(196, 168, 130, 0.55)',
  fontHead:        "'Cormorant Garamond', Georgia, serif",
  fontBody:        "'Plus Jakarta Sans', -apple-system, sans-serif",
}

const FX_CSS = `
.fx-editable[contenteditable][data-placeholder]:empty::before {
  content: attr(data-placeholder);
  color: rgba(196, 168, 130, 0.7);
  font-style: italic;
  pointer-events: none;
}
.fx-canvas { touch-action: none; }
.fx-card-action { opacity: 0; transition: opacity .15s; }
.fx-card:hover .fx-card-action { opacity: 1; }
`
function injectFxCss() {
  const id = 'fx-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id
    el.textContent = FX_CSS
    document.head.appendChild(el)
  }
}

/* ─── SVG glyphs ──────────────────────────────────────────────────────────── */
function GlyphSolo({ size = 22, stroke = 1.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 C 7 7, 11 11, 15 9 S 21 8, 21 9" />
      <path d="M3 14 C 7 12, 11 16, 15 14 S 21 13, 21 14" />
      <path d="M3 19 C 7 17, 11 21, 15 19 S 21 18, 21 19" />
    </svg>
  )
}
function GlyphPlantar({ size = 22, stroke = 1.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21 L 12 12" />
      <path d="M12 14 C 8 14, 6 11, 6 8 C 9 8, 12 10, 12 14 Z" />
      <path d="M12 12 C 16 12, 18 9, 18 6 C 15 6, 12 8, 12 12 Z" />
    </svg>
  )
}
function GlyphRegar({ size = 22, stroke = 1.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C 12 3, 6 11, 6 15 A 6 6 0 0 0 18 15 C 18 11, 12 3, 12 3 Z" />
    </svg>
  )
}
function GlyphColher({ size = 22, stroke = 1.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 L 12 6" />
      <path d="M12 10 C 9 10, 7 8, 7 6 C 9 6, 11 7, 12 10 Z" />
      <path d="M12 10 C 15 10, 17 8, 17 6 C 15 6, 13 7, 12 10 Z" />
      <path d="M12 14 C 9 14, 7 12, 7 10 C 9 10, 11 11, 12 14 Z" />
      <path d="M12 14 C 15 14, 17 12, 17 10 C 15 10, 13 11, 12 14 Z" />
    </svg>
  )
}
const PHASE_GLYPHS = { solo: GlyphSolo, plantar: GlyphPlantar, regar: GlyphRegar, colher: GlyphColher }

/* ─── Organic fio path ────────────────────────────────────────────────────── */
function fioPath(x1, y1, x2, y2, seed = 1) {
  let x = (seed | 0) || 1
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) / 0xffffffff) }
  const dx = x2 - x1, dy = y2 - y1
  const isVert = Math.abs(dy) > Math.abs(dx)
  let cx1, cy1, cx2, cy2
  if (isVert) {
    const off = dx * 0.15 + (rnd() - 0.5) * 12
    cx1 = x1 + off; cy1 = y1 + dy * 0.55
    cx2 = x2 - off; cy2 = y2 - dy * 0.55
  } else {
    const off = dy * 0.15 + (rnd() - 0.5) * 12
    cx1 = x1 + dx * 0.55; cy1 = y1 + off
    cx2 = x2 - dx * 0.55; cy2 = y2 - off
  }
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

/* ─── useCanvas (pan / zoom / per-card drag) ──────────────────────────────── */
function useCanvas(initialCamera) {
  const [positions, setPositions] = useState({})
  const [camera, setCamera] = useState(initialCamera)
  const rootRef = useRef(null)
  const stateRef = useRef({ camera, positions })
  useEffect(() => { stateRef.current = { camera, positions } }, [camera, positions])

  // Background pan — uses document listeners so it works no matter where pointer goes
  const onBgPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return
    // Don't pan if user is interacting with a button/text inside the canvas
    if (e.target.closest('button, [contenteditable], input, textarea')) return
    const startX = e.clientX, startY = e.clientY
    const startCx = stateRef.current.camera.x
    const startCy = stateRef.current.camera.y
    document.body.style.cursor = 'grabbing'
    function onMove(ev) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setCamera(c => ({ ...c, x: startCx + dx, y: startCy + dy }))
    }
    function onUp() {
      document.body.style.cursor = ''
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }, [])

  // Per-card drag — also uses document listeners
  const startCardDrag = useCallback((id, layoutPos) => (e) => {
    if (e.button !== undefined && e.button !== 0) return
    // Don't drag the card when interacting with text/buttons inside it
    if (e.target.closest('button, [contenteditable], input, textarea')) return
    e.stopPropagation()
    const pos = stateRef.current.positions[id] || layoutPos || { x: 0, y: 0 }
    const startX = e.clientX, startY = e.clientY
    const startCardX = pos.x, startCardY = pos.y
    document.body.style.cursor = 'grabbing'
    function onMove(ev) {
      const scale = stateRef.current.camera.scale
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      setPositions(p => ({ ...p, [id]: { x: startCardX + dx, y: startCardY + dy } }))
    }
    function onUp() {
      document.body.style.cursor = ''
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }, [])

  const onWheel = useCallback((e) => {
    // Cmd/Ctrl + wheel = zoom; otherwise normal browser scroll
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const c = stateRef.current.camera
    const delta = -e.deltaY * 0.0015
    const next = Math.min(2, Math.max(0.25, c.scale * (1 + delta)))
    const rect = rootRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - 80
    const k = next / c.scale
    const nx = px - (px - c.x) * k
    const ny = py - (py - c.y) * k
    setCamera({ x: nx, y: ny, scale: next })
  }, [])

  const resetCamera = useCallback(() => setCamera(initialCamera), [initialCamera])
  const zoomBy = useCallback((mul) => setCamera(c => ({
    ...c,
    scale: Math.min(2, Math.max(0.25, c.scale * mul)),
  })), [])

  return {
    positions, setPositions, camera, setCamera, resetCamera, zoomBy, rootRef, startCardDrag,
    handlers: {
      onPointerDown: onBgPointerDown,
      onWheel,
    },
  }
}

/* ─── EditableText (contentEditable) ──────────────────────────────────────── */
function EditableText({ value, onChange, placeholder, style, multiline, onEnter, onBlur }) {
  const ref = useRef(null)
  const focused = useRef(false)

  useLayoutEffect(() => {
    if (ref.current && !focused.current && ref.current.textContent !== (value || '')) {
      ref.current.textContent = value || ''
    }
  }, [value])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="fx-editable"
      data-placeholder={placeholder}
      onFocus={() => { focused.current = true }}
      onBlur={(e) => { focused.current = false; onBlur?.(e.currentTarget.textContent || '') }}
      onInput={(e) => onChange?.(e.currentTarget.textContent || '')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault()
          e.currentTarget.blur()
          onEnter?.(e.currentTarget.textContent || '')
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ outline: 'none', minHeight: '1em', cursor: 'text', ...style }}
    />
  )
}

/* ─── Debounced save hook ─────────────────────────────────────────────────── */
function useDebouncedFn(fn, delay = 600) {
  const timer = useRef(null)
  const fnRef = useRef(fn)
  fnRef.current = fn
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fnRef.current(...args), delay)
  }, [delay])
}

/* ─── Card chrome ─────────────────────────────────────────────────────────── */
function Card({ id, x, y, width = 200, minHeight, accent, children, startCardDrag, zIndex = 2, style }) {
  return (
    <div
      className="fx-card"
      onPointerDown={startCardDrag ? startCardDrag(id, { x, y }) : undefined}
      style={{
        position: 'absolute',
        left: x, top: y,
        width, minHeight,
        transform: 'translate(-50%, -50%)',
        background: T.paper,
        borderRadius: 18,
        boxShadow: `0 1px 0 rgba(255,255,255,0.7) inset, 0 6px 22px ${T.paperShadow}, 0 1px 2px ${T.paperShadowSoft}`,
        padding: 18,
        fontFamily: T.fontBody,
        color: '#2a2520',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex,
        overflow: 'hidden',
        ...style,
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: accent, opacity: 0.85,
        }} />
      )}
      {children}
    </div>
  )
}

function ProgressBar({ value = 0, color = T.tabatinga }) {
  return (
    <div style={{ height: 2, background: 'rgba(196,168,130,0.18)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        height: '100%', width: `${Math.max(0, Math.min(100, value))}%`,
        background: color, transition: 'width .5s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  )
}

function Checkbox({ checked, onClick, color = T.igapo }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `1.2px solid ${checked ? color : T.tabatinga}`,
        background: checked ? color : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, flexShrink: 0,
        transition: 'all .25s cubic-bezier(.2,.7,.3,1)',
      }}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.2 L 4.2 7.2 L 8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

/* ─── Phase card ──────────────────────────────────────────────────────────── */
function PhaseCard({ id, x, y, glyphKind, label, progress, accent, startCardDrag, onAddTask, showAdd }) {
  const Glyph = PHASE_GLYPHS[glyphKind]
  return (
    <Card id={id} x={x} y={y} width={210} startCardDrag={startCardDrag} zIndex={3}
      style={{ textAlign: 'center' }}>
      <div style={{ color: accent, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
        {Glyph && <Glyph size={22} stroke={1.2} />}
      </div>
      <div style={{
        fontFamily: T.fontHead, fontSize: 19, color: T.igapo,
        letterSpacing: '0.005em', marginBottom: 4, lineHeight: 1.1,
        whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{ fontSize: 10.5, color: T.tabatinga, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>{progress}%</div>
      <ProgressBar value={progress} color={accent} />
      {showAdd && onAddTask && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddTask() }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: '50%',
            border: `1px dashed ${T.tabatinga}`,
            background: 'transparent',
            color: T.tabatinga, fontSize: 16, lineHeight: 1,
            cursor: 'pointer',
          }}
          title="adicionar primeira task"
        >+</button>
      )}
    </Card>
  )
}

/* ─── SMART card (editable) ───────────────────────────────────────────────── */
const SMART_META = {
  S: { full: 'Específico', placeholder: 'qual é o foco essencial?' },
  M: { full: 'Mensurável', placeholder: 'como saberei que cheguei?' },
  A: { full: 'Atingível',  placeholder: 'como vou fazer?' },
  R: { full: 'Relevante',  placeholder: 'por que isso importa?' },
  T: { full: 'Temporal',   placeholder: 'até quando?' },
}

function SmartCard({ id, x, y, letter, value, onChange, startCardDrag }) {
  const meta = SMART_META[letter]
  return (
    <Card id={id} x={x} y={y} width={180} minHeight={130} startCardDrag={startCardDrag}>
      <div style={{
        fontFamily: T.fontHead, fontSize: 24, color: T.buriti,
        fontStyle: 'italic', lineHeight: 1, marginBottom: 2,
      }}>{letter}</div>
      <div style={{
        fontSize: 9.5, letterSpacing: '0.1em', color: T.tabatinga,
        textTransform: 'uppercase', marginBottom: 10, fontWeight: 500,
      }}>{meta.full}</div>
      <EditableText
        value={value}
        onChange={onChange}
        placeholder={meta.placeholder}
        multiline
        style={{
          fontSize: 13, lineHeight: 1.45, minHeight: 36,
          color: '#2a2520', wordBreak: 'break-word',
        }}
      />
    </Card>
  )
}

/* ─── Task card (editable + checkbox + delete) ────────────────────────────── */
function TaskCard({ id, x, y, task, accent, onToggle, onChangeTitle, onDelete, startCardDrag }) {
  return (
    <Card id={id} x={x} y={y} width={220} accent={accent} startCardDrag={startCardDrag}>
      <button
        className="fx-card-action"
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete?.() }}
        onPointerDown={(e) => e.stopPropagation()}
        title="excluir"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 22, height: 22, borderRadius: '50%',
          border: 'none', background: 'transparent',
          color: 'rgba(196,168,130,0.7)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, lineHeight: 1,
        }}
      >×</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{ paddingTop: 1 }}>
          <Checkbox checked={!!task.completed} onClick={onToggle} color={accent} />
        </div>
        <EditableText
          value={task.title || ''}
          onChange={onChangeTitle}
          placeholder="sem nome"
          multiline
          style={{
            fontFamily: T.fontHead, fontSize: 16, lineHeight: 1.2,
            flex: 1, minWidth: 0, wordBreak: 'break-word',
            color: task.completed ? 'rgba(60,45,20,0.45)' : T.igapo,
            textDecoration: task.completed ? 'line-through' : 'none',
          }}
        />
      </div>
    </Card>
  )
}

/* ─── Title block (editable) ──────────────────────────────────────────────── */
function TitleBlock({ id, x, y, title, subtitle, onChangeTitle, onChangeSubtitle, startCardDrag }) {
  return (
    <div
      data-card-id={id}
      onPointerDown={startCardDrag ? startCardDrag(id, { x, y }) : undefined}
      style={{
        position: 'absolute', left: x, top: y,
        transform: 'translate(-50%, -50%)',
        width: 420, textAlign: 'center',
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
        zIndex: 3,
      }}
    >
      <EditableText
        value={title}
        onChange={onChangeTitle}
        placeholder="dê um nome"
        style={{
          fontFamily: T.fontHead, fontSize: 44, lineHeight: 1.05,
          color: T.igapo, letterSpacing: '-0.005em', marginBottom: 6,
          textAlign: 'center',
        }}
      />
      <EditableText
        value={subtitle}
        onChange={onChangeSubtitle}
        placeholder="subtítulo — o propósito desta jornada"
        style={{
          fontFamily: T.fontBody, fontSize: 13,
          color: 'rgba(60,45,20,0.65)',
          fontStyle: 'italic', textAlign: 'center',
        }}
      />
    </div>
  )
}

/* ─── Plus button (puxar fio) ─────────────────────────────────────────────── */
function PlusFioButton({ x, y, onClick }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-50%, -50%)', zIndex: 1,
    }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.() }}
        onPointerDown={(e) => e.stopPropagation()}
        title="puxar um novo fio"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `1px dashed ${T.tabatinga}`,
          background: 'rgba(253, 250, 243, 0.7)',
          color: T.tabatinga,
          fontSize: 14, lineHeight: 1, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fontBody,
        }}
      >+</button>
    </div>
  )
}

/* ─── Harvest journal ─────────────────────────────────────────────────────── */
function HarvestJournal({ id, x, y, value, visible, onChange, startCardDrag }) {
  return (
    <div
      data-card-id={id}
      onPointerDown={startCardDrag ? startCardDrag(id, { x, y }) : undefined}
      style={{
        position: 'absolute', left: x, top: y,
        transform: 'translate(-50%, -50%)',
        width: 480,
        opacity: visible ? 1 : 0.35,
        transition: 'opacity .6s cubic-bezier(.2,.7,.3,1)',
        zIndex: 4,
        cursor: 'grab', touchAction: 'none', userSelect: 'none',
      }}
    >
      <div style={{
        position: 'relative',
        background: 'linear-gradient(to right, #FDFAF3 0%, #FDFAF3 49%, #F0E8D5 50%, #FDFAF3 51%, #FDFAF3 100%)',
        borderRadius: 6,
        boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 30px 60px rgba(60,45,20,0.18), 0 4px 12px rgba(60,45,20,0.08)',
        padding: '36px 40px 44px',
        minHeight: 200,
        fontFamily: T.fontBody,
      }}>
        <div style={{
          position: 'absolute', top: 16, left: 18,
          fontFamily: T.fontHead, fontStyle: 'italic',
          fontSize: 12, color: T.tabatinga, letterSpacing: '0.06em',
        }}>colheita</div>
        <div style={{
          fontFamily: T.fontHead, fontSize: 28, color: T.igapo,
          textAlign: 'center', marginTop: 16, marginBottom: 4, lineHeight: 1.1,
        }}>O que floresceu</div>
        <div style={{
          fontFamily: T.fontBody, fontStyle: 'italic',
          fontSize: 12, color: T.tabatinga,
          textAlign: 'center', marginBottom: 24,
        }}>uma carta para si — o ciclo se fecha</div>
        <EditableText
          value={value}
          onChange={onChange}
          placeholder="o que você aprendeu, o que te surpreendeu, o que carrega daqui…"
          multiline
          style={{
            fontFamily: T.fontHead, fontSize: 16, lineHeight: 1.7,
            color: '#2a2520', minHeight: 110,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left',
          }}
        />
      </div>
    </div>
  )
}

/* ─── Layout positions ────────────────────────────────────────────────────── */
function spreadRow(n, y) {
  if (n === 0) return []
  const span = Math.min(900, 230 * (n - 1) + 200)
  const step = n === 1 ? 0 : span / (n - 1)
  const startX = -span / 2
  return Array.from({ length: n }, (_, i) => ({ x: startX + step * i, y }))
}

/* ─── Branch layout (ramificação) ─────────────────────────────────────────── */
function branchLayout(plant, water, harv) {
  const p = {}
  p['solo']    = { x: 0, y: 0 }
  p['title']   = { x: 0, y: 180 }
  const smartXs = [-440, -220, 0, 220, 440]
  ;['S','M','A','R','T'].forEach((k, i) => { p[`smart-${k}`] = { x: smartXs[i], y: 440 } })
  p['plantar'] = { x: 0, y: 740 }
  spreadRow(plant.length, 1000).forEach((pp, i) => { p[`plantar-task-${plant[i].id}`] = pp })
  p['regar']   = { x: 0, y: 1280 }
  spreadRow(water.length, 1540).forEach((pp, i) => { p[`regar-task-${water[i].id}`] = pp })
  p['colher']  = { x: 0, y: 1820 }
  spreadRow(harv.length, 2080).forEach((pp, i) => { p[`colher-task-${harv[i].id}`] = pp })
  p['harvest'] = { x: 0, y: 2400 }
  return p
}

const BRANCH_FOCUS = {
  all:      { y:   -50, scale: 0.5 },
  solo:     { y:    30, scale: 0.7 },
  plantar:  { y:  -482, scale: 0.75 },
  regar:    { y:  -887, scale: 0.75 },
  colher:   { y: -1292, scale: 0.75 },
  colheita: { y: -1510, scale: 0.7 },
}

/* ─── Trunk layout (tronco) — plant grows up, title at base ───────────────── */
function trunkLayout(plant, water, harv) {
  const p = {}
  p['title']   = { x: 0, y: 1980 }
  p['solo']    = { x: 0, y: 1680 }
  p['plantar'] = { x: 0, y: 1200 }
  p['regar']   = { x: 0, y: 720 }
  p['colher']  = { x: 0, y: 280 }
  p['harvest'] = { x: 0, y: -100 }
  // SMART surrounding solo
  ;[['S',-340,1750],['M',340,1750],['A',-380,1530],['R',380,1530],['T',0,1390]].forEach(([k, x, y]) => {
    p[`smart-${k}`] = { x, y }
  })
  // Tasks alternating sides
  function stemSpread(prefix, items, baseY) {
    items.forEach((it, i) => {
      const side = (i % 2 === 0) ? -1 : 1
      const tier = Math.floor(i / 2)
      p[`${prefix}-${it.id}`] = {
        x: side * (260 + tier * 60),
        y: baseY - 80 + tier * 110 + (side > 0 ? 55 : 0),
      }
    })
  }
  stemSpread('plantar-task', plant, 1200)
  stemSpread('regar-task',   water, 720)
  stemSpread('colher-task',  harv,  280)
  return p
}

const TRUNK_FOCUS = {
  all:      { y:  -350, scale: 0.42 },
  solo:     { y: -1071, scale: 0.7 },
  plantar:  { y:  -900, scale: 0.75 },
  regar:    { y:  -540, scale: 0.75 },
  colher:   { y:  -210, scale: 0.75 },
  colheita: { y:    75, scale: 0.75 },
}

/* ─── Phase marker (tronco mode, no boxes) ────────────────────────────────── */
function PhaseMark({ id, x, y, label, accent, pct, startCardDrag }) {
  return (
    <div
      data-card-id={id}
      onPointerDown={startCardDrag ? startCardDrag(id, { x, y }) : undefined}
      style={{
        position: 'absolute', left: x, top: y,
        transform: 'translate(-50%, -50%)',
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
        zIndex: 3,
        background: T.neblina,
        padding: '6px 16px',
        borderRadius: 999,
        boxShadow: '0 0 0 1px rgba(196,168,130,0.25), 0 2px 10px rgba(60,45,20,0.05)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: T.fontHead, fontStyle: 'italic',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
      <span style={{ fontSize: 15, color: T.igapo }}>{label}</span>
      <span style={{
        fontFamily: T.fontBody, fontStyle: 'normal',
        fontSize: 10, color: T.tabatinga,
        letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums',
      }}>{pct}%</span>
    </div>
  )
}

/* ─── Trunk SVG (organic vertical curve, fills with progress) ─────────────── */
function TrunkPath({ topY, bottomY, fillProgress = 0 }) {
  const w = 4.5
  const path = `M 0 ${bottomY}
    C -40 ${bottomY - 200},  60 ${bottomY - 500},  0 ${(topY + bottomY) / 2}
    S -40 ${topY + 200},  0 ${topY}`
  return (
    <>
      <path d={path} fill="none" stroke="#D9C5A8" strokeWidth={w} strokeLinecap="round" opacity={0.45} />
      <path d={path} fill="none" stroke="url(#fx-trunk-grad)"
        strokeWidth={w * 1.05} strokeLinecap="round"
        strokeDasharray="2000 2000"
        strokeDashoffset={2000 - 2000 * (fillProgress / 100)}
        style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' }}
      />
      <defs>
        <linearGradient id="fx-trunk-grad" x1="0" y1={bottomY} x2="0" y2={topY} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={T.phaseSolo} />
          <stop offset="33%"  stopColor={T.phasePlantar} />
          <stop offset="66%"  stopColor={T.phaseRegar} />
          <stop offset="100%" stopColor={T.phaseColher} />
        </linearGradient>
      </defs>
    </>
  )
}

/* ─── Project picker ──────────────────────────────────────────────────────── */
function ProjectPicker({ projects, selected, onSelect, onNewProject, onDeleteCurrent }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      padding: '12px 28px 14px',
      borderBottom: '1px solid rgba(196,168,130,0.25)',
      alignItems: 'center',
    }}>
      {projects.map(p => {
        const stage = STAGES.find(s => s.key === p.stage) || STAGES[0]
        const active = p.id === selected
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 10px', borderRadius: 999,
              border: `1px solid ${active ? stage.deep : 'rgba(196,168,130,0.4)'}`,
              background: active ? stage.soft : 'transparent',
              color: active ? stage.deep : '#8B7E6F',
              fontFamily: "'Courier Prime', monospace", fontSize: 10.5,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              cursor: 'pointer', whiteSpace: 'nowrap',
              maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.dot, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.title || 'sem nome'}
            </span>
          </button>
        )
      })}
      {onNewProject && (
        <button
          onClick={onNewProject}
          style={{
            padding: '6px 14px', borderRadius: 999,
            border: '1px dashed rgba(196,168,130,0.6)',
            background: 'transparent', color: T.tabatinga,
            fontFamily: T.fontHead, fontStyle: 'italic', fontSize: 12,
            cursor: 'pointer',
          }}
        >+ novo projeto</button>
      )}
      {onDeleteCurrent && projects.length > 0 && (
        <button
          onClick={onDeleteCurrent}
          title="excluir projeto atual"
          aria-label="excluir projeto atual"
          style={{
            marginLeft: 4,
            width: 28, height: 28, borderRadius: 999,
            border: '1px solid rgba(196,168,130,0.4)',
            background: 'transparent',
            color: '#A89888',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color .2s, border-color .2s, background .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#B85040'; e.currentTarget.style.borderColor = 'rgba(184,80,64,0.45)'; e.currentTarget.style.background = 'rgba(184,80,64,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#A89888'; e.currentTarget.style.borderColor = 'rgba(196,168,130,0.4)'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 7h14" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ─── Pill toggle group (used for mode + phase filter) ────────────────────── */
function PillGroup({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: 3,
      background: 'rgba(253, 250, 243, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: 999,
      boxShadow: '0 2px 12px rgba(60,45,20,0.06)',
      fontFamily: T.fontHead,
    }}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              border: 'none',
              background: active ? T.igapo : 'transparent',
              color: active ? T.neblina : T.igapo,
              padding: '6px 14px',
              borderRadius: 999,
              fontFamily: T.fontHead,
              fontStyle: 'italic',
              fontSize: 14, lineHeight: 1,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all .2s',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Canvas chrome (% + zoom controls) ───────────────────────────────────── */
function CanvasChrome({ overall, scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 50,
        display: 'inline-flex', alignItems: 'baseline', gap: 12,
        padding: '6px 14px',
        background: 'rgba(253, 250, 243, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 999,
        boxShadow: '0 2px 12px rgba(60,45,20,0.06)',
        fontFamily: T.fontBody,
      }}>
        <span style={{ fontSize: 10, color: T.tabatinga, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ciclo</span>
        <span style={{ fontFamily: T.fontHead, fontStyle: 'italic', fontSize: 15, color: T.igapo, fontVariantNumeric: 'tabular-nums' }}>
          {overall}%
        </span>
      </div>
      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 4, padding: 3,
        background: 'rgba(253, 250, 243, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 999,
        boxShadow: '0 2px 12px rgba(60,45,20,0.06)',
      }}>
        <ChromeBtn onClick={onZoomOut}>−</ChromeBtn>
        <div style={{ padding: '0 6px', fontSize: 10.5, color: T.tabatinga, fontVariantNumeric: 'tabular-nums', fontFamily: T.fontBody }}>
          {Math.round(scale * 100)}%
        </div>
        <ChromeBtn onClick={onZoomIn}>+</ChromeBtn>
        <div style={{ width: 1, height: 14, background: 'rgba(196,168,130,0.3)', margin: '0 2px' }} />
        <ChromeBtn onClick={onReset} wide>centro</ChromeBtn>
      </div>
    </>
  )
}

function ChromeBtn({ children, onClick, wide }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 26, minWidth: 26, padding: wide ? '0 12px' : 0,
        border: 'none', background: 'transparent', color: T.igapo,
        fontFamily: T.fontBody, fontSize: wide ? 11 : 15, lineHeight: 1,
        borderRadius: 999, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196,168,130,0.18)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >{children}</button>
  )
}

/* ─── The Tree (canvas) ───────────────────────────────────────────────────── */
function CanvasTree({ project, tasks, updateTask, updateProject, addTask, deleteTask, mode, phaseFilter }) {
  // Phase tasks
  const plantTasks   = tasks.filter(t => t.phase === 'plant')
  const waterTasks   = tasks.filter(t => t.phase === 'water')
  const harvestTasks = tasks.filter(t => t.phase === 'harvest')

  // Progress
  const plantProg   = computeProgress(plantTasks,   project)
  const waterProg   = computeProgress(waterTasks,   project)
  const harvestProg = computeProgress(harvestTasks, project)
  const allTasks    = computeProgress(tasks, project)
  const overall     = allTasks.total > 0
    ? allTasks.pct
    : (project.title ? 10 : 0)
  const harvestReady = (
    plantTasks.length   > 0 && plantProg.pct   === 100 &&
    waterTasks.length   > 0 && waterProg.pct   === 100 &&
    harvestTasks.length > 0 && harvestProg.pct === 100
  )

  // SMART comes from project.smart JSONB
  const smart = project.smart || {}

  // Layout positions per mode
  const layout = useMemo(() => {
    return mode === 'tronco'
      ? trunkLayout(plantTasks, waterTasks, harvestTasks)
      : branchLayout(plantTasks, waterTasks, harvestTasks)
  }, [mode, plantTasks.length, waterTasks.length, harvestTasks.length])

  // Initial camera depends on mode
  const initialCamera = useMemo(
    () => mode === 'tronco' ? { x: 0, y: -350, scale: 0.42 } : { x: 0, y: -50, scale: 0.5 },
    [mode]
  )

  // Canvas state: pan/zoom + per-card positions (overrides layout)
  const canvas = useCanvas(initialCamera)

  // Reset positions when mode changes — different layouts shouldn't share positions
  useEffect(() => {
    canvas.setPositions({})
    canvas.resetCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Auto-pan camera when phase filter changes
  useEffect(() => {
    const FOCUS = mode === 'tronco' ? TRUNK_FOCUS : BRANCH_FOCUS
    const f = FOCUS[phaseFilter] || FOCUS.all
    canvas.setCamera({ x: 0, y: f.y, scale: f.scale })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseFilter, mode])

  // Visibility filter
  function phaseOf(id) {
    if (id === 'title') return 'title'
    if (id === 'solo' || id.startsWith('smart-')) return 'solo'
    if (id === 'plantar' || id.startsWith('plantar-task-')) return 'plantar'
    if (id === 'regar' || id.startsWith('regar-task-')) return 'regar'
    if (id === 'colher' || id.startsWith('colher-task-')) return 'colher'
    if (id === 'harvest') return 'colheita'
    return 'other'
  }
  function inFocus(id) {
    if (phaseFilter === 'all') return true
    const ph = phaseOf(id)
    if (ph === 'title') return true
    return ph === phaseFilter
  }

  // Sync layout positions to canvas (new ids only; preserve dragged positions; clean up orphans)
  useEffect(() => {
    canvas.setPositions((curr) => {
      const next = { ...curr }
      Object.keys(layout).forEach((id) => {
        if (!next[id]) next[id] = layout[id]
      })
      Object.keys(next).forEach((id) => {
        if (!layout[id]) delete next[id]
      })
      return next
    })
  }, [layout])

  const pos = canvas.positions

  // ── Updaters (debounced) ───────────────────────────────────────────
  const debUpdateProj = useDebouncedFn((changes) => updateProject?.(project.id, changes), 500)
  const debUpdateTask = useDebouncedFn((id, changes) => updateTask?.(id, changes), 500)

  function handleTitleChange(v)    { debUpdateProj({ title: v }) }
  function handleSubtitleChange(v) { debUpdateProj({ subtitle: v }) }
  function handleSmartChange(letter, v) {
    const nextSmart = { ...(smart || {}), [letter]: v }
    debUpdateProj({ smart: nextSmart })
  }
  function handleHarvestChange(v) { debUpdateProj({ harvest_notes: v }) }
  function handleTaskTitleChange(id, v) { debUpdateTask(id, { title: v }) }
  function handleToggleTask(task) {
    const [changes] = computeCheckUpdate(task, project)
    updateTask?.(task.id, changes)
  }
  function handleAddTask(phase) {
    addTask?.(project.id, phase, { title: '' })
  }
  function handleDeleteTask(id) {
    deleteTask?.(id)
  }

  // ── Fios ──────────────────────────────────────────────────────────────
  const rawFios = []
  if (mode === 'tronco') {
    // In trunk mode, only short branches from each phase to its tasks (+ SMART around solo)
    ;['S','M','A','R','T'].forEach((k, i) => {
      rawFios.push({ fromId: 'solo', toId: `smart-${k}`, seed: 10 + i, opacity: 0.85 })
    })
    plantTasks.forEach((tk, i)   => { rawFios.push({ fromId: 'plantar', toId: `plantar-task-${tk.id}`, seed: 30 + i }) })
    waterTasks.forEach((tk, i)   => { rawFios.push({ fromId: 'regar',   toId: `regar-task-${tk.id}`,   seed: 50 + i }) })
    harvestTasks.forEach((tk, i) => { rawFios.push({ fromId: 'colher',  toId: `colher-task-${tk.id}`,  seed: 70 + i }) })
  } else {
    rawFios.push({ fromId: 'solo', toId: 'title', seed: 1 })
    ;['S','M','A','R','T'].forEach((k, i) => { rawFios.push({ fromId: 'title', toId: `smart-${k}`, seed: 10 + i, opacity: 0.85 }) })
    ;['S','M','A','R','T'].forEach((k, i) => { rawFios.push({ fromId: `smart-${k}`, toId: 'plantar', seed: 20 + i, opacity: 0.5 }) })
    plantTasks.forEach((tk, i)   => { rawFios.push({ fromId: 'plantar', toId: `plantar-task-${tk.id}`, seed: 30 + i }) })
    plantTasks.forEach((tk, i)   => { rawFios.push({ fromId: `plantar-task-${tk.id}`, toId: 'regar', seed: 40 + i, opacity: 0.7 }) })
    waterTasks.forEach((tk, i)   => { rawFios.push({ fromId: 'regar', toId: `regar-task-${tk.id}`, seed: 50 + i }) })
    waterTasks.forEach((tk, i)   => { rawFios.push({ fromId: `regar-task-${tk.id}`, toId: 'colher', seed: 60 + i, opacity: 0.7 }) })
    harvestTasks.forEach((tk, i) => { rawFios.push({ fromId: 'colher', toId: `colher-task-${tk.id}`, seed: 70 + i }) })
    if (harvestReady) {
      harvestTasks.forEach((tk, i) => { rawFios.push({ fromId: `colher-task-${tk.id}`, toId: 'harvest', seed: 80 + i }) })
    }
  }
  const fios = rawFios
    .filter(f => inFocus(f.fromId) && inFocus(f.toId))
    .map(f => ({ ...f, from: pos[f.fromId], to: pos[f.toId] }))
    .filter(f => f.from && f.to)

  // ── SVG bounds ────────────────────────────────────────────────────────
  const allPositions = Object.values(pos)
  let minX = -700, maxX = 700, minY = -100, maxY = 2700
  if (allPositions.length) {
    minX = Math.min(...allPositions.map(p => p.x)) - 300
    maxX = Math.max(...allPositions.map(p => p.x)) + 300
    minY = Math.min(...allPositions.map(p => p.y)) - 200
    maxY = Math.max(...allPositions.map(p => p.y)) + 300
  }
  const svgW = maxX - minX
  const svgH = maxY - minY

  const innerTransform = `translate(${canvas.camera.x}px, ${canvas.camera.y}px) scale(${canvas.camera.scale})`

  return (
    <div
      ref={canvas.rootRef}
      {...canvas.handlers}
      className="fx-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 240px)',
        minHeight: 520,
        overflow: 'hidden',
        background: T.neblina,
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(232,220,196,0.4) 0%, transparent 60%),
                          radial-gradient(circle at 70% 80%, rgba(196,168,130,0.10) 0%, transparent 50%)`,
        cursor: 'grab',
        userSelect: 'none',
        fontFamily: T.fontBody,
      }}
    >
      <CanvasChrome
        overall={overall}
        scale={canvas.camera.scale}
        onZoomIn={() => canvas.zoomBy(1.2)}
        onZoomOut={() => canvas.zoomBy(1 / 1.2)}
        onReset={canvas.resetCamera}
      />

      <div style={{
        position: 'absolute',
        left: '50%', top: 80,
        transform: innerTransform, transformOrigin: '0 0',
        willChange: 'transform',
      }}>
        <svg
          width={svgW} height={svgH}
          viewBox={`${minX} ${minY} ${svgW} ${svgH}`}
          style={{
            position: 'absolute',
            left: minX, top: minY,
            width: svgW, height: svgH,
            pointerEvents: 'none', zIndex: 0, overflow: 'visible',
          }}
        >
          {/* Trunk SVG (only in tronco mode) */}
          {mode === 'tronco' && (
            <TrunkPath
              bottomY={pos.title?.y ?? 1980}
              topY={pos.harvest?.y ?? -100}
              fillProgress={overall}
            />
          )}
          {fios.map((f, i) => (
            <path
              key={i}
              d={fioPath(f.from.x, f.from.y, f.to.x, f.to.y, f.seed)}
              fill="none" stroke={T.fioColor} strokeWidth={1.4}
              strokeLinecap="round" opacity={f.opacity ?? 1}
              style={{ transition: 'opacity .2s' }}
            />
          ))}
        </svg>

        {/* Title — always visible */}
        <TitleBlock
          id="title"
          x={pos.title?.x ?? 0} y={pos.title?.y ?? 0}
          title={project.title || ''}
          subtitle={project.subtitle || ''}
          onChangeTitle={handleTitleChange}
          onChangeSubtitle={handleSubtitleChange}
          startCardDrag={canvas.startCardDrag}
        />

        {/* Solo phase */}
        {inFocus('solo') && (mode === 'tronco' ? (
          <PhaseMark id="solo"
            x={pos.solo?.x ?? 0} y={pos.solo?.y ?? 0}
            label="preparando o solo" accent={T.phaseSolo} pct={overall}
            startCardDrag={canvas.startCardDrag}
          />
        ) : (
          <PhaseCard
            id="solo"
            x={pos.solo?.x ?? 0} y={pos.solo?.y ?? 0}
            glyphKind="solo" label="Preparando o Solo"
            progress={overall} accent={T.phaseSolo}
            startCardDrag={canvas.startCardDrag}
          />
        ))}

        {/* SMART cards */}
        {inFocus('solo') && ['S','M','A','R','T'].map(k => (
          <SmartCard
            key={k} id={`smart-${k}`}
            x={pos[`smart-${k}`]?.x ?? 0} y={pos[`smart-${k}`]?.y ?? 0}
            letter={k}
            value={smart[k] || ''}
            onChange={(v) => handleSmartChange(k, v)}
            startCardDrag={canvas.startCardDrag}
          />
        ))}

        {/* Plantar */}
        {inFocus('plantar') && (mode === 'tronco' ? (
          <PhaseMark id="plantar"
            x={pos.plantar?.x ?? 0} y={pos.plantar?.y ?? 0}
            label="plantar" accent={T.phasePlantar} pct={plantProg.pct}
            startCardDrag={canvas.startCardDrag}
          />
        ) : (
          <PhaseCard
            id="plantar"
            x={pos.plantar?.x ?? 0} y={pos.plantar?.y ?? 0}
            glyphKind="plantar" label="Plantar"
            progress={plantProg.pct} accent={T.phasePlantar}
            startCardDrag={canvas.startCardDrag}
            onAddTask={() => handleAddTask('plant')}
            showAdd={plantTasks.length === 0}
          />
        ))}
        {inFocus('plantar') && plantTasks.map(tk => (
          <TaskCard
            key={tk.id} id={`plantar-task-${tk.id}`}
            x={pos[`plantar-task-${tk.id}`]?.x ?? 0}
            y={pos[`plantar-task-${tk.id}`]?.y ?? 0}
            task={tk} accent={T.phasePlantar}
            onToggle={() => handleToggleTask(tk)}
            onChangeTitle={(v) => handleTaskTitleChange(tk.id, v)}
            onDelete={() => handleDeleteTask(tk.id)}
            startCardDrag={canvas.startCardDrag}
          />
        ))}
        {inFocus('plantar') && plantTasks.length > 0 && mode !== 'tronco' && (
          <PlusFioButton
            x={(pos.plantar?.x ?? 0)} y={(pos.plantar?.y ?? 0) + 140}
            onClick={() => handleAddTask('plant')}
          />
        )}

        {/* Regar */}
        {inFocus('regar') && (mode === 'tronco' ? (
          <PhaseMark id="regar"
            x={pos.regar?.x ?? 0} y={pos.regar?.y ?? 0}
            label="regar e crescer" accent={T.phaseRegar} pct={waterProg.pct}
            startCardDrag={canvas.startCardDrag}
          />
        ) : (
          <PhaseCard
            id="regar"
            x={pos.regar?.x ?? 0} y={pos.regar?.y ?? 0}
            glyphKind="regar" label="Regar e Crescer"
            progress={waterProg.pct} accent={T.phaseRegar}
            startCardDrag={canvas.startCardDrag}
            onAddTask={() => handleAddTask('water')}
            showAdd={waterTasks.length === 0}
          />
        ))}
        {inFocus('regar') && waterTasks.map(tk => (
          <TaskCard
            key={tk.id} id={`regar-task-${tk.id}`}
            x={pos[`regar-task-${tk.id}`]?.x ?? 0}
            y={pos[`regar-task-${tk.id}`]?.y ?? 0}
            task={tk} accent={T.phaseRegar}
            onToggle={() => handleToggleTask(tk)}
            onChangeTitle={(v) => handleTaskTitleChange(tk.id, v)}
            onDelete={() => handleDeleteTask(tk.id)}
            startCardDrag={canvas.startCardDrag}
          />
        ))}
        {inFocus('regar') && waterTasks.length > 0 && mode !== 'tronco' && (
          <PlusFioButton
            x={(pos.regar?.x ?? 0)} y={(pos.regar?.y ?? 0) + 140}
            onClick={() => handleAddTask('water')}
          />
        )}

        {/* Colher */}
        {inFocus('colher') && (mode === 'tronco' ? (
          <PhaseMark id="colher"
            x={pos.colher?.x ?? 0} y={pos.colher?.y ?? 0}
            label="colher" accent={T.phaseColher} pct={harvestProg.pct}
            startCardDrag={canvas.startCardDrag}
          />
        ) : (
          <PhaseCard
            id="colher"
            x={pos.colher?.x ?? 0} y={pos.colher?.y ?? 0}
            glyphKind="colher" label="Colher"
            progress={harvestProg.pct} accent={T.phaseColher}
            startCardDrag={canvas.startCardDrag}
            onAddTask={() => handleAddTask('harvest')}
            showAdd={harvestTasks.length === 0}
          />
        ))}
        {inFocus('colher') && harvestTasks.map(tk => (
          <TaskCard
            key={tk.id} id={`colher-task-${tk.id}`}
            x={pos[`colher-task-${tk.id}`]?.x ?? 0}
            y={pos[`colher-task-${tk.id}`]?.y ?? 0}
            task={tk} accent={T.phaseColher}
            onToggle={() => handleToggleTask(tk)}
            onChangeTitle={(v) => handleTaskTitleChange(tk.id, v)}
            onDelete={() => handleDeleteTask(tk.id)}
            startCardDrag={canvas.startCardDrag}
          />
        ))}
        {inFocus('colher') && harvestTasks.length > 0 && !harvestReady && mode !== 'tronco' && (
          <PlusFioButton
            x={(pos.colher?.x ?? 0)} y={(pos.colher?.y ?? 0) + 140}
            onClick={() => handleAddTask('harvest')}
          />
        )}

        {/* Harvest journal */}
        {inFocus('colheita') && (
          <HarvestJournal
            id="harvest"
            x={pos.harvest?.x ?? 0} y={pos.harvest?.y ?? 0}
            value={project.harvest_notes || ''}
            onChange={handleHarvestChange}
            visible={harvestReady || project.stage === 'harvest' || phaseFilter === 'colheita'}
            startCardDrag={canvas.startCardDrag}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ onNewProject }) {
  return (
    <div style={{
      padding: '120px 24px', display: 'flex', justifyContent: 'center',
    }}>
      {onNewProject && (
        <button
          onClick={onNewProject}
          aria-label="novo projeto"
          title="novo projeto"
          style={{
            width: 42, height: 42, borderRadius: 12,
            border: 'none', background: 'rgba(26,58,31,0.85)', color: T.neblina,
            fontFamily: T.fontHead, fontStyle: 'italic',
            fontSize: 22, lineHeight: 1,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(26,58,31,0.12)',
            transition: 'transform .15s, box-shadow .2s, background .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.igapo; e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,58,31,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,58,31,0.85)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(26,58,31,0.12)' }}
        >+</button>
      )}
    </div>
  )
}

/* ─── Top controls bar (ramificação/tronco + phase filter) ────────────────── */
function FluxoControls({ mode, onModeChange, phaseFilter, onPhaseFilterChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 16, padding: '14px 20px 16px',
      flexWrap: 'wrap',
    }}>
      <PillGroup
        value={mode}
        onChange={onModeChange}
        options={[
          { value: 'ramificacao', label: 'ramificação' },
          { value: 'tronco',      label: 'tronco' },
        ]}
      />
      <PillGroup
        value={phaseFilter}
        onChange={onPhaseFilterChange}
        options={[
          { value: 'all',      label: 'todas' },
          { value: 'solo',     label: 'solo',     dot: T.phaseSolo },
          { value: 'plantar',  label: 'plantar',  dot: T.phasePlantar },
          { value: 'regar',    label: 'regar',    dot: T.phaseRegar },
          { value: 'colher',   label: 'colher',   dot: T.phaseColher },
          { value: 'colheita', label: 'colheita', dot: T.buriti },
        ]}
      />
    </div>
  )
}

/* ─── Main FluxoView ──────────────────────────────────────────────────────── */
export default function FluxoView({
  projects, tasks,
  updateTask, updateProject, addTask, deleteTask, addProject, deleteProject,
}) {
  useEffect(() => { injectFxCss() }, [])
  const [selectedId, setSelectedId] = useState(projects[0]?.id || null)
  const [mode, setMode] = useState('ramificacao')          // 'ramificacao' | 'tronco'
  const [phaseFilter, setPhaseFilter] = useState('all')    // all|solo|plantar|regar|colher|colheita
  const [newModalOpen, setNewModalOpen] = useState(false)

  useEffect(() => {
    if (!selectedId && projects.length > 0) setSelectedId(projects[0].id)
    else if (selectedId && !projects.find(p => p.id === selectedId)) setSelectedId(projects[0]?.id || null)
  }, [projects, selectedId])

  function openNewProject() {
    if (!addProject) return
    setNewModalOpen(true)
  }
  async function handleConfirmNew(title) {
    const p = await addProject({ title, stage: 'soil' })
    if (p) setSelectedId(p.id)
    setNewModalOpen(false)
  }

  function handleDeleteCurrent() {
    if (!deleteProject || !selectedId) return
    const current = projects.find(p => p.id === selectedId)
    const label = current?.title?.trim() || 'este projeto'
    const ok = window.confirm(`Excluir "${label}"? Essa ação não pode ser desfeita.`)
    if (!ok) return
    deleteProject(selectedId)
  }

  const newProjectModal = (
    <NewProjectModal
      open={newModalOpen}
      onClose={() => setNewModalOpen(false)}
      onConfirm={handleConfirmNew}
    />
  )

  if (projects.length === 0) return (
    <>
      <EmptyState onNewProject={addProject ? openNewProject : null} />
      {newProjectModal}
    </>
  )

  const project = projects.find(p => p.id === selectedId) || projects[0]
  const projectTasks = tasks.filter(t => t.project_id === project.id)

  return (
    <div style={{ width: '100%' }}>
      <ProjectPicker
        projects={projects}
        selected={project.id}
        onSelect={setSelectedId}
        onNewProject={addProject ? openNewProject : null}
        onDeleteCurrent={deleteProject ? handleDeleteCurrent : null}
      />
      <FluxoControls
        mode={mode} onModeChange={setMode}
        phaseFilter={phaseFilter} onPhaseFilterChange={setPhaseFilter}
      />
      <CanvasTree
        key={project.id + ':' + mode}
        project={project}
        tasks={projectTasks}
        updateTask={updateTask}
        updateProject={updateProject}
        addTask={addTask}
        deleteTask={deleteTask}
        mode={mode}
        phaseFilter={phaseFilter}
      />
      {newProjectModal}
    </div>
  )
}
