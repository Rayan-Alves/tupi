import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { playProgress } from '../../lib/sounds'
import { isRecurringTracked, totalOccurrences, computeCheckUpdate, computeProgress } from '../../lib/recurring'

export const STAGES = [
  { key: 'soil',    color: '#C4A882', bg: '#FDF6EC', hdr: '#FAF0E0', text: '#633806', dot: '#C8841A' },
  { key: 'plant',   color: '#8AAB8E', bg: '#EDF3EE', hdr: '#E4F0E6', text: '#1A3A1F', dot: '#3B6D11' },
  { key: 'water',   color: '#7BA7CC', bg: '#EBF3FB', hdr: '#E0EEF8', text: '#1A3060', dot: '#3B6DC4' },
  { key: 'harvest', color: '#D4A826', bg: '#FEFBE8', hdr: '#FEF7D6', text: '#5A3A00', dot: '#D4890A' },
]
const KEYS = STAGES.map(s => s.key)
export const stageLabel = (key, t) => t(`projects.stages.${key}`)

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}

function isOverdue(task) {
  if (!task.due_date || task.completed) return false
  return new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString())
}

function Progress({ done, total, dot }) {
  const pct = total ? Math.round(done / total * 100) : 0
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{done}/{total}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: dot }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: '#f4f4f5', borderRadius: '2px' }}>
        <div style={{ height: '100%', background: dot, width: `${pct}%`, borderRadius: '2px', transition: 'width .3s' }} />
      </div>
    </div>
  )
}

function TaskCheck({ task, project, stage, onCheck }) {
  const [flashing, setFlashing] = useState(false)
  const prevCount = useRef(task.completed_count || 0)
  useEffect(() => {
    const newCount = task.completed_count || 0
    if (newCount > prevCount.current) {
      setFlashing(true)
      const tm = setTimeout(() => setFlashing(false), 650)
      prevCount.current = newCount
      return () => clearTimeout(tm)
    }
    prevCount.current = newCount
  }, [task.completed_count])

  const hasDays = !!task.repeat_days?.length
  const total = hasDays ? totalOccurrences(task, project) : null
  const count = task.completed_count || 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px',
      background: flashing ? '#bbf7d0' : 'transparent',
      borderRadius: '6px', padding: '2px 4px', margin: '0 -4px 5px',
      transition: 'background .45s',
    }}
      onClick={e => { e.stopPropagation(); onCheck(task) }}>
      <div style={{
        width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${task.completed ? stage.dot : (flashing ? '#22c55e' : '#d4d4d8')}`,
        background: task.completed ? stage.dot : (flashing ? '#22c55e' : 'transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
      }}>
        {(task.completed || flashing) && <span style={{ fontSize: '8px', color: '#fff', lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{
        fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: task.completed ? '#a1a1aa' : (isOverdue(task) ? '#ef4444' : '#3f3f46'),
        textDecoration: task.completed ? 'line-through' : 'none',
      }}>{task.title || '—'}</span>
      {hasDays ? (
        <span style={{ fontSize: '10px', color: stage.dot, fontWeight: 700, flexShrink: 0, background: stage.bg, borderRadius: '10px', padding: '1px 6px' }}>
          {count}/{total === null ? '?' : total}
        </span>
      ) : task.due_date && (
        <span style={{ fontSize: '9px', color: isOverdue(task) ? '#ef4444' : '#a1a1aa', flexShrink: 0 }}>
          {fmtDate(task.due_date)}
        </span>
      )}
    </div>
  )
}

function CardBody({ project, pTasks, stage, onCheck }) {
  const { t } = useTranslation()
  const MAX = 4
  const phase = stage.key
  const phTasks = pTasks.filter(x => x.phase === phase)
  const visible = phTasks.slice(0, MAX)
  const hidden = phTasks.length - MAX
  const { done, total: progTotal } = computeProgress(phTasks, project)

  if (phase === 'soil') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {project.why && (
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '2px' }}>{t('projects.soil.why')}</div>
            <div style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.why}</div>
          </div>
        )}
        {project.success && (
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '2px' }}>{t('projects.soil.success')}</div>
            <div style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.success}</div>
          </div>
        )}
        {!project.why && !project.success && (
          <div style={{ fontSize: '11px', color: '#d4d4d8', fontStyle: 'italic' }}>{t('projects.soil.doubleClickHint')}</div>
        )}
      </div>
    )
  }

  return (
    <div>
      {phTasks.length > 0 && <Progress done={done} total={progTotal} dot={stage.dot} />}
      {visible.map(x => <TaskCheck key={x.id} task={x} project={project} stage={stage} onCheck={onCheck} />)}
      {hidden > 0 && <div style={{ fontSize: '10px', color: '#a1a1aa', paddingLeft: '21px' }}>{t('projects.tasks.more', { count: hidden })}</div>}
      {phTasks.length === 0 && <div style={{ fontSize: '11px', color: '#d4d4d8', fontStyle: 'italic' }}>{t('projects.tasks.addHint')}</div>}
      {phase === 'harvest' && project.harvest_notes && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: '#52525b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.harvest_notes}
        </div>
      )}
    </div>
  )
}

function AutoGrowTextarea({ id, value, onChange, placeholder, onKeyDown, stage, autoFocus }) {
  const ref = useRef(null)
  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
  useEffect(() => { resize() }, [value])
  return (
    <textarea id={id} ref={ref} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      autoFocus={autoFocus} rows={1}
      style={{ width: '100%', border: 'none', borderBottom: `1px solid ${stage.color}66`, background: 'transparent', fontSize: '12px', color: '#1a1a1a', padding: '3px 0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5, overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }} />
  )
}

export function NewProjectForm({ onSave, onCancel, stage = STAGES[0] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', why: '', success: '' })
  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function advanceTo(nxt) {
    return e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (e.target.value.trim()) document.getElementById('nf-' + nxt)?.focus() }
      if (e.key === 'Escape') onCancel()
    }
  }
  function submitOnEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (form.title.trim()) onSave(form) }
    if (e.key === 'Escape') onCancel()
  }
  return (
    <div style={{ background: '#fff', border: `1px solid ${stage.color}`, borderLeft: `3px solid ${stage.color}`, borderRadius: '12px', padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', position: 'relative' }}>
      <button onClick={onCancel} aria-label={t('projects.form.cancel')}
        style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: '#f4f4f5', border: 'none', color: '#71717a', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
      <div style={{ marginBottom: '10px', paddingRight: '28px' }}>
        <input id="nf-title" autoFocus value={form.title} onChange={e => upd('title', e.target.value)}
          placeholder={t('projects.form.name')} onKeyDown={advanceTo('why')}
          style={{ width: '100%', border: 'none', borderBottom: `1px solid ${stage.color}66`, background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#1a1a1a', padding: '3px 0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '3px' }}>{t('projects.soil.why')}</div>
        <AutoGrowTextarea id="nf-why" value={form.why} onChange={e => upd('why', e.target.value)}
          placeholder={t('projects.form.why')} onKeyDown={advanceTo('success')} stage={stage} />
      </div>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '3px' }}>{t('projects.soil.success')}</div>
        <AutoGrowTextarea id="nf-success" value={form.success} onChange={e => upd('success', e.target.value)}
          placeholder={t('projects.form.success')} onKeyDown={submitOnEnter} stage={stage} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => form.title.trim() && onSave(form)}
          style={{ padding: '6px 16px', border: 'none', borderRadius: '20px', background: form.title.trim() ? stage.dot : '#f4f4f5', color: form.title.trim() ? '#fff' : '#a1a1aa', fontSize: '12px', fontWeight: 600, cursor: form.title.trim() ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {t('projects.form.addInfo')}
        </button>
      </div>
    </div>
  )
}

export default function KanbanBoard({ projects, tasks, addProject, updateProject, deleteProject, updateTask, onOpenModal }) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)
  const clickTimers = useRef({})

  async function handleCreate(form) {
    const created = await addProject({ ...form, stage: 'soil' })
    setCreating(false)
    if (created) onOpenModal(created.id, 'soil')
  }

  function canAdvance(project) {
    const idx = KEYS.indexOf(project.stage)
    if (idx >= KEYS.length - 1) return false
    if (project.stage === 'plant') {
      const t = tasks.filter(x => x.project_id === project.id && x.phase === 'plant')
      return t.length > 0 && t.every(x => x.completed)
    }
    if (project.stage === 'water') {
      const t = tasks.filter(x => x.project_id === project.id && x.phase === 'water')
      return t.length > 0 && t.every(x => x.completed)
    }
    return true
  }

  function handleCardClick(id) {
    if (clickTimers.current[id]) {
      clearTimeout(clickTimers.current[id])
      delete clickTimers.current[id]
      onOpenModal(id)
    } else {
      clickTimers.current[id] = setTimeout(() => { delete clickTimers.current[id] }, 280)
    }
  }

  return (
    <div style={{ overflowX: 'auto', padding: '1rem 1.25rem 2rem', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content', alignItems: 'flex-start' }}>
        {STAGES.map(stage => {
          const col = projects.filter(p => p.stage === stage.key)
          return (
            <div key={stage.key} style={{ width: '268px', flexShrink: 0 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px', padding: '0 2px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: stage.dot }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.06em', flex: 1 }}>{t(`projects.stages.${stage.key}`).toUpperCase()}</span>
                <span style={{ fontSize: '11px', color: '#a1a1aa', background: '#f4f4f5', borderRadius: '10px', padding: '1px 8px' }}>{col.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '72vh', overflowY: 'auto', paddingBottom: '4px' }}>
                {col.map(project => {
                  const pTasks = tasks.filter(t => t.project_id === project.id)
                  const ok = canAdvance(project)
                  const nextStage = STAGES[KEYS.indexOf(project.stage) + 1]
                  return (
                    <div key={project.id}
                      onClick={() => handleCardClick(project.id)}
                      style={{ background: '#fff', border: `1px solid ${stage.color}55`, borderLeft: `3px solid ${stage.color}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow .2s, transform .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      {/* Card header */}
                      <div style={{ padding: '11px 13px 8px', background: stage.hdr + '88' }}>
                        <div onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}
                          style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', textDecorationThickness: '1px', textUnderlineOffset: '2px', transition: 'text-decoration-color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.textDecorationColor = stage.color}
                          onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}>
                          {project.title || t('projects.untitled')}
                        </div>
                        {(project.start_date || project.end_date) && (
                          <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '3px' }}>
                            📅 {project.start_date ? fmtDate(project.start_date) : '?'} → {project.end_date ? fmtDate(project.end_date) : '?'}
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '8px 13px', minHeight: '48px' }}>
                        <CardBody project={project} pTasks={pTasks} stage={stage} onCheck={task => {
                          const [changes] = computeCheckUpdate(task, project)
                          updateTask(task.id, changes)
                        }} />
                      </div>

                      {/* Card footer */}
                      <div style={{ padding: '7px 13px', borderTop: `1px solid ${stage.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) deleteProject(project.id) }}
                          style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#d4d4d8'}
                        >{t('projects.card.delete')}</button>
                        {nextStage ? (
                          <button
                            onClick={async e => {
                              e.stopPropagation()
                              if (!ok) return
                              playProgress()
                              await updateProject(project.id, { stage: nextStage.key })
                            }}
                            title={!ok ? t('projects.card.blockedHint') : t('projects.card.advanceTo', { stage: t(`projects.stages.${nextStage.key}`) })}
                            style={{ padding: '4px 11px', border: 'none', borderRadius: '20px', background: ok ? stage.dot : '#f4f4f5', color: ok ? '#fff' : '#a1a1aa', fontSize: '11px', fontWeight: 600, cursor: ok ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {t(`projects.stages.${nextStage.key}`)} →
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: stage.dot, fontWeight: 600 }}>{t('projects.card.harvested')}</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Add button — soil only */}
                {stage.key === 'soil' && (
                  creating
                    ? <NewProjectForm onSave={handleCreate} onCancel={() => setCreating(false)} stage={stage} />
                    : <button onClick={() => setCreating(true)}
                        style={{ width: '100%', padding: '11px', borderRadius: '12px', border: `1.5px dashed ${stage.color}`, background: 'transparent', color: stage.color, fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = stage.bg; e.currentTarget.style.borderStyle = 'solid' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed' }}>
                        +
                      </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
