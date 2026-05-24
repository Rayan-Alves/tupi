import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Plus, Check, X,
  StickyNote, ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useWeekData, getMondayOf, shiftWeek } from '../../hooks/useWeekData'

/* ─── helpers ───────────────────────────────── */
const isToday = (date) => {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(date); d.setHours(0,0,0,0)
  return t.getTime() === d.getTime()
}

/* ─── Week Focus constants ───────────────────── */
const VIEWS = ['geral', 'tasks', 'projetos', 'rotinas']
const VIEW_META = {
  geral:    { label: 'Geral',    color: '#C8841A' },
  tasks:    { label: 'Tasks',    color: '#27272A' },
  projetos: { label: 'Projetos', color: '#3b82f6' },
  rotinas:  { label: 'Rotinas',  color: '#10b981' },
}

/* ─── DonutArc ───────────────────────────────── */
function DonutArc({ pct, color, size = 80 }) {
  const sw = 7
  const R  = (size / 2) - sw / 2 - 1
  const cx = size / 2
  const circ = 2 * Math.PI * R
  const dash = Math.max(0, Math.min(1, pct / 100)) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="#f0f0f0" strokeWidth={sw} />
      <circle
        cx={cx} cy={cx} r={R} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

/* ─── useWeekFocus ───────────────────────────── */
function useWeekFocus(mondayISO) {
  const [priorities, setPriorities] = useState(['', '', ''])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`wf_${mondayISO}`)
      setPriorities(raw ? JSON.parse(raw) : ['', '', ''])
    } catch { setPriorities(['', '', '']) }
  }, [mondayISO])

  function save(idx, value) {
    setPriorities(prev => {
      const next = prev.map((p, i) => i === idx ? value : p)
      try { localStorage.setItem(`wf_${mondayISO}`, JSON.stringify(next)) } catch {}
      return next
    })
  }
  return { priorities, save }
}

/* ─── PriorityCard ───────────────────────────── */
const PRIORITY_PLACEHOLDERS = [
  'Minha prioridade principal desta semana…',
  'O segundo foco mais importante…',
  'O que não posso deixar para trás…',
]

function PriorityCard({ value, index, onChange }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 px-5 pt-3 pb-4 flex flex-col gap-1.5 flex-1" style={{ minHeight: 72 }}>
      <span className="text-[9px] tracking-[0.22em] uppercase text-zinc-400 font-bold select-none">
        Prioridade {index + 1}
      </span>
      <textarea
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => onChange(index, local)}
        placeholder={PRIORITY_PLACEHOLDERS[index]}
        rows={2}
        className="w-full bg-transparent border-0 outline-none resize-none text-[13px] text-zinc-800 leading-relaxed placeholder-zinc-300"
        style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}
      />
    </div>
  )
}

/* ─── WeekFocusSection ───────────────────────── */
function WeekFocusSection({ monday, stats, byDay }) {
  const mondayISO = format(monday, 'yyyy-MM-dd')
  const { priorities, save } = useWeekFocus(mondayISO)
  const [viewIdx,      setViewIdx]      = useState(0)
  const [showFraction, setShowFraction] = useState(false)

  const view = VIEWS[viewIdx]
  const meta = VIEW_META[view]

  const viewData = useMemo(() => {
    switch (view) {
      case 'tasks':    return { done: stats.doneTasks,     total: stats.totalTasks }
      case 'projetos': return { done: stats.doneProjTasks, total: stats.totalProjTasks }
      case 'rotinas':  return { done: stats.doneRoutines,  total: stats.totalRoutines }
      default:         return { done: stats.done,          total: stats.total }
    }
  }, [view, stats])

  const pct = viewData.total > 0 ? Math.round((viewData.done / viewData.total) * 100) : 0

  const chartBars = useMemo(() => byDay.map(day => {
    let done = 0, total = 0
    switch (view) {
      case 'tasks':
        done = day.completedTasksCount;         total = day.tasks.length;     break
      case 'projetos':
        done = day.completedProjTasksCount;     total = day.projTasks.length; break
      case 'rotinas':
        done = day.completedRoutines.size;      total = day.routines.length;  break
      default:
        done  = day.completedRoutines.size + day.completedTasksCount + day.completedProjTasksCount
        total = day.routines.length + day.tasks.length + day.projTasks.length
    }
    return { done, total, pct: total > 0 ? (done / total) * 100 : -1 }
  }), [view, byDay])

  return (
    <div className="flex gap-4 mb-6 items-stretch min-h-[220px]">
      {/* Left: 3 priority cards */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 font-medium mb-2 select-none">
          Prioridades da Semana
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          {[0, 1, 2].map(i => (
            <PriorityCard key={i} index={i} value={priorities[i] || ''} onChange={save} />
          ))}
        </div>
      </div>

      {/* Right: stats square */}
      <div
        className="bg-white rounded-3xl border border-zinc-100 p-6 flex flex-col"
        style={{ width: 290, minWidth: 250, flexShrink: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-[0.22em] uppercase font-bold transition-colors" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setViewIdx(i => (i - 1 + VIEWS.length) % VIEWS.length)}
              className="p-1 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-700">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setViewIdx(i => (i + 1) % VIEWS.length)}
              className="p-1 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-700">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-5 flex-1">
          <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
            <DonutArc pct={pct} color={meta.color} size={80} />
            <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
              <span className="font-bold tabular-nums text-[11px] transition-colors" style={{ color: meta.color }}>{pct}%</span>
            </div>
          </div>

          <button onClick={() => setShowFraction(f => !f)} className="text-left flex flex-col gap-1 group" title="Clique para alternar % / x de x">
            <span className="font-display leading-none tabular-nums transition-all" style={{ color: meta.color, fontSize: showFraction && viewData.total >= 10 ? 26 : 40 }}>
              {showFraction ? `${viewData.done}/${viewData.total}` : `${pct}%`}
            </span>
            <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 transition-colors">
              {viewData.done} de {viewData.total} {viewData.done !== 1 ? 'concluídos' : 'concluído'}
            </span>
          </button>
        </div>

        <div className="flex items-end gap-1.5 h-10 mb-4">
          {chartBars.map((bar, i) => {
            const barH  = bar.pct < 0 ? 3 : Math.max(4, (bar.pct / 100) * 40)
            const barBg = bar.pct < 0 ? '#f0f0f0' : bar.pct >= 100 ? '#10b981' : meta.color
            return (
              <div key={i} className="flex-1 flex items-end h-10">
                <div className="w-full rounded-sm transition-all duration-500"
                  style={{ height: barH, background: barBg, opacity: bar.pct < 0 ? 0.35 : 1 }}
                  title={bar.total > 0 ? `${bar.done}/${bar.total}` : 'sem dados'}
                />
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {VIEWS.map((v, i) => (
            <button key={v} onClick={() => setViewIdx(i)} title={VIEW_META[v].label}
              style={{
                width: viewIdx === i ? 16 : 5, height: 5, borderRadius: 3,
                background: viewIdx === i ? VIEW_META[v].color : '#e4e4e7',
                transition: 'all 0.25s ease', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Recurrence generator ───────────────────── */
const RECURRENCE_OPTS = [
  { key: 'once',     label: 'Uma vez' },
  { key: 'weekly',   label: 'Toda semana' },
  { key: 'daily',    label: 'Todo dia' },
  { key: 'monthly',  label: 'Mensal' },
  { key: 'biannual', label: 'A cada 6 meses' },
  { key: 'annual',   label: 'Anual' },
]

function generateDates(baseDateISO, recurrence, rangeStart, rangeEnd) {
  const dates = []
  const base  = new Date(baseDateISO + 'T12:00:00')

  switch (recurrence) {
    case 'weekly':
      for (let i = 0; i < 26; i++) {
        dates.push(base.toISOString().split('T')[0])
        base.setDate(base.getDate() + 7)
      }
      return dates
    case 'daily': {
      const start = new Date((rangeStart || baseDateISO) + 'T12:00:00')
      const end   = new Date((rangeEnd   || baseDateISO) + 'T12:00:00')
      const d = new Date(start)
      while (d <= end && dates.length < 180) {
        dates.push(d.toISOString().split('T')[0])
        d.setDate(d.getDate() + 1)
      }
      return dates
    }
    case 'monthly':
      for (let i = 0; i < 12; i++) {
        dates.push(base.toISOString().split('T')[0])
        base.setMonth(base.getMonth() + 1)
      }
      return dates
    case 'biannual':
      for (let i = 0; i < 6; i++) {
        dates.push(base.toISOString().split('T')[0])
        base.setMonth(base.getMonth() + 6)
      }
      return dates
    case 'annual':
      for (let i = 0; i < 5; i++) {
        dates.push(base.toISOString().split('T')[0])
        base.setFullYear(base.getFullYear() + 1)
      }
      return dates
    default:
      return [baseDateISO]
  }
}

/* ─── AddTaskForm ────────────────────────────── */
function AddTaskForm({ dateISO, onSave, onCancel }) {
  const [title,    setTitle]    = useState('')
  const [recur,    setRecur]    = useState('once')
  const [dayStart, setDayStart] = useState(dateISO)
  const [dayEnd,   setDayEnd]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const dates = useMemo(
    () => generateDates(dateISO, recur, dayStart, dayEnd || dayStart),
    [dateISO, recur, dayStart, dayEnd]
  )

  async function save() {
    if (!title.trim() || saving) return
    const snap = [...dates]
    const titleSnap = title.trim()
    onCancel()               // close form immediately (optimistic)
    await onSave(snap, titleSnap)
  }

  return (
    <div
      className="mt-2 p-3 bg-zinc-50 rounded-xl space-y-2.5 border border-zinc-100"
      onClick={e => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Nome da tarefa…"
        className="w-full bg-transparent border-0 border-b border-zinc-200 outline-none text-[12px] text-zinc-900 placeholder-zinc-400 pb-1.5"
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel() }}
      />

      {/* Recurrence chips */}
      <div className="flex flex-wrap gap-1">
        {RECURRENCE_OPTS.map(opt => (
          <button
            type="button"
            key={opt.key}
            onClick={() => setRecur(opt.key)}
            className="text-[10px] px-2 py-0.5 rounded-full transition-all"
            style={{
              background: recur === opt.key ? '#27272A' : 'transparent',
              color:      recur === opt.key ? '#fff'    : '#a1a1aa',
              border:     `1px solid ${recur === opt.key ? '#27272A' : '#e4e4e7'}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date range for daily */}
      {recur === 'daily' && (
        <div className="flex gap-2">
          <input type="date" value={dayStart} onChange={e => setDayStart(e.target.value)}
            className="flex-1 text-[11px] bg-white border border-zinc-200 rounded-lg px-2 py-1 outline-none" />
          <input type="date" value={dayEnd} onChange={e => setDayEnd(e.target.value)} min={dayStart}
            className="flex-1 text-[11px] bg-white border border-zinc-200 rounded-lg px-2 py-1 outline-none" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={save}
          disabled={!title.trim()}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white transition-all"
          style={{ background: title.trim() ? '#27272A' : '#d4d4d8' }}
        >
          Salvar
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-zinc-400 hover:text-zinc-700 px-2 py-1.5 transition-colors">
          Cancelar
        </button>
        {recur !== 'once' && (
          <span className="text-[10px] text-zinc-400 italic ml-auto">
            {dates.length} ocorrências
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── WeekNotepad ────────────────────────────── */
function WeekNotepad({ mondayISO }) {
  const KEY = `weeknote_${mondayISO}`
  const [content, setContent] = useState('')

  useEffect(() => {
    try { setContent(localStorage.getItem(KEY) || '') } catch {}
  }, [mondayISO])

  function handleChange(val) {
    setContent(val)
    try { localStorage.setItem(KEY, val) } catch {}
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-1.5 mb-3">
        <StickyNote size={11} className="text-zinc-400" />
        <span className="text-[9px] tracking-[0.22em] uppercase text-zinc-400 font-bold">Bloco de notas</span>
      </div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Anotações da semana…"
        className="flex-1 bg-transparent border-0 outline-none resize-none text-[12px] text-zinc-800 leading-relaxed placeholder-zinc-300"
        style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}
      />
    </div>
  )
}

/* ─── WeekDayCell ────────────────────────────── */
function WeekDayCell({ day, locale, addTasksBulk, onUpdateTask, onDeleteTask, onDayClick }) {
  const [adding, setAdding] = useState(false)

  const total  = day.tasks.length
  const done   = day.completedTasksCount
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0
  const today  = isToday(day.date)

  async function handleSave(dates, title) {
    // form already closed (optimistic); save in background
    await addTasksBulk(dates, title)
  }

  return (
    <div
      className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col"
      style={today ? { boxShadow: '0 0 0 1.5px #C8841A', minHeight: 300 } : { minHeight: 300 }}
    >
      {/* Header — click to open Day tab */}
      <button
        onClick={() => onDayClick(day.iso)}
        className="flex items-center justify-between mb-2 group w-full text-left"
        title={`Abrir ${format(day.date, 'EEEE d MMM', { locale })}`}
      >
        <div>
          <h3 className="font-display text-[16px] font-medium text-zinc-900 leading-none capitalize tracking-tight group-hover:text-amber-700 transition-colors">
            {format(day.date, 'EEEE', { locale })}
          </h3>
          <div className="text-[10px] text-zinc-400 mt-0.5">{format(day.date, 'd MMM', { locale })}</div>
        </div>
        <div className="flex items-center gap-1">
          {today && <span className="text-[8px] tracking-[0.18em] uppercase text-amber-700 font-bold">Hoje</span>}
          <ExternalLink size={10} className="text-zinc-300 group-hover:text-amber-600 transition-colors" />
        </div>
      </button>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-[2px] bg-zinc-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#C8841A' }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 flex flex-col gap-0.5">
        {day.tasks.map(task => (
          <div key={task.id} className="flex items-start gap-2 py-1 group/task">
            <button
              onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
              className="flex-shrink-0 flex items-center justify-center rounded-full transition-all mt-0.5"
              style={{
                width: 14, height: 14,
                border: `1.5px solid ${task.completed ? '#10b981' : '#dadada'}`,
                background: task.completed ? '#10b981' : 'transparent',
              }}
            >
              {task.completed && <Check size={8} strokeWidth={3} color="#fff" />}
            </button>
            <span className={`flex-1 text-[11px] leading-snug ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
              {task.title || '—'}
            </span>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover/task:opacity-100 text-zinc-300 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Add form */}
        {adding ? (
          <AddTaskForm dateISO={day.iso} onSave={handleSave} onCancel={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setAdding(true) }}
            className="flex items-center gap-1 mt-2 text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <Plus size={11} strokeWidth={2} /> Adicionar tarefa
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Main WeekTab ───────────────────────────── */
export default function WeekTab({ onDayClick }) {
  const { t, i18n } = useTranslation()
  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const {
    byDay, stats, loading,
    addTasksBulk, updateTask, deleteTask,
  } = useWeekData(monday)

  const localeMap = { pt: ptBR, en: enUS, es }
  const locale = localeMap[i18n.language] || ptBR
  const mondayISO = format(monday, 'yyyy-MM-dd')

  const label = byDay[0] && byDay[6]
    ? `${format(byDay[0].date, 'd MMM', { locale })} – ${format(byDay[6].date, 'd MMM', { locale })}`
    : ''

  if (loading) {
    return <div className="text-center py-16 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  // byDay: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const row1days = byDay.slice(0, 3) // Mon Tue Wed
  const row2days = byDay.slice(3)    // Thu Fri Sat Sun

  const cellProps = (day) => ({
    day,
    locale,
    addTasksBulk,
    onUpdateTask: updateTask,
    onDeleteTask: deleteTask,
    onDayClick: onDayClick || (() => {}),
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Period navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-h1 tracking-tight capitalize">{label}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonday(m => shiftWeek(m, -1))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonday(getMondayOf(new Date()))}
            className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-full hover:bg-zinc-100"
          >
            {t('dashboard.today')}
          </button>
          <button
            onClick={() => setMonday(m => shiftWeek(m, 1))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Priorities + Stats */}
      <WeekFocusSection monday={monday} stats={stats} byDay={byDay} />

      {/* 2 × 4 week grid */}

      {/* Row 1: Notepad | Mon | Tue | Wed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <WeekNotepad mondayISO={mondayISO} />
        {row1days.map(day => (
          <WeekDayCell key={day.iso} {...cellProps(day)} />
        ))}
      </div>

      {/* Row 2: Thu | Fri | Sat | Sun */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {row2days.map(day => (
          <WeekDayCell key={day.iso} {...cellProps(day)} />
        ))}
      </div>
    </div>
  )
}
