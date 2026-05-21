import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronRight, Check, Sparkles, Save, X, Clock, User, Wind } from 'lucide-react'
import { useSpirit } from '../hooks/useSpirit'
import { useUno } from '../hooks/useUno'
import DesireList from '../components/spirit/DesireList'
import IdentitySection from '../components/spirit/IdentitySection'
import SpiritualRoutine from '../components/spirit/SpiritualRoutine'
import UnoSection from '../components/UnoSection'

function PortalCard({ icon, label, color, onClick, disabled, comingSoonLabel }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="relative group rounded-2xl p-5 transition-all duration-200 text-left"
      style={{
        background: `linear-gradient(135deg, ${color}10 0%, ${color}22 100%)`,
        border: `1px solid ${color}44`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 20px ${color}33`
        e.currentTarget.style.borderColor = color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `${color}44`
      }}>
      <div style={{ color, marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
        {label}
      </div>
      {disabled && comingSoonLabel && (
        <div style={{ fontSize: '10px', color, marginTop: '4px', fontStyle: 'italic', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          {comingSoonLabel}
        </div>
      )}
    </button>
  )
}

function ValueCard({ card, presets, onSave, onDelete, t }) {
  const [custom, setCustom]     = useState(() => {
    if (card.selected && card.selected !== '__custom__') return card.selected
    return card.custom || ''
  })
  const [meaning, setMeaning]   = useState(card.meaning || '')
  const [status, setStatus]     = useState('clean')
  const textRef = useRef(null)

  useEffect(() => {
    if (card.selected && card.selected !== '__custom__') {
      setCustom(card.selected)
    } else {
      setCustom(card.custom || '')
    }
    setMeaning(card.meaning || '')
    setStatus('clean')
  }, [card.id, card.selected, card.custom])

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = el.scrollHeight + 'px'
  })

  async function handleSave() {
    setStatus('saving')
    await onSave(card.id, { selected: '__custom__', custom, meaning })
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col relative transition-all duration-200 hover:shadow-md border border-black/5">
      {/* Top action icons */}
      <div className="flex justify-end items-start mb-2">
        <button onClick={() => onDelete(card.id)} className="text-zinc-300 hover:text-red-400 transition-colors p-1 -mr-2 -mt-2">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Value Title input */}
      <div className="mb-4">
        <input
          list={`presets-${card.id}`}
          type="text"
          value={custom}
          onChange={e => { setCustom(e.target.value); setStatus('dirty') }}
          placeholder={t('spirit.values.customPlaceholder')}
          className="w-full bg-transparent border-0 p-0 text-[20px] font-display text-[#2D2A26] placeholder-zinc-300 focus:ring-0 transition-all outline-none leading-snug"
        />
        <datalist id={`presets-${card.id}`}>
          {presets.map(v => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-100 w-full mb-5" />

      {/* Meaning text */}
      <div className="flex-1 flex flex-col">
        <label className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase mb-3">
          {t('spirit.values.represent')}
        </label>
        <textarea
          ref={textRef}
          value={meaning}
          onChange={e => { setMeaning(e.target.value); setStatus('dirty') }}
          placeholder={t('spirit.values.meaningPlaceholder')}
          rows={2}
          className="w-full bg-transparent border-0 p-0 text-[15px] text-[#2D2A26] focus:ring-0 resize-none outline-none leading-relaxed"
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={status === 'dirty' ? handleSave : undefined}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border
            ${(status === 'clean' || status === 'saved') ? 'bg-white border-zinc-200 text-zinc-500' : ''}
            ${status === 'dirty' ? 'bg-[#2D2A26] border-[#2D2A26] text-white hover:bg-black cursor-pointer shadow-sm' : ''}
            ${status === 'saving' ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-wait' : ''}
          `}
        >
          {(status === 'saved' || status === 'clean') && <Check size={13} strokeWidth={2.5} />}
          {status === 'dirty' && <Save size={13} strokeWidth={2} />}
          {status === 'clean' ? t('common.saved') : status === 'saving' ? t('common.saving') : status === 'saved' ? t('common.saved') : t('common.saving').replace('…','') || 'Save'}
        </button>
      </div>
    </div>
  )
}

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
  const { t } = useTranslation()
  const styles = {
    clean:   'bg-zinc-100 text-zinc-400 cursor-default',
    dirty:   'bg-spirit hover:bg-[#152e4a] text-white shadow-sm cursor-pointer',
    saving:  'bg-[#3a6490] text-white cursor-wait',
    saved:   'bg-emerald-500 text-white cursor-default',
  }
  const labels = {
    clean:  t('common.saved'),
    dirty:  t('common.save'),
    saving: t('common.saving'),
    saved:  t('common.saved') + ' ✓',
  }
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

  useEffect(() => {
    setValue(initialValue || '')
    setStatus('clean')
  }, [initialValue])

  function handleChange(val) {
    setValue(val)
    setStatus('dirty')
  }

  async function handleSave() {
    setStatus('saving')
    await onSave(value)
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="auto-textarea"
      />
      <div className="flex justify-end">
        <SaveButton status={status} onClick={handleSave} />
      </div>
    </div>
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
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="auto-textarea"
    />
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
        <button
          onClick={() => onUpdate(task.id, 'completed', !task.completed)}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed ? 'bg-spirit border-spirit' : 'border-zinc-300 hover:border-[#3a6490]'
          }`}
        >
          {task.completed && <Check size={9} className="text-white" />}
        </button>
        <input
          value={task.title}
          onChange={e => onUpdate(task.id, 'title', e.target.value)}
          placeholder={t('spirit.tasks.placeholder')}
          className={`flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 border-0 focus:ring-0 p-0 ${task.completed ? 'line-through text-zinc-400' : ''}`}
        />
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center gap-3 ml-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">{t('spirit.tasks.startDate')}</span>
          <input
            type="date"
            value={task.start_date || ''}
            onChange={e => onUpdate(task.id, 'start_date', e.target.value || null)}
            className="date-input"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">{t('spirit.tasks.endDate')}</span>
          <input
            type="date"
            value={task.end_date || ''}
            onChange={e => onUpdate(task.id, 'end_date', e.target.value || null)}
            className="date-input"
          />
        </div>
        <button
          onClick={() => onUpdate(task.id, 'repeat', !task.repeat)}
          className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
            task.repeat ? 'bg-[#1B3A5C]/10 text-spirit' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          ↺ {t('spirit.tasks.repeat')}
        </button>
      </div>

      {task.repeat && (
        <div className="flex gap-1.5 ml-6 flex-wrap">
          {WEEK_DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`pill-day text-[10px] w-7 h-7 ${days.includes(day) ? 'pill-day-on' : 'pill-day-off'}`}
            >
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
  const [local, setLocal] = useState({
    title: goal.title || '',
    why: goal.why || '',
    how: goal.how || '',
    what_needed: goal.what_needed || '',
    reflection: goal.reflection || '',
  })
  const [saveStatus, setSaveStatus] = useState('clean')
  const goalTasks = tasks.filter(task => task.goal_id === goal.id)

  useEffect(() => {
    setLocal({
      title: goal.title || '',
      why: goal.why || '',
      how: goal.how || '',
      what_needed: goal.what_needed || '',
      reflection: goal.reflection || '',
    })
  }, [goal.id])

  function update(field, value) {
    setLocal(prev => ({ ...prev, [field]: value }))
    setSaveStatus('dirty')
  }

  async function handleSave() {
    setSaveStatus('saving')
    await onSave(goal.id, local)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('clean'), 2500)
  }

  return (
    <div className="goal-card transition-all duration-200">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <button className="text-zinc-400 flex-shrink-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <input
          value={local.title}
          onChange={e => { e.stopPropagation(); update('title', e.target.value) }}
          onClick={e => e.stopPropagation()}
          placeholder={t('spirit.goals.goalTitle')}
          className="flex-1 input-inline text-[14px]"
        />
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {goalTasks.length > 0 && (
            <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {goalTasks.filter(t => t.completed).length}/{goalTasks.length}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(goal.id) }}
            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100">
          {[
            { field: 'why',         labelKey: 'spirit.goals.why',        phKey: 'spirit.goals.whyPlaceholder' },
            { field: 'how',         labelKey: 'spirit.goals.how',        phKey: 'spirit.goals.howPlaceholder' },
            { field: 'what_needed', labelKey: 'spirit.goals.whatNeeded', phKey: 'spirit.goals.whatNeededPlaceholder' },
          ].map(({ field, labelKey, phKey }) => (
            <div key={field} className="pt-3">
              <label className="field-label">{t(labelKey)}</label>
              <AutoTextarea
                value={local[field]}
                onChange={val => update(field, val)}
                placeholder={t(phKey)}
              />
            </div>
          ))}

          {/* Tasks */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="field-label">{t('spirit.tasks.title')}</span>
              <button onClick={() => onAddTask(goal.id)} className="btn-ghost text-[12px]">
                <Plus size={12} /> {t('spirit.tasks.add')}
              </button>
            </div>
            <div className="space-y-2">
              {goalTasks.map(task => (
                <TaskItem key={task.id} task={task} onUpdate={onUpdateTask} onDelete={onDeleteTask} t={t} />
              ))}
            </div>
          </div>

          {/* Reflection */}
          <div className="pt-1">
            <label className="field-label">{t('spirit.goals.reflection')}</label>
            <AutoTextarea
              value={local.reflection}
              onChange={val => update('reflection', val)}
              placeholder={t('spirit.goals.reflectionPlaceholder')}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-1">
            <SaveButton status={saveStatus} onClick={handleSave} />
          </div>
        </div>
      )}
    </div>
  )
}

function parseValues(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export default function Spirit() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const {
    profile, saveProfileField,
    goals, addGoal, saveGoalFields, deleteGoal,
    tasks, addTask, updateTask, deleteTask,
    routines, addRoutine, saveRoutineField, deleteRoutine,
    loading,
  } = useSpirit()
  const { projects: unoProjects, loading: unoLoading } = useUno()

  const [valueCards, setValueCards] = useState([])

  useEffect(() => {
    const saved = parseValues(profile.values)
    if (saved.length > 0) {
      setValueCards(saved)
    } else {
      setValueCards([
        { id: '1', selected: '', custom: '', meaning: '' },
        { id: '2', selected: '', custom: '', meaning: '' },
        { id: '3', selected: '', custom: '', meaning: '' },
      ])
    }
  }, [profile.values])

  const presets = t('spirit.values.presets', { returnObjects: true }) || []

  function addValueCard() {
    const newCard = { id: Date.now().toString(), selected: '', custom: '', meaning: '' }
    const next = [...valueCards, newCard]
    setValueCards(next)
    saveProfileField('values', JSON.stringify(next))
  }

  async function saveValueCard(id, data) {
    const next = valueCards.map(c => c.id === id ? { ...c, ...data } : c)
    setValueCards(next)
    await saveProfileField('values', JSON.stringify(next))
  }

  function deleteValueCard(id) {
    const next = valueCards.filter(c => c.id !== id)
    setValueCards(next)
    saveProfileField('values', JSON.stringify(next))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Page header */}
      <div className="text-center w-full">
        <h1 className="type-h1">O bem-sentir</h1>
        <p className="text-sm text-zinc-400 mt-1">{t('spirit.subtitle')}</p>
      </div>

      {/* ── IDENTITY ── */}
      <IdentitySection />

      {/* ── VALUES ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="type-h1 mb-1">{t('spirit.values.title')}</h2>
            <p className="text-[#5C5C5C] text-sm">{t('spirit.values.subtitle')}</p>
          </div>
          <button
            onClick={addValueCard}
            className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 rounded-full text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {valueCards.map(card => (
            <ValueCard
              key={card.id}
              card={card}
              presets={presets}
              onSave={saveValueCard}
              onDelete={deleteValueCard}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* ── DEEP DESIRES ── */}
      <section className="space-y-4">
        <div>
          <h2 className="type-h1 mb-1">{t('spirit.desires.title')}</h2>
          <p className="text-[#5C5C5C] text-sm italic" style={{ fontFamily: 'Libre Baskerville, Georgia, serif', fontSize: 14 }}>
            {t('spirit.desires.subtitle')}
          </p>
        </div>
        <DesireList />
      </section>

      {/* ── UNO ── */}
      <section className="space-y-4">
        <h2 className="type-h1">UNO</h2>
        {!unoLoading && (
          <UnoSection
            projects={unoProjects}
            lockedMessage={t('uno.lockedSpirit')}
          />
        )}
      </section>


      {/* ── ROUTINE ── */}
      <SpiritualRoutine
        routines={routines}
        addRoutine={addRoutine}
        saveRoutineField={saveRoutineField}
        deleteRoutine={deleteRoutine}
        titleKey="spirit.routine.title"
        subtitleKey="spirit.routine.subtitle"
      />
    </div>
  )
}
