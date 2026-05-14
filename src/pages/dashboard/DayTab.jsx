import { useState, useRef, useEffect } from 'react'
import { Plus, Check, Trash2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useDayDashboard } from '../../hooks/useDayDashboard'

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

function Section({ title, counter, children }) {
  return (
    <section className="bg-white rounded-3xl border border-zinc-100 px-7 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[22px] font-medium text-zinc-900 tracking-tight">{title}</h2>
        {counter}
      </div>
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

/* ── Add Routine Form ─────────────────────── */

function AddRoutineForm({ onSave, onCancel, t }) {
  const [title, setTitle] = useState('')
  const [days, setDays]   = useState([])
  const [start, setStart] = useState('')
  const [end, setEnd]     = useState('')

  function toggleDay(k) { setDays(d => d.includes(k) ? d.filter(x => x !== k) : [...d, k]) }
  function save() {
    if (!title.trim()) return
    onSave({ title, days, start_date: start || null, end_date: end || null })
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
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-2 py-1 text-zinc-600 outline-none bg-white"
        />
        <span className="text-zinc-300 text-xs">→</span>
        <input
          type="date"
          value={end}
          onChange={e => setEnd(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-2 py-1 text-zinc-600 outline-none bg-white"
        />
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

function TaskRow({ task, subtasks, onToggle, onTitleChange, onDelete, onAddSub, t }) {
  const [title, setTitle] = useState(task.title || '')
  const [expanded, setExpanded] = useState(false)
  const dirty = useRef(false)
  useEffect(() => { setTitle(task.title || '') }, [task.id])
  function flush() { if (dirty.current) { onTitleChange(task.id, title); dirty.current = false } }

  return (
    <div className="group">
      <div className="flex items-center gap-2 py-2.5">
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
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); dirty.current = true }}
          onBlur={flush}
          onKeyDown={e => e.key === 'Enter' && flush()}
          placeholder={t('dashboard.day.taskPlaceholder')}
          className={`flex-1 bg-transparent border-0 outline-none text-[14px] ${
            task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'
          }`}
        />
        <button
          onClick={() => onAddSub(task.id)}
          title={t('dashboard.day.addSubtask')}
          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-700 transition-all"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
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
    <div className="group flex items-center gap-2 py-1.5 pl-8">
      <CheckCircle done={sub.completed} onToggle={() => onToggle(sub.id, { completed: !sub.completed })} size={14} />
      <input
        value={v}
        onChange={e => { setV(e.target.value); dirty.current = true }}
        onBlur={flush}
        placeholder={t('dashboard.day.subtaskPlaceholder')}
        className={`flex-1 bg-transparent border-0 outline-none text-[12px] ${
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
      <span className={`flex-1 text-[14px] ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
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

export default function DayTab() {
  const { t, i18n } = useTranslation()
  const {
    loading,
    routinesToday, completions, toggleRoutine, addDashRoutine, deleteDashRoutine,
    dayTasks, addDayTask, updateDayTask, deleteDayTask,
    projTasks, toggleProjTask,
    note, saveNote,
  } = useDayDashboard()

  const [showRPct, setShowRPct] = useState(false)
  const [showTPct, setShowTPct] = useState(false)
  const [showPPct, setShowPPct] = useState(false)
  const [addingR, setAddingR]   = useState(false)

  if (loading) {
    return <div className="text-center py-16 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  const rootTasks = dayTasks.filter(task => !task.parent_id)
  const getSubs   = id => dayTasks.filter(task => task.parent_id === id)
  const rDone     = routinesToday.filter(r => completions.has(r.id)).length
  const tDone     = dayTasks.filter(task => !task.parent_id && task.completed).length
  const pDone     = projTasks.filter(task => task.completed).length

  const localeMap = { pt: ptBR, en: enUS, es }
  const dateLocale = localeMap[i18n.language] || ptBR
  const today = new Date()
  const dateStr = i18n.language === 'en'
    ? format(today, 'EEEE, MMMM d', { locale: dateLocale })
    : format(today, "EEEE, d 'de' MMMM", { locale: dateLocale })

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Date header */}
      <div className="mb-2 px-1">
        <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-1.5 font-medium">
          {t('dashboard.today')}
        </div>
        <h1 className="font-display text-3xl font-medium text-zinc-900 capitalize tracking-tight">
          {dateStr}
        </h1>
      </div>

      {/* Routines */}
      <Section
        title={t('dashboard.day.routine')}
        counter={
          <Counter
            done={rDone}
            total={routinesToday.length}
            asPct={showRPct}
            onToggle={() => setShowRPct(v => !v)}
          />
        }
      >
        {routinesToday.length === 0 && !addingR && (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.routineEmpty')}</p>
        )}
        {routinesToday.map(r => (
          <RoutineRow
            key={r.id}
            routine={r}
            done={completions.has(r.id)}
            onToggle={toggleRoutine}
            onDelete={deleteDashRoutine}
          />
        ))}
        {addingR ? (
          <AddRoutineForm onSave={addDashRoutine} onCancel={() => setAddingR(false)} t={t} />
        ) : (
          <AddBtn label={t('dashboard.day.addRoutine')} onClick={() => setAddingR(true)} />
        )}
      </Section>

      {/* Tasks */}
      <Section
        title={t('dashboard.day.todoList')}
        counter={
          <Counter
            done={tDone}
            total={rootTasks.length}
            asPct={showTPct}
            onToggle={() => setShowTPct(v => !v)}
          />
        }
      >
        {rootTasks.length === 0 && (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.tasksEmpty')}</p>
        )}
        {rootTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            subtasks={getSubs(task.id)}
            onToggle={(id, changes) => updateDayTask(id, changes)}
            onTitleChange={(id, title) => updateDayTask(id, { title })}
            onDelete={deleteDayTask}
            onAddSub={addDayTask}
            t={t}
          />
        ))}
        <AddBtn label={t('dashboard.day.addTask')} onClick={() => addDayTask(null)} />
      </Section>

      {/* Projects */}
      <Section
        title={t('dashboard.day.projectsToday')}
        counter={
          <Counter
            done={pDone}
            total={projTasks.length}
            asPct={showPPct}
            onToggle={() => setShowPPct(v => !v)}
          />
        }
      >
        {projTasks.length === 0 ? (
          <p className="text-[13px] text-zinc-400 mt-1">{t('dashboard.day.projectsEmpty') || 'Nenhuma tarefa pendente nos projetos.'}</p>
        ) : (
          Object.entries(
            projTasks.reduce((acc, task) => {
              const key = task.project_id || 'sem-projeto'
              if (!acc[key]) acc[key] = {
                title: task.projects?.title || 'Projeto',
                stage: task.projects?.stage,
                tasks: []
              }
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

      {/* Notes */}
      <Section title={t('dashboard.day.notes')}>
        <NoteArea
          content={note.content}
          onSave={saveNote}
          placeholder={t('dashboard.day.notesPlaceholder')}
        />
      </Section>
    </div>
  )
}
