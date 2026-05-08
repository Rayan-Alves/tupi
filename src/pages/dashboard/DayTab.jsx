import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sparkles, Brain, Dumbbell, Target, Clock, Check, ListTodo, Zap } from 'lucide-react'
import { useSpirit } from '../../hooks/useSpirit'
import { useMind } from '../../hooks/useMind'
import { useBody } from '../../hooks/useBody'
import { useWeek, getCurrentWeekPeriod } from '../../hooks/useWeek'

const TODAY = new Date().toISOString().split('T')[0]
const TODAY_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
const DONE_KEY = `art_routines_done_${TODAY}`

function getDone() {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]') } catch { return [] }
}

function pct(done, total) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

function MiniBar({ value, color }) {
  return (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function ProgressCard({ icon: Icon, title, color, accent, to, goals, tasks, routinesToday, doneRoutines }) {
  const goalsP   = pct(goals.filter(g => g.completed).length, goals.length)
  const tasksP   = pct(tasks.filter(t => t.completed).length, tasks.length)
  const routinesP = pct(doneRoutines.filter(id => routinesToday.some(r => r.id === id)).length, routinesToday.length)
  const overall  = goals.length + tasks.length + routinesToday.length > 0
    ? Math.round((goalsP + tasksP + routinesP) / 3)
    : 0

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
          <Icon size={15} />{title}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${color}`}>{overall}%</span>
          {to && <Link to={to} className="text-[12px] text-zinc-400 hover:text-zinc-700">→</Link>}
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { label: 'Goals', value: goalsP, count: `${goals.filter(g => g.completed).length}/${goals.length}` },
          { label: 'Tasks', value: tasksP, count: `${tasks.filter(t => t.completed).length}/${tasks.length}` },
          { label: 'Rotinas', value: routinesP, count: `${doneRoutines.filter(id => routinesToday.some(r => r.id === id)).length}/${routinesToday.length}` },
        ].map(({ label, value, count }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">{label}</span>
              <span className="text-[11px] text-zinc-400">{count} · {value}%</span>
            </div>
            <MiniBar value={value} color={accent} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RoutineList({ items, doneRoutines, onToggle, emptyText, badge, badgeColor, badgeLabel }) {
  if (items.length === 0) return <p className="text-sm text-zinc-400">{emptyText}</p>
  return (
    <ul className="space-y-2">
      {items.map(r => {
        const done = doneRoutines.includes(r.id)
        return (
          <li key={r.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => onToggle(r.id)}
                className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${done ? `${badgeColor} border-transparent` : 'border-zinc-300 hover:border-zinc-400'}`}
              >
                {done && <Check size={9} className="text-white" />}
              </button>
              <span className={`text-sm truncate ${done ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>{r.title || '—'}</span>
              <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badge}`}>{badgeLabel}</span>
            </div>
            {r.start_time && (
              <span className="text-[11px] text-zinc-400 flex-shrink-0">
                {r.start_time.slice(0, 5)}{r.end_time ? ` → ${r.end_time.slice(0, 5)}` : ''}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function DayTab() {
  const { t } = useTranslation()
  const { goals: sGoals, tasks: sTasks, routines: sRoutines, loading: sLoading } = useSpirit()
  const { goals: mGoals, tasks: mTasks, routines: mRoutines, loading: mLoading } = useMind()
  const { goals: bGoals, tasks: bTasks, routines: bRoutines, loading: bLoading } = useBody()
  const { tasks: weekTasks } = useWeek(getCurrentWeekPeriod())

  const [doneRoutines, setDoneRoutines] = useState(() => getDone())

  const loading = sLoading || mLoading || bLoading

  function toggleRoutine(id) {
    setDoneRoutines(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem(DONE_KEY, JSON.stringify(next))
      return next
    })
  }

  const spiritToday = sRoutines.filter(r => (r.days || []).includes(TODAY_KEY))
  const mindToday   = mRoutines.filter(r => (r.days || []).includes(TODAY_KEY))
  const bodyToday   = bRoutines.filter(r => (r.days || []).includes(TODAY_KEY))
  const allRoutinesToday = [...spiritToday, ...mindToday, ...bodyToday]

  const completedWeekTasks = weekTasks.filter(t => t.completed).length
  const mainGoal = sGoals.find(g => !g.completed) || sGoals[0]

  return (
    <div className="space-y-6">
      {/* ── To Do List ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ListTodo size={15} />{t('dashboard.day.todoList')}
          </div>
          <Link to="/dashboard" className="text-[12px] text-zinc-400 hover:text-zinc-700">→</Link>
        </div>
        {weekTasks.length === 0
          ? <p className="text-sm text-zinc-400">{t('dashboard.week.noTasks')}</p>
          : (
            <div className="space-y-2">
              <ul className="space-y-1.5">
                {weekTasks.slice(0, 6).map(task => (
                  <li key={task.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.completed ? 'bg-tabatinga' : 'bg-zinc-300'}`} />
                    <span className={`text-sm ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>{task.title || '—'}</span>
                  </li>
                ))}
                {weekTasks.length > 6 && <li className="text-[12px] text-zinc-400 pl-3.5">+{weekTasks.length - 6}</li>}
              </ul>
              <div className="pt-1">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-[11px] text-zinc-400">{completedWeekTasks}/{weekTasks.length} {t('dashboard.completed').toLowerCase()}</span>
                  <span className="text-[11px] text-zinc-500 font-semibold">{pct(completedWeekTasks, weekTasks.length)}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-spirit rounded-full transition-all duration-500"
                    style={{ width: `${pct(completedWeekTasks, weekTasks.length)}%` }} />
                </div>
              </div>
            </div>
          )
        }
      </div>

      {/* ── Routines + Activities ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Spirit + Mind routines */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 mb-4">
            <Clock size={15} />{t('dashboard.day.routine')}
          </div>
          {loading
            ? <p className="text-sm text-zinc-400">{t('common.loading')}</p>
            : <RoutineList
                items={[...spiritToday, ...mindToday]}
                doneRoutines={doneRoutines}
                onToggle={toggleRoutine}
                emptyText={t('spirit.routine.noRoutines')}
                badge="bg-[#1B3A5C]/10 text-spirit"
                badgeColor="bg-spirit"
                badgeLabel="S"
              />
          }
        </div>

        {/* Body routines as Activities */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Zap size={15} />{t('dashboard.day.activities')}
            </div>
            <Link to="/body" className="text-[12px] text-zinc-400 hover:text-zinc-700">→</Link>
          </div>
          {loading
            ? <p className="text-sm text-zinc-400">{t('common.loading')}</p>
            : <RoutineList
                items={bodyToday}
                doneRoutines={doneRoutines}
                onToggle={toggleRoutine}
                emptyText={t('body.routine.noRoutines')}
                badge="bg-[#2D5016]/10 text-body"
                badgeColor="bg-body"
                badgeLabel="B"
              />
          }
        </div>
      </div>

      {/* ── Main Goal ── */}
      {!loading && mainGoal && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5 border-l-4 border-l-spirit">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-spirit">
              <Target size={15} />{t('dashboard.day.mainGoal')}
            </div>
            <Link to="/spirit" className="text-[12px] text-zinc-400 hover:text-zinc-700">→</Link>
          </div>
          <p className="text-sm font-semibold text-zinc-800">{mainGoal.title || t('spirit.goals.goalTitle')}</p>
          {mainGoal.why && <p className="text-sm text-zinc-500 mt-1">{mainGoal.why}</p>}
        </div>
      )}

      {/* ── Progress ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ProgressCard
            icon={Sparkles} title={t('nav.spirit')} color="text-spirit" accent="bg-spirit" to="/spirit"
            goals={sGoals} tasks={sTasks} routinesToday={spiritToday} doneRoutines={doneRoutines}
          />
          <ProgressCard
            icon={Brain} title={t('nav.mind')} color="text-mind" accent="bg-mind" to="/mind"
            goals={mGoals} tasks={mTasks} routinesToday={mindToday} doneRoutines={doneRoutines}
          />
          <ProgressCard
            icon={Dumbbell} title={t('nav.body')} color="text-body" accent="bg-body" to="/body"
            goals={bGoals} tasks={bTasks} routinesToday={bodyToday} doneRoutines={doneRoutines}
          />
        </div>
      )}
    </div>
  )
}
