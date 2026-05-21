import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { playCheck, playCelebration, playProgress } from '../lib/sounds'
import '../components/arvore/arvore.css'

/* ══════════════════════════════════════════════════════
   ÁRVORE DA VIDA — Living Org-Chart Canvas
   Design tokens from design prototype (Versão A refinada)
   ══════════════════════════════════════════════════════ */

// ─── Phase config ──────────────────────────────────────
const PHASE_CONFIG = {
  soil:    { label: 'Preparando o Solo', accent: '#5A6E4C', soft: '#E6E5D6', glyph: 'solo'    },
  plant:   { label: 'Plantar',           accent: '#2E5D2E', soft: '#DDE5D2', glyph: 'plantar' },
  water:   { label: 'Regar e Crescer',   accent: '#4A7A78', soft: '#D8E1DD', glyph: 'regar'   },
  harvest: { label: 'Colher',            accent: '#C8841A', soft: '#EDE0C5', glyph: 'colher'  },
}

const SMART_META = {
  S: { full: 'Específico',  placeholder: 'qual é o foco essencial?'     },
  M: { full: 'Mensurável',  placeholder: 'como saberei que cheguei?'    },
  A: { full: 'Atingível',   placeholder: 'como vou fazer?'              },
  R: { full: 'Relevante',   placeholder: 'por que isso importa agora?'  },
  T: { full: 'Temporal',    placeholder: 'até quando?'                  },
}

// ─── Seeded organic fio path ────────────────────────────
function seededRng(seed) {
  let x = (seed | 0) || 1
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5
    return (x >>> 0) / 0xffffffff
  }
}

function organicPath(x1, y1, x2, y2, seed = 1, curvature = 0.52) {
  const rnd = seededRng(seed)
  const dx = x2 - x1, dy = y2 - y1
  const isVert = Math.abs(dy) >= Math.abs(dx)
  let cx1, cy1, cx2, cy2
  if (isVert) {
    const off = dx * 0.18 + (rnd() - 0.5) * 13
    cx1 = x1 + off;        cy1 = y1 + dy * curvature
    cx2 = x2 - off * 0.6;  cy2 = y2 - dy * curvature
  } else {
    const off = dy * 0.18 + (rnd() - 0.5) * 13
    cx1 = x1 + dx * curvature; cy1 = y1 + off
    cx2 = x2 - dx * curvature; cy2 = y2 - off * 0.6
  }
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

// ─── Line-art phase glyphs ──────────────────────────────
function GlyphSolo({ size = 18, stroke = 1.2, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 C 7 7, 11 11, 15 9 S 21 8, 21 9" />
      <path d="M3 14 C 7 12, 11 16, 15 14 S 21 13, 21 14" />
      <path d="M3 19 C 7 17, 11 21, 15 19 S 21 18, 21 19" />
    </svg>
  )
}
function GlyphPlantar({ size = 18, stroke = 1.2, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21 L 12 12" />
      <path d="M12 14 C 8 14, 6 11, 6 8 C 9 8, 12 10, 12 14 Z" />
      <path d="M12 12 C 16 12, 18 9, 18 6 C 15 6, 12 8, 12 12 Z" />
    </svg>
  )
}
function GlyphRegar({ size = 18, stroke = 1.2, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C 12 3, 6 11, 6 15 A 6 6 0 0 0 18 15 C 18 11, 12 3, 12 3 Z" />
    </svg>
  )
}
function GlyphColher({ size = 18, stroke = 1.2, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 L 12 6" />
      <path d="M12 10 C 9 10, 7 8, 7 6 C 9 6, 11 7, 12 10 Z" />
      <path d="M12 10 C 15 10, 17 8, 17 6 C 15 6, 13 7, 12 10 Z" />
      <path d="M12 14 C 9 14, 7 12, 7 10 C 9 10, 11 11, 12 14 Z" />
      <path d="M12 14 C 15 14, 17 12, 17 10 C 15 10, 13 11, 12 14 Z" />
    </svg>
  )
}

const PHASE_GLYPHS = { solo: GlyphSolo, plantar: GlyphPlantar, regar: GlyphRegar, colher: GlyphColher }

// ─── Inline icon set ─────────────────────────────────────
function ArrowLeft() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 7l5 5"/></svg>
}
function PlusIcon({ size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
}
function CheckMark() {
  return <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5L6 11L11.5 3.5"/></svg>
}

// ─── Phase card ───────────────────────────────────────────
function PhaseCard({ phase, pct, done, total, style, onClick, active }) {
  const cfg = PHASE_CONFIG[phase]
  const Glyph = PHASE_GLYPHS[cfg.glyph]
  return (
    <div
      className={`arvore-phase-card${active ? ' arvore-phase-card--active' : ''}`}
      style={{ '--phase-accent': cfg.accent, '--phase-soft': cfg.soft, ...style }}
      onClick={onClick}
    >
      <div className="arvore-phase-card__glyph">
        <Glyph size={18} stroke={1.3} color={cfg.accent} />
      </div>
      <div className="arvore-phase-card__label">{cfg.label}</div>
      <div className="arvore-phase-card__meta">
        <span>{done}/{total === 0 ? '—' : total}</span>
        <span className="arvore-phase-card__dot">·</span>
        <span>{pct}%</span>
      </div>
      <div className="arvore-phase-card__bar">
        <div className="arvore-phase-card__bar-fill" style={{ width: `${pct}%`, background: cfg.accent }} />
      </div>
    </div>
  )
}

// ─── SMART card ───────────────────────────────────────────
function SmartCard({ letter, value, onChange, style }) {
  const meta = SMART_META[letter]
  return (
    <div className="arvore-smart" style={style}>
      <div className="arvore-smart__card">
        <div className="arvore-smart__letter">{letter}</div>
        <div className="arvore-smart__word">{meta.full}</div>
        {letter === 'T' ? (
          <input
            type="date"
            className="arvore-smart__input"
            style={{ minHeight: 'auto' }}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <textarea
            className="arvore-smart__input"
            rows={2}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={meta.placeholder}
          />
        )}
      </div>
    </div>
  )
}

// ─── Task card ────────────────────────────────────────────
function TaskCard({ task, phase, onUpdate, onDelete, onAddSubTask, style }) {
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.plant
  const [title, setTitle]       = useState(task.title || '')
  const [blooming, setBlooming] = useState(false)

  useEffect(() => { setTitle(task.title || '') }, [task.title])

  function handleCheck() {
    const done = !task.completed
    onUpdate(task.id, { completed: done })
    if (done) {
      setBlooming(true)
      playCheck()
      setTimeout(() => setBlooming(false), 520)
    }
  }

  function handleTitleBlur() {
    const t = title.trim()
    if (t !== (task.title || '')) onUpdate(task.id, { title: t })
  }

  const subTasks = task.sub_tasks || []
  const totalItems = 1 + subTasks.length
  const doneItems  = (task.completed ? 1 : 0) + subTasks.filter(s => s.done).length
  const pct        = Math.round((doneItems / Math.max(totalItems, 1)) * 100)

  return (
    <div className="arvore-task" style={style}>
      <div className="arvore-task__card" style={{ '--task-accent': cfg.accent }}>
        {/* Card title (optional) */}
        <input
          className="arvore-task__title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="título (opcional)"
        />

        {/* Main task item */}
        <div className="arvore-task__item">
          <span
            className={`arvore-task__check ${task.completed ? 'arvore-task__check--done' : ''} ${blooming ? 'arvore-task__check--bloom' : ''}`}
            style={task.completed ? { background: cfg.accent, borderColor: cfg.accent } : {}}
            onClick={handleCheck}
          >
            {task.completed && <CheckMark />}
          </span>
          <span className={`arvore-task__text ${task.completed ? 'arvore-task__text--done' : ''}`}>
            {task.title || <em style={{ color: 'rgba(196,168,130,0.6)', fontStyle: 'italic' }}>tarefa sem nome</em>}
          </span>
        </div>

        {/* Sub-tasks */}
        {subTasks.map((s, i) => (
          <div key={i} className="arvore-task__item">
            <span
              className={`arvore-task__check ${s.done ? 'arvore-task__check--done' : ''}`}
              style={s.done ? { background: cfg.accent, borderColor: cfg.accent } : {}}
              onClick={() => {
                const next = [...subTasks]
                next[i] = { ...s, done: !s.done }
                onUpdate(task.id, { sub_tasks: next })
              }}
            >
              {s.done && <CheckMark />}
            </span>
            <input
              className={`arvore-task__subtext ${s.done ? 'arvore-task__text--done' : ''}`}
              value={s.label}
              onChange={e => {
                const next = [...subTasks]
                next[i] = { ...s, label: e.target.value }
                onUpdate(task.id, { sub_tasks: next })
              }}
              placeholder="sub-tarefa"
            />
          </div>
        ))}

        {/* Add sub-task */}
        <button
          className="arvore-task__add-item"
          onClick={e => { e.stopPropagation(); onAddSubTask && onAddSubTask() }}
          onPointerDown={e => e.stopPropagation()}
        >
          <PlusIcon size={11} /> tarefa
        </button>

        {/* Meta */}
        <div className="arvore-task__meta">
          <span className="arvore-task__count">{doneItems}/{totalItems}</span>
          <span style={{ opacity: 0.4, fontSize: 10 }}>·</span>
          <span className="arvore-task__pct">{pct}%</span>
          {task.due_date && (
            <span className="arvore-task__date">
              {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Harvest journal (two-page spread) ────────────────────
function HarvestJournal({ value, onChange, style }) {
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <div className="arvore-journal" style={style}>
      <div className="arvore-journal__spread">
        {/* Corner labels */}
        <div className="arvore-journal__corner arvore-journal__corner--left">colheita</div>
        <div className="arvore-journal__corner arvore-journal__corner--right">{today}</div>
        {/* Center crease shadow */}
        <div className="arvore-journal__crease" />
        {/* Content */}
        <div className="arvore-journal__heading">O que floresceu</div>
        <div className="arvore-journal__sub">uma carta para si — o ciclo se fecha</div>
        <textarea
          className="arvore-journal__textarea"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="o que você aprendeu, o que te surpreendeu, o que carrega daqui…"
        />
      </div>
    </div>
  )
}

// ─── Canvas chrome: progress + zoom ───────────────────────
function CanvasChrome({ overall, onZoomIn, onZoomOut, onFit, scale }) {
  return (
    <>
      {/* Overall progress pill — top left */}
      <div className="arvore-chrome-pill arvore-chrome-pill--left">
        <span className="arvore-chrome-pill__label">ciclo</span>
        <span className="arvore-chrome-pill__val">{overall}%</span>
      </div>
      {/* Zoom pill — top right */}
      <div className="arvore-chrome-pill arvore-chrome-pill--right">
        <button className="arvore-chrome-btn" onClick={onZoomOut} title="afastar">−</button>
        <span className="arvore-chrome-pill__scale">{Math.round(scale * 100)}%</span>
        <button className="arvore-chrome-btn" onClick={onZoomIn} title="aproximar">+</button>
        <div className="arvore-chrome-divider" />
        <button className="arvore-chrome-btn arvore-chrome-btn--wide" onClick={onFit} title="centralizar">centro</button>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN CANVAS
   ══════════════════════════════════════════════════════ */

export default function ArvoreVida() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, tasks, updateProject, addTask, updateTask, deleteTask, loading } = useProjects()

  const project       = projects.find(p => p.id === projectId)
  const projectTasks  = useMemo(() => tasks.filter(t => t.project_id === projectId), [tasks, projectId])

  // Canvas pan + zoom
  const [pan, setPan]   = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.75)
  const dragging   = useRef(false)
  const dragStart  = useRef({ x: 0, y: 0 })
  const panStart   = useRef({ x: 0, y: 0 })
  const canvasRef  = useRef(null)

  // Local form state
  const [subtitle,    setSubtitle]    = useState('')
  const [smartValues, setSmartValues] = useState({})
  const [harvestNotes, setHarvestNotes] = useState('')

  useEffect(() => {
    if (project) {
      setSubtitle(project.why || '')
      setSmartValues({
        S: project.title   || '',
        M: project.success || '',
        A: project.how     || '',
        R: project.why     || '',
        T: project.end_date || '',
      })
      setHarvestNotes(project.harvest_notes || '')
    }
  }, [project?.id])

  // ── Viewport + layout ──────────────────────────────────
  const CW = typeof window !== 'undefined' ? window.innerWidth  : 1200
  const CH = typeof window !== 'undefined' ? window.innerHeight : 800
  const cx = CW / 2   // canvas center X

  const layout = useMemo(() => {
    const soloY      = 60
    const titleY     = soloY + 130
    const smartY     = titleY + 110
    const plantarY   = smartY  + 220
    const plantTaskY = plantarY + 130
    const regarY     = plantTaskY + 230
    const regarTaskY = regarY   + 130
    const colherY    = regarTaskY + 230
    const colherTaskY = colherY  + 130
    const journalY   = colherTaskY + 240
    return { soloY, titleY, smartY, plantarY, plantTaskY, regarY, regarTaskY, colherY, colherTaskY, journalY }
  }, [])

  // ── Task helpers ────────────────────────────────────────
  const phaseTasks    = useCallback((p) => projectTasks.filter(t => t.phase === p), [projectTasks])
  const phaseProgress = useCallback((p) => {
    const ts = phaseTasks(p)
    if (!ts.length) return { done: 0, total: 0, pct: 0 }
    const done = ts.filter(t => t.completed).length
    return { done, total: ts.length, pct: Math.round((done / ts.length) * 100) }
  }, [phaseTasks])

  const overallPct = useMemo(() => {
    if (!projectTasks.length) return 0
    const done = projectTasks.filter(t => t.completed).length
    return Math.round((done / projectTasks.length) * 100)
  }, [projectTasks])

  const allDone = projectTasks.length > 0 && projectTasks.every(t => t.completed)

  // ── Pan & zoom ──────────────────────────────────────────
  function handlePointerDown(e) {
    if (e.target.closest('.arvore-task,.arvore-smart,.arvore-phase-card,.arvore-journal,.arvore-pull,.arvore-back,.arvore-chrome-pill,.arvore-zoom,input,textarea,button')) return
    dragging.current = true
    dragStart.current  = { x: e.clientX, y: e.clientY }
    panStart.current   = { ...pan }
    e.currentTarget.style.cursor = 'grabbing'
  }
  function handlePointerMove(e) {
    if (!dragging.current) return
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    })
  }
  function handlePointerUp(e) {
    dragging.current = false
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab'
  }
  function handleWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.04 : 0.04
    setZoom(z => Math.max(0.25, Math.min(2, z + delta)))
  }
  function fitView() { setZoom(0.7); setPan({ x: 0, y: 0 }) }

  // ── SMART update ────────────────────────────────────────
  function updateSmart(letter, value) {
    setSmartValues(v => ({ ...v, [letter]: value }))
    if (!project) return
    const fieldMap = { S: 'title', M: 'success', A: 'how', R: 'why', T: 'end_date' }
    updateProject(project.id, { [fieldMap[letter]]: value })
  }

  function handleSubtitleBlur() {
    if (project && subtitle !== (project.why || '')) {
      updateProject(project.id, { why: subtitle })
    }
  }

  async function handleAddTask(phase) {
    if (!project) return
    const t = await addTask(project.id, phase, { title: '' })
    if (t) playProgress()
  }

  function handleHarvestBlur() {
    if (project && harvestNotes !== (project.harvest_notes || '')) {
      updateProject(project.id, { harvest_notes: harvestNotes })
    }
  }

  function handleAddSubTask(taskId) {
    const t = projectTasks.find(t => t.id === taskId)
    if (!t) return
    const sub = [...(t.sub_tasks || []), { label: '', done: false }]
    updateTask(taskId, { sub_tasks: sub })
  }

  // ── Loading / not found ─────────────────────────────────
  if (loading) {
    return (
      <div className="arvore-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <GlyphPlantar size={32} stroke={1} color="#C4A882" />
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#C4A882', marginTop: 12 }}>
            preparando o terreno…
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="arvore-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <GlyphColher size={32} stroke={1} color="#C4A882" />
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#C4A882', marginTop: 12, marginBottom: 16 }}>
            projeto não encontrado
          </div>
          <button className="arvore-modal__cancel" onClick={() => navigate('/projects')}>voltar</button>
        </div>
      </div>
    )
  }

  // ── Position arrays ─────────────────────────────────────
  const plantTasks   = phaseTasks('plant')
  const waterTasks   = phaseTasks('water')
  const harvestTasks = phaseTasks('harvest')

  function taskPositions(list, baseY) {
    const spacing = 260
    const startX  = cx - ((list.length - 1) * spacing) / 2
    return list.map((t, i) => ({ ...t, x: startX + i * spacing, y: baseY }))
  }

  const plantPos   = taskPositions(plantTasks,   layout.plantTaskY)
  const waterPos   = taskPositions(waterTasks,   layout.regarTaskY)
  const harvestPos = taskPositions(harvestTasks, layout.colherTaskY)

  // SMART row: 5 cards spread 210px apart
  const smartSpacing = 210
  const smartStartX  = cx - ((5 - 1) * smartSpacing) / 2
  const smartPos = ['S','M','A','R','T'].map((k, i) => ({
    key: k, x: smartStartX + i * smartSpacing, y: layout.smartY,
  }))

  // ── SVG canvas height ───────────────────────────────────
  const svgH = layout.journalY + 300

  // ── Fio seed helper ─────────────────────────────────────
  let fioSeed = 0
  const nextSeed = () => ++fioSeed

  // Progress
  const pp = phaseProgress('plant')
  const wp = phaseProgress('water')
  const hp = phaseProgress('harvest')

  // Card half-widths for line attachment
  const PHASE_W = 100   // phase card half-width  (200px total)
  const SMART_W = 90    // smart card half-width  (180px)
  const TASK_W  = 110   // task card half-width   (220px)
  const TITLE_W = 0     // title block center

  return (
    <div
      className="arvore-canvas"
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: 'grab' }}
    >
      {/* Background paper texture */}
      <div className="arvore-bg" />

      {/* Back button */}
      <button className="arvore-back" onClick={() => navigate('/projects')}>
        <ArrowLeft /> projetos
      </button>

      {/* Canvas chrome */}
      <CanvasChrome
        overall={overallPct}
        scale={zoom}
        onZoomIn={() => setZoom(z => Math.min(2, z + 0.12))}
        onZoomOut={() => setZoom(z => Math.max(0.25, z - 0.12))}
        onFit={fitView}
      />

      {/* Inner canvas (pan + zoom) */}
      <div
        className="arvore-canvas__inner"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: `${cx}px 400px`,
        }}
      >
        {/* ─── SVG FIOS ─── */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: svgH, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}
          width="100%"
          height={svgH}
        >
          {/* Preparando o Solo → Title */}
          <path className="arvore-fio" d={organicPath(cx, layout.soloY + 58, cx, layout.titleY - 14, nextSeed())} />

          {/* Title → SMART branches */}
          {smartPos.map((s) => (
            <path key={`ts-${s.key}`} className="arvore-fio" d={organicPath(cx, layout.titleY + 60, s.x + SMART_W, s.y, nextSeed())} />
          ))}

          {/* SMART → Plantar (converge) */}
          {smartPos.map((s) => (
            <path key={`sp-${s.key}`} className="arvore-fio arvore-fio--converge" d={organicPath(s.x + SMART_W / 2, s.y + 120, cx, layout.plantarY - 6, nextSeed())} />
          ))}

          {/* Plantar → task cards */}
          {plantPos.map((t) => (
            <path key={`pt-${t.id}`} className="arvore-fio" d={organicPath(cx, layout.plantarY + 58, t.x + TASK_W, t.y, nextSeed())} />
          ))}

          {/* Plant tasks → Regar (converge) */}
          {plantPos.map((t) => (
            <path key={`tr-${t.id}`} className="arvore-fio arvore-fio--converge" d={organicPath(t.x + TASK_W, t.y + 125, cx, layout.regarY - 6, nextSeed())} />
          ))}
          {plantPos.length === 0 && (
            <path className="arvore-fio arvore-fio--phantom" d={organicPath(cx, layout.plantarY + 58, cx, layout.regarY - 6, nextSeed())} />
          )}

          {/* Regar → task cards */}
          {waterPos.map((t) => (
            <path key={`wt-${t.id}`} className="arvore-fio" d={organicPath(cx, layout.regarY + 58, t.x + TASK_W, t.y, nextSeed())} />
          ))}

          {/* Water tasks → Colher (converge) */}
          {waterPos.map((t) => (
            <path key={`wc-${t.id}`} className="arvore-fio arvore-fio--converge" d={organicPath(t.x + TASK_W, t.y + 125, cx, layout.colherY - 6, nextSeed())} />
          ))}
          {waterPos.length === 0 && (
            <path className="arvore-fio arvore-fio--phantom" d={organicPath(cx, layout.regarY + 58, cx, layout.colherY - 6, nextSeed())} />
          )}

          {/* Colher → harvest tasks */}
          {harvestPos.map((t) => (
            <path key={`ht-${t.id}`} className="arvore-fio" d={organicPath(cx, layout.colherY + 58, t.x + TASK_W, t.y, nextSeed())} />
          ))}

          {/* Harvest tasks → Journal (when all done) */}
          {allDone && harvestPos.map((t) => (
            <path key={`hj-${t.id}`} className="arvore-fio arvore-fio--active" d={organicPath(t.x + TASK_W, t.y + 125, cx, layout.journalY, nextSeed())} />
          ))}
        </svg>

        {/* ─── PREPARANDO O SOLO ─── */}
        <PhaseCard
          phase="soil"
          pct={overallPct}
          done={projectTasks.filter(t => t.completed).length}
          total={projectTasks.length}
          style={{ position: 'absolute', left: cx - PHASE_W, top: layout.soloY, width: 200, zIndex: 10 }}
        />

        {/* ─── TITLE BLOCK ─── */}
        <div className="arvore-title-block" style={{ position: 'absolute', left: cx - 200, top: layout.titleY, width: 400, zIndex: 10 }}>
          <div className="arvore-title">{project.title}</div>
          <input
            className="arvore-subtitle"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            onBlur={handleSubtitleBlur}
            placeholder="subtítulo — o propósito desta jornada"
          />
        </div>

        {/* ─── SMART CARDS ─── */}
        {smartPos.map((s) => (
          <SmartCard
            key={s.key}
            letter={s.key}
            value={smartValues[s.key] || ''}
            onChange={v => updateSmart(s.key, v)}
            style={{ position: 'absolute', left: s.x, top: s.y, width: 180, zIndex: 10 }}
          />
        ))}

        {/* ─── PLANTAR ─── */}
        <PhaseCard
          phase="plant"
          pct={pp.pct}
          done={pp.done}
          total={pp.total}
          style={{ position: 'absolute', left: cx - PHASE_W, top: layout.plantarY, width: 200, zIndex: 10 }}
          onClick={() => handleAddTask('plant')}
        />
        {plantPos.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            phase="plant"
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddSubTask={() => handleAddSubTask(t.id)}
            style={{ position: 'absolute', left: t.x, top: t.y, zIndex: 10 }}
          />
        ))}
        <div className="arvore-pull" style={{ position: 'absolute', left: cx - 14, top: layout.plantarY + 66, zIndex: 12 }}>
          <button className="arvore-pull__btn" onClick={() => handleAddTask('plant')} title="puxar fio">
            <PlusIcon />
          </button>
        </div>

        {/* ─── REGAR E CRESCER ─── */}
        <PhaseCard
          phase="water"
          pct={wp.pct}
          done={wp.done}
          total={wp.total}
          style={{ position: 'absolute', left: cx - PHASE_W, top: layout.regarY, width: 200, zIndex: 10 }}
          onClick={() => handleAddTask('water')}
        />
        {waterPos.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            phase="water"
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddSubTask={() => handleAddSubTask(t.id)}
            style={{ position: 'absolute', left: t.x, top: t.y, zIndex: 10 }}
          />
        ))}
        <div className="arvore-pull" style={{ position: 'absolute', left: cx - 14, top: layout.regarY + 66, zIndex: 12 }}>
          <button className="arvore-pull__btn" onClick={() => handleAddTask('water')} title="puxar fio">
            <PlusIcon />
          </button>
        </div>

        {/* ─── COLHER ─── */}
        <PhaseCard
          phase="harvest"
          pct={hp.pct}
          done={hp.done}
          total={hp.total}
          style={{ position: 'absolute', left: cx - PHASE_W, top: layout.colherY, width: 200, zIndex: 10 }}
          onClick={() => handleAddTask('harvest')}
        />
        {harvestPos.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            phase="harvest"
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddSubTask={() => handleAddSubTask(t.id)}
            style={{ position: 'absolute', left: t.x, top: t.y, zIndex: 10 }}
          />
        ))}
        {!allDone && (
          <div className="arvore-pull" style={{ position: 'absolute', left: cx - 14, top: layout.colherY + 66, zIndex: 12 }}>
            <button className="arvore-pull__btn" onClick={() => handleAddTask('harvest')} title="puxar fio">
              <PlusIcon />
            </button>
          </div>
        )}

        {/* ─── HARVEST JOURNAL ─── */}
        {allDone && (
          <HarvestJournal
            value={harvestNotes}
            onChange={setHarvestNotes}
            style={{ position: 'absolute', left: cx - 230, top: layout.journalY, zIndex: 20, width: 460 }}
          />
        )}

        {/* Empty state hint */}
        {plantTasks.length === 0 && (
          <div style={{ position: 'absolute', left: cx - 120, top: layout.plantTaskY, width: 240, textAlign: 'center', zIndex: 5 }}>
            <div className="arvore-hint__text">toque + para plantar seus primeiros fios</div>
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: 80, position: 'absolute', top: layout.journalY + 360 }} />
      </div>
    </div>
  )
}
