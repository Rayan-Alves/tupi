import { useState, useRef, useEffect } from 'react'
import AutoTextarea from '../../components/ui/AutoTextarea'
import CollapsibleSection from '../../components/ui/CollapsibleSection'
import { Plus, Check, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useDayDashboard, todayISO, navigateDay, formatDayLabel } from '../../hooks/useDayDashboard'
import ReadingWidget from '../../components/library/ReadingWidget'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SOURCE_COLOR = {
  spirit:    '#5a8ab8',
  mind:      '#d4890a',
  body:      '#6aaa30',
  dashboard: '#c4c4c4',
}
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const pct = (d, t) => (t > 0 ? Math.round((d / t) * 100) : 0)

/* ── Primitives ───────────────────────────── */

function CheckCircle({ done, onToggle, size = 18 }) {
  const [flash, setFlash] = useState(false)
  function handle() {
    setFlash(true); setTimeout(() => setFlash(false), 400); onToggle()
  }
  const filled = done || flash
  return (
    <button
      onClick={handle}
      className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
      style={{
        width: size, height: size,
        border: `1.5px solid ${filled ? '#10b981' : '#dadada'}`,
        background: filled ? '#10b981' : 'transparent',
      }}
    >
      {filled && <Check size={size * 0.55} strokeWidth={2.5} color="#fff" />}
    </button>
  )
}

function Counter({ done, total, asPct, onToggle }) {
  if (total === 0) return null
  return (
    <button
      onClick={onToggle}
      className="text-[11px] tabular-nums font-medium text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-full px-2.5 py-1 transition-colors"
    >
      {asPct ? `${pct(done, total)}%` : `${done} / ${total}`}
    </button>
  )
}

function Section({ title, counter, extra, done, total, barColor, children }) {
  const p = total > 0 ? Math.round(done / total * 100) : 0
  return (
    <section className="bg-white rounded-3xl border border-zinc-100 px-7 py-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[22px] font-medium text-zinc-900 tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {extra}
          {counter}
        </div>
      </div>
      {total > 0 && (
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p}%`, background: p === 100 ? '#10b981' : (barColor || '#3f3f46') }}
          />
        </div>
      )}
      {children}
    </section>
  )
}

function AddBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 mt-4 text-[12px] text-zinc-400 hover:text-zinc-900 transition-colors"
    >
      <Plus size={13} strokeWidth={2} />{label}
    </button>
  )
}

/* ── CollapsibleTaskSection ───────────────── */
const COLLAPSED_H = 240 // px — approx 4 tasks visible

function CollapsibleTaskSection({ title, counter, done, total, barColor, children }) {
  const [expanded, setExpanded]   = useState(false)
  const [overflows, setOverflows] = useState(false)
  const sectionRef  = useRef(null)
  const contentRef  = useRef(null)
  const p = total > 0 ? Math.round(done / total * 100) : 0

  // Detect real content height vs COLLAPSED_H
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > COLLAPSED_H)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  // Collapse when clicking outside
  useEffect(() => {
    if (!expanded) return
    function onOutside(e) {
      if (sectionRef.current && !sectionRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [expanded])

  const showGradient = overflows && !expanded

  return (
    <section
      ref={sectionRef}
      className="bg-white rounded-3xl border border-zinc-100 px-7 py-6"
      style={{ position: 'relative' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[22px] font-medium text-zinc-900 tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">{counter}</div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p}%`, background: p === 100 ? '#10b981' : (barColor || '#3f3f46') }}
          />
        </div>
      )}

      {/* Content with clamp */}
      <div
        style={{
          maxHeight: expanded ? 'none' : COLLAPSED_H,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div ref={contentRef}>
          {children}
        </div>

        {/* Gradient + expand button — only when truly overflowing */}
        {showGradient && (
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 72,
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.98))',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 8,
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={() => setExpanded(true)}
              style={{ pointerEvents: 'all' }}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-400 rounded-full px-3 py-1 shadow-sm transition-all"
            >
              <Plus size={11} strokeWidth={2.5} /> ver mais
            </button>
          </div>
        )}
      </div>

      {/* Collapse button when expanded */}
      {expanded && overflows && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          ↑ ver menos
        </button>
      )}
    </section>
  )
}

/* ── Add Routine Form ─────────────────────── */

const AREA_OPTIONS = [
  { key: 'dashboard', labelKey: 'dashboard.day.areaGeneral', color: SOURCE_COLOR.dashboard },
  { key: 'spirit',    labelKey: 'dashboard.day.areaSpirit',  color: SOURCE_COLOR.spirit    },
  { key: 'mind',      labelKey: 'dashboard.day.areaMind',    color: SOURCE_COLOR.mind      },
  { key: 'body',      labelKey: 'dashboard.day.areaBody',    color: SOURCE_COLOR.body      },
]

const AREA_TABLE = { spirit: 'spirit_routines', mind: 'mind_routines', body: 'body_routines' }

function AddRoutineForm({ onSave, onCancel, t, userId }) {
  const [title,  setTitle]  = useState('')
  const [days,   setDays]   = useState([])
  const [area,   setArea]   = useState('dashboard')

  function toggleDay(k) { setDays(d => d.includes(k) ? d.filter(x => x !== k) : [...d, k]) }

  async function save() {
    if (!title.trim()) return
    if (area === 'dashboard') {
      onSave({ title, days, start_date: null, end_date: null })
    } else {
      const table = AREA_TABLE[area]
      await supabase.from(table).insert({ user_id: userId, title: title.trim(), days, start_time: null, end_time: null })
    }
    onCancel()
  }

  return (
    <div className="mt-4 p-4 bg-zinc-50 rounded-2xl space-y-3">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('dashboard.day.routinePlaceholder')}
        className="w-full bg-transparent border-0 border-b border-zinc-200 outline-none text-sm text-zinc-900 placeholder-zinc-400 pb-2"
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel() }}
      />
      {/* Area picker */}
      <div className="flex gap-1.5 flex-wrap">
        {AREA_OPTIONS.map(opt => {
          const active = area === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => setArea(opt.key)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: active ? opt.color : 'transparent',
                color: active ? '#fff' : '#a1a1aa',
                border: `1px solid ${active ? opt.color : '#e4e4e7'}`,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t(opt.labelKey)}
            </button>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        {DAY_KEYS.map(k => {
          const active = days.includes(k)
          return (
            <button
              key={k}
              onClick={() => toggleDay(k)}
              className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                active ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {t(`spirit.tasks.days.${k}`).charAt(0).toUpperCase()}
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button onClick={onCancel} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
          {t('common.cancel')}
        </button>
        <button
          onClick={save}
          disabled={!title.trim()}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
            title.trim()
              ? 'bg-zinc-900 text-white hover:bg-zinc-700 cursor-pointer'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {t('dashboard.day.saveRoutine')}
        </button>
      </div>
    </div>
  )
}

/* ── Rows ─────────────────────────────────── */

function RoutineRow({ routine, done, onToggle, onDelete }) {
  const dotColor = SOURCE_COLOR[routine.source] || SOURCE_COLOR.dashboard
  return (
    <div className="group flex items-center gap-3 py-2.5">
      <CheckCircle done={done} onToggle={() => onToggle(routine.id, routine.source)} />
      <span className={`flex-1 text-[14px] transition-colors ${done ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
        {routine.title || '—'}
      </span>
      <span
        style={{ background: dotColor }}
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        title={routine.source}
      />
      {routine.source === 'dashboard' && (
        <button
          onClick={() => onDelete(routine.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

function TaskRow({ task, subtasks, onToggle, onTitleChange, onDelete, onAddSub, autoFocus, onDoneEditing, onEnter, t }) {
  const [title, setTitle] = useState(task.title || '')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)
  const dirty = useRef(false)

  useEffect(() => { setTitle(task.title || '') }, [task.id])

  // Focus when this task is freshly created
  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  function flush() {
    if (dirty.current) { onTitleChange(task.id, title); dirty.current = false }
    if (onDoneEditing) onDoneEditing()
  }

  return (
    <div className="group">
      <div className="flex items-start gap-2 py-2.5 min-w-0">
        <CheckCircle done={task.completed} onToggle={() => onToggle(task.id, { completed: !task.completed })} />
        {subtasks.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-zinc-400 hover:text-zinc-700 transition-colors -ml-1"
          >
            <ChevronRight
              size={13}
              style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
            />
          </button>
        )}
        <AutoTextarea
          ref={inputRef}
          value={title}
          onChange={e => { setTitle(e.target.value); dirty.current = true }}
          onBlur={flush}
          data-task-input="true"
          onEnter={() => {
            flush()
            if (onEnter) onEnter()
          }}
          placeholder={t('dashboard.day.taskPlaceholder')}
          className={`flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] ${
            task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'
          }`}
        />
        <button
          onClick={() => onAddSub(task.id)}
          title={t('dashboard.day.addSubtask')}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-zinc-300 hover:text-zinc-700 transition-all"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-zinc-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {(expanded || subtasks.length > 0) && subtasks.map(sub => (
        <SubRow key={sub.id} sub={sub} onToggle={onToggle} onChange={onTitleChange} onDelete={onDelete} t={t} />
      ))}
    </div>
  )
}

function SubRow({ sub, onToggle, onChange, onDelete, t }) {
  const [v, setV] = useState(sub.title || '')
  const dirty = useRef(false)
  useEffect(() => { setV(sub.title || '') }, [sub.id])
  function flush() { if (dirty.current) { onChange(sub.id, v); dirty.current = false } }
  return (
    <div className="group flex items-start gap-2 py-1.5 pl-8 min-w-0">
      <CheckCircle done={sub.completed} onToggle={() => onToggle(sub.id, { completed: !sub.completed })} size={14} />
      <AutoTextarea
        value={v}
        onChange={e => { setV(e.target.value); dirty.current = true }}
        onBlur={flush}
        onEnter={flush}
        placeholder={t('dashboard.day.subtaskPlaceholder')}
        className={`flex-1 min-w-0 bg-transparent border-0 outline-none text-[12px] ${
          sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'
        }`}
      />
      <button
        onClick={() => onDelete(sub.id)}
        className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

const PHASE_LABEL = { soil: 'Semente', plant: 'Plantando', water: 'Crescendo', harvest: 'Colheita' }
const PHASE_COLOR = { soil: '#C8841A', plant: '#3B6D11', water: '#3B6DC4', harvest: '#D4890A' }

function ProjectRow({ task, onToggle }) {
  const phaseLabel = PHASE_LABEL[task.phase] || task.phase
  const phaseColor = PHASE_COLOR[task.phase] || '#a1a1aa'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <CheckCircle done={task.completed} onToggle={() => onToggle(task.id)} />
      <span className={`flex-1 min-w-0 text-[14px] break-words ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
        {task.title || '—'}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.projects?.title && (
          <span className="text-[10px] text-zinc-400 italic">{task.projects.title}</span>
        )}
        {task.phase && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color: phaseColor, background: `${phaseColor}18` }}
          >
            {phaseLabel}
          </span>
        )}
      </div>
    </div>
  )
}


function NoteArea({ content, onSave, placeholder }) {
  const [text, setText] = useState(content || '')
  const timer = useRef(null)
  useEffect(() => { setText(content || '') }, [content])
  function handleChange(v) {
    setText(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(v), 800)
  }
  return (
    <textarea
      value={text}
      onChange={e => handleChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      className="w-full bg-transparent border-0 outline-none resize-none text-[15px] text-zinc-800 placeholder-zinc-300 leading-relaxed mt-2"
      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
    />
  )
}

/* ── Main ─────────────────────────────────── */

export default function DayTab({ initialDate, onBack }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(() => initialDate || todayISO())
  const isToday = selectedDate === todayISO()

  const {
    loading,
    routinesToday, completions, toggleRoutine, addDashRoutine, deleteDashRoutine,
    dayTasks, addDayTask, updateDayTask, deleteDayTask,
    projTasks, toggleProjTask,
    note, saveNote,
  } = useDayDashboard(selectedDate)

  const [showRPct, setShowRPct]   = useState(false)
  const [showTPct, setShowTPct]   = useState(false)
  const [showPPct, setShowPPct]   = useState(false)
  const [addingR,  setAddingR]    = useState(false)
  const [projView, setProjView]   = useState('strike')
  const [newTaskId, setNewTaskId] = useState(null)

  async function handleAddTask() {
    const task = await addDayTask(null)
    if (task) setNewTaskId(task.id)
  }

  if (loading) {
    return <div className="text-center py-16 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  const rootTasks    = dayTasks.filter(task => !task.parent_id)
  const getSubs      = id => dayTasks.filter(task => task.parent_id === id)
  const rDone        = routinesToday.filter(r => completions.has(r.id)).length
  const tDone        = dayTasks.filter(task => !task.parent_id && task.completed).length
  const pDone        = projTasks.filter(task => task.completed).length
  const projVisible  = projView === 'hide'
    ? projTasks.filter(t => !t.completed)
    : projTasks

  const localeMap = { pt: ptBR, en: enUS, es }
  const dateLocale = localeMap[i18n.language] || ptBR
  const dateObj = new Date(selectedDate + 'T12:00:00')
  const dateStr = i18n.language === 'en'
    ? format(dateObj, 'EEEE, MMMM d', { locale: dateLocale })
    : format(dateObj, "EEEE, d 'de' MMMM", { locale: dateLocale })

  const dayInfo = formatDayLabel(selectedDate, i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Date header with navigation */}
      <div className="mb-6 px-1">
        <div className="flex items-center gap-2 mb-1.5">
          {/* Back to week button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-400 transition-all mr-2"
            >
              <ChevronLeft size={12} /> {t('dashboard.backToWeek')}
            </button>
          )}

          <button
            onClick={() => setSelectedDate(d => navigateDay(d, -1))}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 font-medium min-w-[60px] text-center">
            {dayInfo.relative ? t(`dashboard.${dayInfo.key}`, dayInfo.key) : ''}
          </div>

          <button
            onClick={() => setSelectedDate(d => navigateDay(d, +1))}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayISO())}
              className="ml-2 text-[11px] font-semibold px-3 py-1 rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 transition-all"
            >
              {t('dashboard.today', 'Hoje')}
            </button>
          )}
        </div>
        <h1 className="type-h1 capitalize tracking-tight">
          {dateStr}
        </h1>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* Routines */}
      <Section
        title={t('dashboard.day.routine')}
        done={rDone} total={routinesToday.length} barColor="#1B3A5C"
        counter={
          <Counter done={rDone} total={routinesToday.length} asPct={showRPct} onToggle={() => setShowRPct(v => !v)} />
        }
      >
        {routinesToday.length === 0 && !addingR && (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.routineEmpty')}</p>
        )}
        <CollapsibleSection collapsedHeight={220}>
          {routinesToday.map(r => (
            <RoutineRow key={r.id} routine={r} done={completions.has(r.id)} onToggle={toggleRoutine} onDelete={deleteDashRoutine} />
          ))}
        </CollapsibleSection>
        {addingR
          ? <AddRoutineForm onSave={addDashRoutine} onCancel={() => setAddingR(false)} t={t} userId={user?.id} />
          : <AddBtn label={t('dashboard.day.addRoutine')} onClick={() => setAddingR(true)} />
        }
      </Section>

      {/* Tasks */}
      <CollapsibleTaskSection
        title={t('dashboard.day.todoList')}
        done={tDone} total={rootTasks.length} barColor="#3f3f46"
        counter={
          <Counter done={tDone} total={rootTasks.length} asPct={showTPct} onToggle={() => setShowTPct(v => !v)} />
        }
      >
        {rootTasks.length === 0 && (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.tasksEmpty')}</p>
        )}
        {rootTasks.map((task, idx) => (
          <TaskRow
            key={task.id} task={task} subtasks={getSubs(task.id)}
            onToggle={(id, changes) => updateDayTask(id, changes)}
            onTitleChange={(id, title) => updateDayTask(id, { title })}
            onDelete={deleteDayTask}
            onAddSub={addDayTask}
            autoFocus={task.id === newTaskId}
            onDoneEditing={() => setNewTaskId(null)}
            onEnter={async () => {
              const inputs = Array.from(document.querySelectorAll('[data-task-input]'))
              const current = inputs.findIndex(el => el === document.activeElement)
              if (current !== -1 && inputs[current + 1]) {
                inputs[current + 1].focus()
              } else {
                const t = await addDayTask(null)
                if (t) setNewTaskId(t.id)
              }
            }}
            t={t}
          />
        ))}
        <AddBtn label={t('dashboard.day.addTask')} onClick={handleAddTask} />
      </CollapsibleTaskSection>

      {/* Reading widget — paired with Routines */}
      <ReadingWidget />

      {/* Notes — paired with Tasks */}
      <Section title={t('dashboard.day.notes')}>
        <NoteArea content={note.content} onSave={saveNote} placeholder={t('dashboard.day.notesPlaceholder')} />
      </Section>

      {/* Projects — full width */}
      <div className="lg:col-span-2">
      <Section
        title={t('dashboard.day.projectsToday')}
        done={pDone} total={projTasks.length} barColor="#C8841A"
        extra={
          projTasks.length > 0 && (
            <button
              onClick={() => setProjView(v => v === 'hide' ? 'strike' : 'hide')}
              className="text-[10px] text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-full px-2 py-1 transition-colors"
            >
              {projView === 'hide' ? '✓ Sumir' : '✓ Riscar'}
            </button>
          )
        }
        counter={
          <Counter done={pDone} total={projTasks.length} asPct={showPPct} onToggle={() => setShowPPct(v => !v)} />
        }
      >
        {projTasks.length === 0 ? (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.projectsEmpty') || 'Nenhuma tarefa pendente nos projetos.'}</p>
        ) : (
          Object.entries(
            projVisible.reduce((acc, task) => {
              const key = task.project_id || 'sem'
              if (!acc[key]) acc[key] = { title: task.projects?.title || 'Projeto', stage: task.projects?.stage, tasks: [] }
              acc[key].tasks.push(task)
              return acc
            }, {})
          ).map(([pid, group]) => (
            <div key={pid} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400">{group.title}</span>
                {group.stage && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-semibold">{group.stage}</span>
                )}
              </div>
              {group.tasks.map(task => (
                <ProjectRow key={task.id} task={task} onToggle={toggleProjTask} />
              ))}
            </div>
          ))
        )}
      </Section>

      </div>
    </div>
    </div>
  )
}
