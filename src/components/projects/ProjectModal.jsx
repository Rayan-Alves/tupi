import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGES } from './KanbanBoard'
import { playProgress } from '../../lib/sounds'
import { hasRecurrence, totalOccurrences, computeCheckUpdate } from '../../lib/recurring'
import SmartTab, { isSmartComplete } from './SmartTab'

const DAYS = [
  { key: 'sun', label: 'D' }, { key: 'mon', label: 'S' }, { key: 'tue', label: 'T' },
  { key: 'wed', label: 'Q' }, { key: 'thu', label: 'Q' }, { key: 'fri', label: 'S' }, { key: 'sat', label: 'S' },
]

function fmtShortDate(d) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const NEXT_TAB = { soil: 'plant', plant: 'water', water: 'harvest' }

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '5px', fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', border: 'none', borderBottom: '1px solid #e4e4e7', background: 'transparent',
  fontSize: '13px', color: '#1a1a1a', padding: '4px 0', outline: 'none', fontFamily: 'inherit',
  resize: 'none', lineHeight: 1.6, boxSizing: 'border-box',
}

function DateInput({ value, onCommit, style }) {
  const [local, setLocal] = useState(value || '')
  useEffect(() => { setLocal(value || '') }, [value])
  return (
    <input type="date" value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== (value || '')) onCommit(local || null) }}
      style={style || { ...inputStyle, width: 'auto' }} />
  )
}

function SoilTab({ form, onUpdate }) {
  const { t } = useTranslation()
  return (
    <div>
      <Field label={t('projects.modal.fields.idea')}>
        <textarea value={form.title} onChange={e => onUpdate('title', e.target.value)} placeholder={t('projects.modal.fields.ideaPh')} rows={2} style={inputStyle} />
      </Field>
      <Field label={t('projects.modal.fields.why')}>
        <textarea value={form.why} onChange={e => onUpdate('why', e.target.value)} placeholder={t('projects.modal.fields.whyPh')} rows={3} style={inputStyle} />
      </Field>
      <Field label={t('projects.modal.fields.success')}>
        <textarea value={form.success} onChange={e => onUpdate('success', e.target.value)} placeholder={t('projects.modal.fields.successPh')} rows={2} style={inputStyle} />
      </Field>
      <Field label={t('projects.modal.fields.how')}>
        <textarea value={form.how} onChange={e => onUpdate('how', e.target.value)} placeholder={t('projects.modal.fields.howPh')} rows={3} style={inputStyle} />
      </Field>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Field label={t('projects.modal.fields.start')}>
          <DateInput value={form.start_date} onCommit={v => onUpdate('start_date', v)} />
        </Field>
        <Field label={t('projects.modal.fields.end')}>
          <DateInput value={form.end_date} onCommit={v => onUpdate('end_date', v)} />
        </Field>
      </div>
    </div>
  )
}

function TaskRow({ task, project, stage, onUpdate, onDelete, onEnter, inputRef, isWaterPhase }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(task.title || '')
  const [showDate, setShowDate] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const dirty = useRef(false)
  const prevCount = useRef(task.completed_count || 0)

  useEffect(() => { setTitle(task.title || '') }, [task.id])

  useEffect(() => {
    const c = task.completed_count || 0
    if (c > prevCount.current) {
      setFlashing(true)
      const tm = setTimeout(() => setFlashing(false), 650)
      prevCount.current = c
      return () => clearTimeout(tm)
    }
    prevCount.current = c
  }, [task.completed_count])

  const hasDays = hasRecurrence(task)
  const total = hasDays ? totalOccurrences(task, project) : null
  const count = task.completed_count || 0

  function handleCheck() {
    const [changes] = computeCheckUpdate(task, project)
    onUpdate(task.id, changes)
  }

  function flush() { if (dirty.current) { onUpdate(task.id, { title: title.trim() }); dirty.current = false } }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); flush(); onEnter() }
    if (e.key === 'Backspace' && !title) onDelete(task.id)
  }

  function toggleDay(day) {
    const days = task.repeat_days || []
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    onUpdate(task.id, { repeat_days: next, recurring: next.length > 0 })
  }

  const btnBase = { width: '28px', height: '28px', borderRadius: '7px', border: '0.5px solid #e4e4e7', background: 'transparent', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }
  const projectMissingDates = isWaterPhase && hasDays && total === null

  return (
    <div style={{ borderBottom: '1px solid #f9f9f9', background: flashing ? '#bbf7d0' : 'transparent', borderRadius: '6px', transition: 'background .45s', margin: '0 -6px', padding: '0 6px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
        <div onClick={handleCheck}
          style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${task.completed ? stage.dot : (flashing ? '#22c55e' : '#d4d4d8')}`, background: task.completed ? stage.dot : (flashing ? '#22c55e' : 'transparent'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
          {(task.completed || flashing) && <span style={{ fontSize: '9px', color: '#fff' }}>✓</span>}
        </div>
        <input ref={inputRef} value={title}
          onChange={e => { setTitle(e.target.value); dirty.current = true }}
          onBlur={flush} onKeyDown={handleKeyDown}
          placeholder={t('projects.tasks.placeholder')}
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', color: task.completed ? '#a1a1aa' : '#1a1a1a', textDecoration: task.completed ? 'line-through' : 'none', outline: 'none', fontFamily: 'inherit' }} />
        {hasDays ? (
          <span style={{ fontSize: '10px', color: stage.dot, fontWeight: 700, flexShrink: 0, background: stage.bg, borderRadius: '10px', padding: '2px 7px' }}>
            {count}/{total === null ? '?' : total}
          </span>
        ) : task.due_date && (
          <span style={{ fontSize: '10px', color: stage.dot, fontWeight: 700, flexShrink: 0, background: stage.bg, borderRadius: '10px', padding: '2px 7px' }}>
            {fmtShortDate(task.due_date)}
          </span>
        )}
        <button onClick={() => setShowDate(s => !s)}
          style={{ ...btnBase, borderColor: task.due_date ? stage.color : '#e4e4e7', background: task.due_date ? stage.bg : 'transparent', color: task.due_date ? stage.dot : '#a1a1aa' }}
          title={t('projects.tasks.deadline')}>📅</button>
        <button onClick={() => onDelete(task.id)}
          style={{ ...btnBase, color: '#d4d4d8' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.borderColor = '#e4e4e7' }}
          title={t('projects.card.delete')}>✕</button>
      </div>
      {showDate && (
        <div style={{ paddingLeft: '24px', marginBottom: '8px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isWaterPhase && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#a1a1aa' }}>
              {t('projects.tasks.start')}
              <DateInput value={task.start_date} onCommit={v => onUpdate(task.id, { start_date: v })}
                style={{ border: 'none', borderBottom: `1px solid ${stage.color}`, background: 'transparent', fontSize: '12px', color: '#1a1a1a', padding: '2px 0', outline: 'none', fontFamily: 'inherit' }} />
            </label>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#a1a1aa' }}>
            {isWaterPhase ? t('projects.tasks.end') : t('projects.tasks.deadline')}
            <DateInput value={task.due_date} onCommit={v => onUpdate(task.id, { due_date: v })}
              style={{ border: 'none', borderBottom: `1px solid ${stage.color}`, background: 'transparent', fontSize: '12px', color: '#1a1a1a', padding: '2px 0', outline: 'none', fontFamily: 'inherit' }} />
          </label>
          {isWaterPhase && hasDays && (
            <span style={{ fontSize: '10px', color: '#71717a', fontStyle: 'italic' }}>
              {(task.start_date || task.due_date) ? t('projects.modal.usingTaskDates') : t('projects.modal.usingProjectDates')}
            </span>
          )}
        </div>
      )}
      {isWaterPhase && (
        <div style={{ paddingLeft: '24px', marginBottom: '8px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {DAYS.map(d => (
            <button key={d.key} onClick={() => toggleDay(d.key)}
              style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: (task.repeat_days || []).includes(d.key) ? stage.dot : '#f4f4f5', color: (task.repeat_days || []).includes(d.key) ? '#fff' : '#71717a', transition: 'all .15s' }}>
              {d.label}
            </button>
          ))}
        </div>
      )}
      {projectMissingDates && (
        <div style={{ paddingLeft: '24px', marginBottom: '8px', fontSize: '10.5px', color: '#b45309', background: '#fef3c7', borderRadius: '6px', padding: '4px 8px', display: 'inline-block', marginLeft: '24px' }}>
          {t('projects.modal.noPeriodWarning')}
        </div>
      )}
    </div>
  )
}

function TaskTab({ tasks, project, stage, onAdd, onUpdate, onDelete, isWaterPhase }) {
  const { t } = useTranslation()
  const inputRefs = useRef({})

  async function addNew() {
    const x = await onAdd({})
    if (x) setTimeout(() => inputRefs.current[x.id]?.focus(), 80)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tasks.map(x => (
          <TaskRow key={x.id} task={x} project={project} stage={stage} onUpdate={onUpdate} onDelete={onDelete}
            onEnter={addNew} inputRef={el => { inputRefs.current[x.id] = el }}
            isWaterPhase={isWaterPhase} />
        ))}
      </div>
      <button onClick={addNew}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: '10px 0 0', transition: 'color .15s' }}
        onMouseEnter={e => e.currentTarget.style.color = stage.dot}
        onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `1.5px dashed ${stage.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: stage.dot }}>+</div>
        {t('projects.tasks.addTask')}
      </button>
    </div>
  )
}

function HarvestTab({ form, tasks, project, stage, onUpdate, onAdd, onUpdateTask, onDeleteTask }) {
  const { t } = useTranslation()
  return (
    <div>
      <Field label={t('projects.modal.fields.finalActivities')}>
        <TaskTab tasks={tasks} project={project} stage={stage} onAdd={onAdd} onUpdate={onUpdateTask} onDelete={onDeleteTask} isWaterPhase={false} />
      </Field>
      <Field label={t('projects.modal.fields.reflection')}>
        <textarea value={form.harvest_notes} onChange={e => onUpdate('harvest_notes', e.target.value)}
          placeholder={t('projects.modal.fields.reflectionPh')}
          rows={7} style={{ ...inputStyle, border: `1px solid #e4e4e7`, borderRadius: '10px', padding: '10px 12px', background: stage.bg, borderBottom: `1px solid #e4e4e7` }} />
      </Field>
    </div>
  )
}

export default function ProjectModal({ project, tasks, initialTab, onClose, onUpdate, onDelete, onAddTask, onUpdateTask, onDeleteTask }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(initialTab || project.stage || 'soil')
  const [form, setForm] = useState({
    title:              project.title || '',
    why:                project.why || '',
    success:            project.success || '',
    how:                project.how || '',
    start_date:         project.start_date || '',
    end_date:           project.end_date || '',
    harvest_notes:      project.harvest_notes || '',
    smart_specific:     project.smart_specific || '',
    smart_measurable:   project.smart_measurable || '',
    smart_attainable:   project.smart_attainable || '',
    smart_relevant:     project.smart_relevant || '',
  })
  const [savedFlash, setSavedFlash] = useState(false)
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])

  const stage = STAGES.find(s => s.key === tab) || STAGES[0]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function upd(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function persist() { await onUpdate(formRef.current) }

  async function handleClose() {
    await persist()
    onClose()
  }

  async function handleAdvanceTab() {
    await persist()
    playProgress()
    setTab(NEXT_TAB[tab])
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200)
  }

  async function handleFinalSave() {
    await persist()
    setSavedFlash(true)
    setTimeout(() => onClose(), 600)
  }

  const plantTasks   = tasks.filter(x => x.phase === 'plant')
  const waterTasks   = tasks.filter(x => x.phase === 'water')
  const harvestTasks = tasks.filter(x => x.phase === 'harvest')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px 16px', overflowY: 'auto', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div style={{ width: '100%', maxWidth: '680px', background: '#fff', borderRadius: '20px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', animation: 'pmSlide .22s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f4f4f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <input value={form.title} onChange={e => upd('title', e.target.value)} placeholder={t('projects.modal.namePlaceholder')}
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '17px', fontWeight: 700, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={handleClose} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f4f4f5', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {STAGES.map(s => (
              <button key={s.key} onClick={async () => { await persist(); setTab(s.key) }}
                style={{ padding: '5px 13px', borderRadius: '20px', border: 'none', background: tab === s.key ? s.dot : '#f4f4f5', color: tab === s.key ? '#fff' : '#71717a', fontSize: '11px', fontWeight: tab === s.key ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s' }}>
                {t(`projects.stages.${s.key}`)}
              </button>
            ))}
            {/* SMART tab */}
            <button onClick={async () => { await persist(); setTab('smart') }}
              style={{ padding: '5px 13px', borderRadius: '20px', border: 'none',
                background: tab === 'smart' ? '#15803d' : '#f4f4f5',
                color: tab === 'smart' ? '#fff' : (isSmartComplete(form) ? '#15803d' : '#71717a'),
                fontSize: '11px', fontWeight: tab === 'smart' ? 700 : (isSmartComplete(form) ? 700 : 400),
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s' }}>
              {isSmartComplete(form) ? 'SMART ✓' : 'SMART'}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '10px', lineHeight: 1.4, fontStyle: 'italic' }}>
            {t(`projects.modal.descriptions.${tab}`)}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
          {tab === 'soil'  && <SoilTab form={form} onUpdate={upd} />}
          {tab === 'plant' && (
            <TaskTab tasks={plantTasks} project={project} stage={stage} isWaterPhase={false}
              onAdd={d => onAddTask('plant', d)} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          )}
          {tab === 'water' && (
            <TaskTab tasks={waterTasks} project={project} stage={stage} isWaterPhase={true}
              onAdd={d => onAddTask('water', d)} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          )}
          {tab === 'harvest' && (
            <HarvestTab form={form} tasks={harvestTasks} project={project} stage={stage} onUpdate={upd}
              onAdd={d => onAddTask('harvest', d)} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
          )}
          {tab === 'smart' && <SmartTab form={form} onUpdate={upd} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAF9', flexShrink: 0 }}>
          <button onClick={() => { if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}
            style={{ padding: '6px 14px', border: '0.5px solid #fca5a5', borderRadius: '20px', background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('projects.modal.delete')}
          </button>
          {tab !== 'harvest' ? (
            <button onClick={handleAdvanceTab}
              style={{ padding: '7px 20px', border: 'none', borderRadius: '20px', background: savedFlash ? '#22c55e' : stage.dot, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .3s', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {savedFlash ? t('projects.modal.savedShort') : `${t(`projects.stages.${NEXT_TAB[tab]}`)} →`}
            </button>
          ) : (
            <button onClick={handleFinalSave}
              style={{ padding: '7px 22px', border: 'none', borderRadius: '20px', background: savedFlash ? '#22c55e' : '#1A3A1F', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .3s' }}>
              {savedFlash ? t('projects.modal.saved') : t('projects.modal.save')}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes pmSlide{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}
