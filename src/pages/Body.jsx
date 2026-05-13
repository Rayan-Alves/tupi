import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronRight, Check, Dumbbell, Save, CalendarDays, Sparkles } from 'lucide-react'
import { useBody } from '../hooks/useBody'
import { useUno } from '../hooks/useUno'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UnoSection from '../components/UnoSection'

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
    <div className={`bg-white rounded-2xl border-l-4 border-l-body border border-zinc-100 shadow-card overflow-hidden transition-all duration-200`}>
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

function AffirmationsSection() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const refs = useRef({})

  useEffect(() => {
    if (!user) return
    supabase.from('body_affirmations').select('*')
      .eq('user_id', user.id).order('sort_order')
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [user?.id])

  async function add() {
    const order = items.length
    const { data } = await supabase.from('body_affirmations')
      .insert({ user_id: user.id, text: '', sort_order: order })
      .select().single()
    if (data) {
      setItems(prev => [...prev, data])
      setTimeout(() => refs.current[data.id]?.focus(), 80)
    }
  }

  async function update(id, text) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, text } : a))
    await supabase.from('body_affirmations').update({ text }).eq('id', id).eq('user_id', user.id)
  }

  async function remove(id) {
    setItems(prev => prev.filter(a => a.id !== id))
    await supabase.from('body_affirmations').delete().eq('id', id).eq('user_id', user.id)
  }

  if (loading) return null

  return (
    <section>
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1px solid #FED7AA' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#D97706' }} />
            <span className="text-[11px] font-semibold tracking-[0.18em]" style={{ color: '#92400E' }}>AFIRMAÇÕES POSITIVAS</span>
          </div>
          <button onClick={add}
            className="flex items-center justify-center rounded-xl text-white transition-all"
            style={{ width: '36px', height: '36px', background: '#D97706', fontSize: '20px', lineHeight: 1, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = '#B45309'}
            onMouseLeave={e => e.currentTarget.style.background = '#D97706'}
            aria-label="adicionar afirmação">+</button>
        </div>

        {items.length === 0 ? (
          <p className="text-[13px] italic text-center py-4" style={{ color: '#B45309' }}>
            clique em + para escrever sua primeira afirmação ✨
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(a => (
              <AffirmationRow key={a.id} item={a} inputRef={el => { refs.current[a.id] = el }}
                onUpdate={update} onRemove={remove} onEnter={add} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AffirmationRow({ item, inputRef, onUpdate, onRemove, onEnter }) {
  const [text, setText] = useState(item.text || '')
  const dirty = useRef(false)
  useEffect(() => { setText(item.text || '') }, [item.id])

  function flush() {
    if (dirty.current) { onUpdate(item.id, text.trim()); dirty.current = false }
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); flush(); onEnter() }
    if (e.key === 'Backspace' && !text) { e.preventDefault(); onRemove(item.id) }
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70 hover:bg-white border" style={{ borderColor: '#FDE3C7' }}>
      <span className="flex-shrink-0" style={{ color: '#D97706', fontSize: '14px' }}>❝</span>
      <input ref={inputRef} value={text}
        onChange={e => { setText(e.target.value); dirty.current = true }}
        onBlur={flush}
        onKeyDown={handleKeyDown}
        placeholder="Eu sou..."
        className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-sm italic"
        style={{ color: '#7C2D12' }} />
      <button onClick={() => onRemove(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-all p-1"
        style={{ color: '#FCA5A5' }}
        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}
        aria-label="excluir">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export default function Body() {
  const { t } = useTranslation()
  const { profile, saveProfileField, goals, addGoal, saveGoalFields, deleteGoal, tasks, addTask, updateTask, deleteTask, routines, addRoutine, saveRoutineField, deleteRoutine, loading } = useBody()
  const { projects: allUnoProjects, loading: unoLoading } = useUno()
  const unoProjects = allUnoProjects.filter(p => p.stage === 'body')

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

      {/* UNO */}
      <section className="space-y-4">
        <SectionDivider label="UNO" />
        {!unoLoading && (
          <UnoSection
            projects={unoProjects}
            lockedMessage="Nenhum projeto pronto para o Corpo ainda. Complete as etapas no Espírito e na Mente antes de continuar."
          />
        )}
      </section>

      {/* Treat yourself with kindness */}
      <section>
        <div className="spirit-card p-6">
          <label className="field-label">{t('body.kindness.label')}</label>
          <SaveableTextarea initialValue={profile.kindness} onSave={v => saveProfileField('kindness', v)} placeholder={t('body.kindness.placeholder')} />
        </div>
      </section>

      {/* Positive affirmations */}
      <AffirmationsSection />

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
