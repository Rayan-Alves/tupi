import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Check, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useWeekData, getMondayOf, shiftWeek } from '../../hooks/useWeekData'
import { FolderKanban } from 'lucide-react'

const SOURCE_COLOR = {
  spirit:    '#5a8ab8',
  mind:      '#d4890a',
  body:      '#6aaa30',
  dashboard: '#c4c4c4',
}

const isToday = (date) => {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(date); d.setHours(0,0,0,0)
  return t.getTime() === d.getTime()
}

const isPast = (date) => {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(date); d.setHours(0,0,0,0)
  return d.getTime() < t.getTime()
}

/* ── Primitives ────────────────────────────── */

function CheckCircle({ done, onToggle, size = 16 }) {
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
      style={{
        width: size, height: size,
        border: `1.5px solid ${done ? '#10b981' : '#dadada'}`,
        background: done ? '#10b981' : 'transparent',
      }}
    >
      {done && <Check size={size * 0.55} strokeWidth={2.5} color="#fff" />}
    </button>
  )
}

/* ── Week summary chart ────────────────────── */

function WeekSummary({ stats, byDay, locale, t }) {
  return (
    <section className="bg-white rounded-3xl border border-zinc-100 px-7 py-6 mb-5">
      <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 font-medium mb-1">
            {t('dashboard.week.summary')}
          </div>
          <h2 className="font-display text-[28px] font-medium text-zinc-900 leading-none tracking-tight">
            {stats.done} / {stats.total} {t('dashboard.week.done')}
          </h2>
        </div>
        <div className="flex items-center gap-6 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span className="text-zinc-500">{t('dashboard.day.routine')}</span>
            <span className="text-zinc-900 font-semibold tabular-nums">{stats.doneRoutines}/{stats.totalRoutines}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="text-zinc-500">{t('dashboard.day.todoList')}</span>
            <span className="text-zinc-900 font-semibold tabular-nums">{stats.doneTasks}/{stats.totalTasks}</span>
          </div>
          {stats.totalProjTasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#C8841A' }} />
              <span className="text-zinc-500">{t('dashboard.week.projects')}</span>
              <span className="text-zinc-900 font-semibold tabular-nums">{stats.doneProjTasks}/{stats.totalProjTasks}</span>
            </div>
          )}
          <div>
            <span className="font-display text-[28px] font-medium text-emerald-700 tabular-nums">{stats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Bar chart per day */}
      <div className="grid grid-cols-7 gap-2 items-end" style={{ height: 80 }}>
        {byDay.map(day => {
          const total = day.routines.length + day.tasks.length
          const done  = day.completedRoutines.size + day.completedTasksCount
          const pct   = total > 0 ? (done / total) * 100 : 0
          const today = isToday(day.date)
          const past  = isPast(day.date)
          const empty = total === 0
          return (
            <div key={day.iso} className="flex flex-col items-center gap-2 h-full">
              <div className="flex-1 w-full flex items-end relative">
                <div
                  className="w-full rounded-md transition-all duration-500"
                  style={{
                    height: empty ? '6px' : `${Math.max(6, pct)}%`,
                    background: empty
                      ? '#f4f4f5'
                      : pct === 100 ? '#10b981'
                      : today ? '#a87a3e'
                      : past ? '#d4d4d8'
                      : '#e4e4e7',
                  }}
                  title={`${done}/${total}`}
                />
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${today ? 'text-amber-700' : 'text-zinc-400'}`}>
                {format(day.date, 'EEEEEE', { locale })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── Routine row (compact) ─────────────────── */

function RoutineRow({ routine, done, dateISO, onToggle }) {
  const dotColor = SOURCE_COLOR[routine.source] || SOURCE_COLOR.dashboard
  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <CheckCircle done={done} onToggle={() => onToggle(routine.id, routine.source, dateISO)} />
      <span className={`flex-1 text-[12px] truncate ${done ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
        {routine.title || '—'}
      </span>
      <span style={{ background: dotColor }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
    </div>
  )
}

/* ── Task row (compact, inline editable) ───── */

function TaskRow({ task, autoFocus, onToggle, onChange, onDelete, onDoneEditing, t }) {
  const [title, setTitle] = useState(task.title || '')
  const inputRef = useRef(null)
  const dirty = useRef(false)

  useEffect(() => { setTitle(task.title || '') }, [task.id])
  useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus() }, [autoFocus])

  function flush() {
    if (dirty.current) { onChange(task.id, { title }); dirty.current = false }
    if (onDoneEditing) onDoneEditing()
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <CheckCircle done={task.completed} onToggle={() => onToggle(task.id, { completed: !task.completed })} />
      <input
        ref={inputRef}
        value={title}
        onChange={e => { setTitle(e.target.value); dirty.current = true }}
        onBlur={flush}
        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder={t('dashboard.day.taskPlaceholder')}
        className={`flex-1 bg-transparent border-0 outline-none text-[12px] min-w-0 ${
          task.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'
        }`}
      />
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all flex-shrink-0"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

/* ── Day column ────────────────────────────── */

function DayColumn({ day, locale, focusTaskId, onToggleRoutine, onAddTask, onUpdateTask, onDeleteTask, onTaskCreated, onToggleProjTask, t }) {
  const total = day.routines.length + day.tasks.length + day.projTasks.length
  const done  = day.completedRoutines.size + day.completedTasksCount + day.completedProjTasksCount
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const today = isToday(day.date)

  async function handleAdd() {
    const created = await onAddTask(day.iso)
    if (created) onTaskCreated(created.id)
  }

  return (
    <div
      className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col min-h-[280px]"
      style={today ? { boxShadow: '0 0 0 1.5px #C8841A' } : undefined}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="font-display text-[18px] font-medium text-zinc-900 leading-none capitalize tracking-tight">
            {format(day.date, 'EEEE', { locale })}
          </h3>
          {today && (
            <span className="text-[8px] tracking-[0.18em] uppercase text-amber-700 font-bold">
              {t('dashboard.today')}
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          {format(day.date, 'd MMM', { locale })}
        </div>
        {total > 0 && (
          <div className="mt-2.5 h-[3px] bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#a87a3e' }}
            />
          </div>
        )}
      </div>

      {/* Routines */}
      {day.routines.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-400 font-bold mb-1">
            {t('dashboard.day.routine')}
          </div>
          {day.routines.map(r => (
            <RoutineRow
              key={r.id}
              routine={r}
              done={day.completedRoutines.has(r.id)}
              dateISO={day.iso}
              onToggle={onToggleRoutine}
            />
          ))}
        </div>
      )}

      {/* Project tasks */}
      {day.projTasks.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1">
            <FolderKanban size={9} /> {t('dashboard.week.projects')}
          </div>
          {day.projTasks.map(pt => (
            <div key={pt.id} className="flex items-center gap-2 py-1.5 group">
              <CheckCircle done={pt.completed} onToggle={() => onToggleProjTask(pt.id)} />
              <div className="flex-1 min-w-0">
                <div className={`text-[12px] truncate ${pt.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                  {pt.title || '—'}
                </div>
                {pt.projects?.title && (
                  <div className="text-[10px] text-zinc-400 truncate italic">{pt.projects.title}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      <div className="flex-1 flex flex-col">
        {(day.tasks.length > 0 || (day.routines.length === 0 && day.projTasks.length === 0)) && (
          <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-400 font-bold mb-1">
            {t('dashboard.day.todoList')}
          </div>
        )}
        <div className="flex-1">
          {day.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              autoFocus={task.id === focusTaskId}
              onToggle={onUpdateTask}
              onChange={onUpdateTask}
              onDelete={onDeleteTask}
              onDoneEditing={() => focusTaskId === task.id && onTaskCreated(null)}
              t={t}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 mt-2 text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <Plus size={11} strokeWidth={2} /> {t('dashboard.day.addTask')}
        </button>
      </div>
    </div>
  )
}

/* ── Main WeekTab ──────────────────────────── */

export default function WeekTab() {
  const { t, i18n } = useTranslation()
  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const { byDay, stats, loading, toggleRoutine, addTask, updateTask, deleteTask, toggleProjTask } = useWeekData(monday)
  const [focusTaskId, setFocusTaskId] = useState(null)

  const localeMap = { pt: ptBR, en: enUS, es }
  const locale = localeMap[i18n.language] || ptBR

  const sunday = byDay[6]?.date
  const label  = byDay[0] && byDay[6]
    ? `${format(byDay[0].date, 'd MMM', { locale })} – ${format(byDay[6].date, 'd MMM', { locale })}`
    : ''

  if (loading) {
    return <div className="text-center py-16 text-zinc-400 text-sm">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Period nav */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-h1 tracking-tight capitalize">
          {label}
        </h1>
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

      {/* Summary */}
      <WeekSummary stats={stats} byDay={byDay} locale={locale} t={t} />

      {/* Day columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {byDay.map(day => (
          <DayColumn
            key={day.iso}
            day={day}
            locale={locale}
            focusTaskId={focusTaskId}
            onToggleRoutine={toggleRoutine}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onTaskCreated={setFocusTaskId}
            onToggleProjTask={toggleProjTask}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}
