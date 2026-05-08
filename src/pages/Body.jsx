import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronRight, Check, Dumbbell, Save, CalendarDays } from 'lucide-react'
import { useBody } from '../hooks/useBody'

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function SectionDivider({ label }) {
  return (
    <div className="section-divider">
      <div className="section-divider-line" />
      <span className="section-divider-label">{label}</span>
      <div className="section-divider-line" />
    </div>
  )
}

function SaveButton({ status, onClick }) {
  const styles = {
    clean:  'bg-zinc-100 text-zinc-400 cursor-default',
    dirty:  'bg-body hover:bg-[#1f380f] text-white shadow-sm cursor-pointer',
    saving: 'bg-[#4a8024] text-white cursor-wait',
    saved:  'bg-emerald-500 text-white cursor-default',
  }
  const labels = { clean: 'Salvo', dirty: 'Salvar', saving: 'Salvando…', saved: 'Salvo ✓' }
  return (
    <button
      onClick={status === 'dirty' ? onClick : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${styles[status]}`}
    >
      {status === 'saved' ? <Check size={11} /> : <Save size={11} />}
      {labels[status]}
    </button>
  )
}

function AutoTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = el.scrollHeight + 'px'
  }, [])
  useLayoutEffect(() => { resize() })
  return (
    <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={1} className="auto-textarea" />
  )
}

function SaveableTextarea({ initialValue, onSave, placeholder }) {
  const [value, setValue] = useState(initialValue || '')
  const [status, setStatus] = useState('clean')
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = el.scrollHeight + 'px'
  }, [])
  useLayoutEffect(() => { resize() })
  useEffect(() => { setValue(initialValue || ''); setStatus('clean') }, [initialValue])
  async function handleSave() {
    setStatus('saving')
    await onSave(value)
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }
  return (
    <div className="space-y-2">
      <textarea ref={ref} value={value} onChange={e => { setValue(e.target.value); setStatus('dirty') }}
        placeholder={placeholder} rows={1} className="auto-textarea" />
      <div className="flex justify-end"><SaveButton status={status} onClick={handleSave} /></div>
    </div>
  )
}

function TaskItem({ task, onUpdate, onDelete, t }) {
  const days = task.repeat_days || []
  function toggleDay(day) {
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    onUpdate(task.id, 'repeat_days', next)
  }
  return (
    <div className="group flex flex-col gap-2 p-3 rounded-xl border border-zinc-100 bg-zinc-50 hover:border-zinc-200 transition-all">
      <div className="flex items-start gap-2">
        <button onClick={() => onUpdate(task.id, 'completed', !task.completed)}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-body border-body' : 'border-zinc-300 hover:border-[#4a8024]'}`}>
          {task.completed && <Check size={9} className="text-white" />}
        </button>
        <input value={task.title} onChange={e => onUpdate(task.id, 'title', e.target.value)}
          placeholder={t('spirit.tasks.placeholder')}
          className={`flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 border-0 focus:ring-0 p-0 ${task.completed ? 'line-through text-zinc-400' : ''}`} />
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-0.5">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex items-center gap-3 ml-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">{t('spirit.tasks.startDate')}</span>
          <input type="date" value={task.start_date || ''} onChange={e => onUpdate(task.id, 'start_date', e.target.value || null)} className="date-input" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">{t('spirit.tasks.endDate')}</span>
          <input type="date" value={task.end_date || ''} onChange={e => onUpdate(task.id, 'end_date', e.target.value || null)} className="date-input" />
        </div>
        <button onClick={() => onUpdate(task.id, 'repeat', !task.repeat)}
          className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${task.repeat ? 'bg-[#2D5016]/10 text-body' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
          ↺ {t('spirit.tasks.repeat')}
        </button>
      </div>
      {task.repeat && (
        <div className="flex gap-1.5 ml-6 flex-wrap">
          {WEEK_DAYS.map(day => (
            <button key={day} onClick={() => toggleDay(day)}
              className={`pill-day text-[10px] w-7 h-7 ${days.includes(day) ? 'bg-body text-white' : 'pill-day-off'}`}>
              {t(`spirit.tasks.days.${day}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal, tasks, onSave, onDelete, onAddTask, onUpdateTask, onDeleteTask, t }) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState({ title: goal.title || '', why: goal.why || '', how: goal.how || '', what_needed: goal.what_needed || '', reflection: goal.reflection || '' })
  const [saveStatus, setSaveStatus] = useState('clean')
  const goalTasks = tasks.filter(task => task.goal_id === goal.id)

  useEffect(() => {
    setLocal({ title: goal.title || '', why: goal.why || '', how: goal.how || '', what_needed: goal.what_needed || '', reflection: goal.reflection || '' })
  }, [goal.id])

  function update(field, value) { setLocal(prev => ({ ...prev, [field]: value })); setSaveStatus('dirty') }

  async function handleSave() {
    setSaveStatus('saving')
    await onSave(goal.id, local)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('clean'), 2500)
  }

  return (
    <div className={`bg-white rounded-2xl border-l-4 border-l-body border border-zinc-100 shadow-card overflow-hidden transition-all duration-200 ${open ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <button className="text-zinc-400 flex-shrink-0">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
        <input value={local.title} onChange={e => { e.stopPropagation(); update('title', e.target.value) }} onClick={e => e.stopPropagation()}
          placeholder={t('spirit.goals.goalTitle')} className="flex-1 input-inline text-[14px]" />
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {goalTasks.length > 0 && (
            <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {goalTasks.filter(t => t.completed).length}/{goalTasks.length}
            </span>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(goal.id) }} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={13} /></button>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100">
          {[
            { field: 'why', labelKey: 'spirit.goals.why', phKey: 'spirit.goals.whyPlaceholder' },
            { field: 'how', labelKey: 'spirit.goals.how', phKey: 'spirit.goals.howPlaceholder' },
            { field: 'what_needed', labelKey: 'spirit.goals.whatNeeded', phKey: 'spirit.goals.whatNeededPlaceholder' },
          ].map(({ field, labelKey, phKey }) => (
            <div key={field} className="pt-3">
              <label className="field-label">{t(labelKey)}</label>
              <AutoTextarea value={local[field]} onChange={val => update(field, val)} placeholder={t(phKey)} />
            </div>
          ))}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="field-label">{t('spirit.tasks.title')}</span>
              <button onClick={() => onAddTask(goal.id)} className="btn-ghost text-[12px]"><Plus size={12} />{t('spirit.tasks.add')}</button>
            </div>
            <div className="space-y-2">
              {goalTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={onUpdateTask} onDelete={onDeleteTask} t={t} />)}
            </div>
          </div>
          <div className="pt-1">
            <label className="field-label">{t('spirit.goals.reflection')}</label>
            <AutoTextarea value={local.reflection} onChange={val => update('reflection', val)} placeholder={t('spirit.goals.reflectionPlaceholder')} />
          </div>
          <div className="flex justify-end pt-1"><SaveButton status={saveStatus} onClick={handleSave} /></div>
        </div>
      )}
    </div>
  )
}

function RoutineItem({ routine, onSaveField, onDelete, t }) {
  const [title, setTitle] = useState(routine.title || '')
  const [titleStatus, setTitleStatus] = useState('clean')
  const days = routine.days || []

  useEffect(() => { setTitle(routine.title || ''); setTitleStatus('clean') }, [routine.id])

  async function handleTitleSave() {
    setTitleStatus('saving')
    await onSaveField(routine.id, 'title', title)
    setTitleStatus('saved')
    setTimeout(() => setTitleStatus('clean'), 2500)
  }

  function toggleDay(day) {
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    onSaveField(routine.id, 'days', next)
  }

  return (
    <div className="group spirit-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input value={title} onChange={e => { setTitle(e.target.value); setTitleStatus('dirty') }}
          placeholder={t('spirit.routine.whatPlaceholder')} className="flex-1 input-inline text-[14px]" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveButton status={titleStatus} onClick={handleTitleSave} />
          <button onClick={() => onDelete(routine.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {WEEK_DAYS.map(day => (
            <button key={day} onClick={() => toggleDay(day)}
              className={`pill-day ${days.includes(day) ? 'bg-body text-white' : 'pill-day-off'}`}>
              {t(`spirit.tasks.days.${day}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-400">{t('spirit.routine.startTime')}</span>
            <input type="time" value={routine.start_time || ''} onChange={e => onSaveField(routine.id, 'start_time', e.target.value || null)} className="date-input" />
          </div>
          <span className="text-zinc-300 text-sm">→</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-400">{t('spirit.routine.endTime')}</span>
            <input type="time" value={routine.end_time || ''} onChange={e => onSaveField(routine.id, 'end_time', e.target.value || null)} className="date-input" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Body() {
  const { t } = useTranslation()
  const { profile, saveProfileField, goals, addGoal, saveGoalFields, deleteGoal, tasks, addTask, updateTask, deleteTask, routines, addRoutine, saveRoutineField, deleteRoutine, loading } = useBody()

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center gap-2">
        <Dumbbell size={20} className="text-body" />
        <div>
          <h1 className="font-display text-3xl font-semibold text-zinc-900">{t('body.title')}</h1>
          <p className="text-sm text-zinc-400">{t('body.subtitle')}</p>
        </div>
      </div>

      {/* Treat yourself with kindness */}
      <section>
        <div className="spirit-card p-6">
          <label className="field-label">{t('body.kindness.label')}</label>
          <SaveableTextarea initialValue={profile.kindness} onSave={v => saveProfileField('kindness', v)} placeholder={t('body.kindness.placeholder')} />
        </div>
      </section>

      {/* Last exam check */}
      <section>
        <div className="spirit-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={15} className="text-body" />
            <label className="field-label mb-0">{t('body.examCheck.title')}</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">{t('body.lastExam')}</label>
              <input
                type="month"
                value={profile.last_exam_date || ''}
                onChange={e => saveProfileField('last_exam_date', e.target.value || null)}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700"
              />
            </div>
            <div>
              <label className="field-label">{t('body.nextExam')}</label>
              <input
                type="month"
                value={profile.next_exam_date || ''}
                onChange={e => saveProfileField('next_exam_date', e.target.value || null)}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SectionDivider label={t('body.goals.title')} />
            <span className="text-xs text-zinc-400 flex-shrink-0">(máximo 3)</span>
          </div>
          <button onClick={addGoal} className="btn-primary ml-4 flex-shrink-0">
            {t('spirit.goals.add')}
          </button>
        </div>
        {goals.length === 0
          ? <div className="spirit-card p-10 text-center"><p className="text-zinc-400 text-sm">{t('spirit.goals.noGoals')}</p></div>
          : <div className="grid grid-cols-1 gap-3">
              {goals.map(goal => <GoalCard key={goal.id} goal={goal} tasks={tasks} onSave={saveGoalFields} onDelete={deleteGoal} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} t={t} />)}
            </div>
        }
      </section>

      {/* Routine / Activities */}
      <section className="space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <SectionDivider label={t('body.routine.title')} />
          <button onClick={addRoutine} className="btn-primary ml-4 flex-shrink-0">
            {t('spirit.routine.add')}
          </button>
        </div>
        {routines.length === 0
          ? <div className="spirit-card p-10 text-center"><p className="text-zinc-400 text-sm">{t('body.routine.noRoutines')}</p></div>
          : <div className="space-y-2">
              {routines.map(r => <RoutineItem key={r.id} routine={r} onSaveField={saveRoutineField} onDelete={deleteRoutine} t={t} />)}
            </div>
        }
      </section>
    </div>
  )
}
