import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjects } from '../../hooks/useProjects'
import KanbanBoard, { STAGES, NewProjectForm } from '../../components/projects/KanbanBoard'
import ProjectModal from '../../components/projects/ProjectModal'
import { playCheck, playCelebration, playProgress } from '../../lib/sounds'
import { hasRecurrence, totalOccurrences, computeCheckUpdate, computeProgress } from '../../lib/recurring'

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

function ListView({ projects, tasks, addProject, updateTask, onOpenModal }) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)

  async function handleCreate(form) {
    const created = await addProject({ ...form, stage: 'soil' })
    setCreating(false)
    if (created) onOpenModal(created.id, 'soil')
  }

  return (
    <div style={{ padding: '1rem 1.25rem 2rem', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setCreating(true)}
          style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px dashed ${STAGES[0].color}`, background: 'transparent', color: STAGES[0].color, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = STAGES[0].bg; e.currentTarget.style.borderStyle = 'solid' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed' }}>
          {t('projects.newProject')}
        </button>
      </div>

      {creating && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 16px' }}
          onClick={e => { if (e.target === e.currentTarget) setCreating(false) }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <NewProjectForm onSave={handleCreate} onCancel={() => setCreating(false)} stage={STAGES[0]} />
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#a1a1aa', fontSize: '14px' }}>
          {t('projects.noProjects')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '760px' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', letterSpacing: '0.08em', color: '#52525b', fontWeight: 700, borderBottom: '1px solid #f4f4f5', position: 'sticky', left: 0, background: '#fff', minWidth: '180px' }}>{t('projects.list.projectHeader')}</th>
                {STAGES.map(s => (
                  <th key={s.key} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '12px', letterSpacing: '0.08em', color: '#52525b', fontWeight: 700, borderBottom: '1px solid #f4f4f5', minWidth: '200px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                      {t(`projects.stages.${s.key}`).toUpperCase()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const pTasks = tasks.filter(t => t.project_id === p.id)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '14px 16px', position: 'sticky', left: 0, background: '#fff', verticalAlign: 'top' }}>
                      <div onClick={() => onOpenModal(p.id)}
                        style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a1a', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', textDecorationThickness: '1px', textUnderlineOffset: '2px', transition: 'text-decoration-color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.textDecorationColor = '#3f3f46'}
                        onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}>
                        {p.title || t('projects.untitled')}
                      </div>
                      <div style={{ fontSize: '12px', color: STAGES.find(s => s.key === p.stage)?.dot || '#a1a1aa', marginTop: '3px', fontWeight: 600 }}>
                        {t(`projects.stages.${p.stage}`)}
                      </div>
                      {(p.start_date || p.end_date) && (
                        <div style={{ fontSize: '12px', color: '#71717a', marginTop: '3px' }}>
                          {p.start_date ? fmtDate(p.start_date) : '?'} → {p.end_date ? fmtDate(p.end_date) : '?'}
                        </div>
                      )}
                    </td>
                    {STAGES.map(s => {
                      const sTasks = pTasks.filter(t => t.phase === s.key)
                      const { done, total: progTotal, pct } = computeProgress(sTasks, p)
                      const isActive = p.stage === s.key
                      return (
                        <td key={s.key} style={{ padding: '14px 18px', verticalAlign: 'top', background: isActive ? s.bg + '55' : 'transparent' }}>
                          {s.key === 'soil' ? (
                            <div>
                              {p.why && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '2px' }}>{t('projects.soil.why')}</div>
                                  <div style={{ fontSize: '13px', color: '#3f3f46', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.why}</div>
                                </div>
                              )}
                              {p.success && (
                                <div>
                                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: '2px' }}>{t('projects.soil.success')}</div>
                                  <div style={{ fontSize: '13px', color: '#3f3f46', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.success}</div>
                                </div>
                              )}
                              {!p.why && !p.success && <span style={{ fontSize: '13px', color: '#e4e4e7' }}>—</span>}
                            </div>
                          ) : (
                            <div>
                              {sTasks.length > 0 ? (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{done}/{progTotal}</span>
                                    <span style={{ fontSize: '11px', color: s.dot, fontWeight: 700 }}>{pct}%</span>
                                  </div>
                                  <div style={{ height: '4px', background: '#f4f4f5', borderRadius: '2px', marginBottom: '8px' }}>
                                    <div style={{ height: '100%', background: s.dot, width: `${pct}%`, borderRadius: '2px', transition: 'width .3s' }} />
                                  </div>
                                  {sTasks.map(t => {
                                    const days = hasRecurrence(t)
                                    const tot = days ? totalOccurrences(t, p) : null
                                    const cnt = t.completed_count || 0
                                    return (
                                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                                        <div onClick={() => {
                                          const [changes] = computeCheckUpdate(t, p)
                                          updateTask(t.id, changes)
                                          if (!t.completed) playCheck()
                                        }}
                                          style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1.5px solid ${t.completed ? s.dot : '#d4d4d8'}`, background: t.completed ? s.dot : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                          {t.completed && <span style={{ fontSize: '8px', color: '#fff' }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '13px', color: t.completed ? '#a1a1aa' : '#3f3f46', textDecoration: t.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', flex: 1 }}>{t.title}</span>
                                        {days ? (
                                          <span style={{ fontSize: '11px', color: s.dot, fontWeight: 700, flexShrink: 0, background: s.bg, borderRadius: '10px', padding: '2px 7px' }}>
                                            {cnt}/{tot === null ? '?' : tot}
                                          </span>
                                        ) : t.due_date && (
                                          <span style={{ fontSize: '11px', color: '#a1a1aa', flexShrink: 0 }}>{fmtDate(t.due_date)}</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </>
                              ) : (
                                <span style={{ fontSize: '13px', color: '#e4e4e7' }}>—</span>
                              )}
                              {s.key === 'harvest' && p.harvest_notes && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#52525b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', borderTop: '1px solid #f4f4f5', paddingTop: '6px' }}>
                                  {p.harvest_notes}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ProjectsTab() {
  const { t } = useTranslation()
  const data = useProjects()
  const [view, setView] = useState('kanban')
  const [modalState, setModalState] = useState(null) // { id, initialTab }

  function openModal(id, initialTab) { setModalState({ id, initialTab }) }
  function closeModal() { setModalState(null) }

  async function updateTaskWithCelebration(taskId, changes) {
    const before = data.tasks.find(t => t.id === taskId)
    await data.updateTask(taskId, changes)
    if (!before) return
    const justCompleted = changes.completed === true && !before.completed
    if (!justCompleted) return
    const project = data.projects.find(p => p.id === before.project_id)
    if (!project) return

    const stages = ['soil', 'plant', 'water', 'harvest']
    const currentIdx = stages.indexOf(project.stage)
    const taskIdx = stages.indexOf(before.phase)
    let newIdx = currentIdx

    // Rule 1: if the checked task is in a later phase than current, jump to that phase
    if (taskIdx > newIdx) newIdx = taskIdx

    // Rule 2: if all tasks of the (new or current) target phase are done, advance one more
    const checkPhase = stages[newIdx]
    const phaseTasks = data.tasks.filter(t => t.project_id === project.id && t.phase === checkPhase)
    const allDone = phaseTasks.length > 0 && phaseTasks.every(t => t.id === taskId ? true : t.completed)
    if (allDone && checkPhase !== 'harvest') {
      newIdx = Math.min(newIdx + 1, stages.length - 1)
    }

    if (newIdx !== currentIdx) {
      await data.updateProject(project.id, { stage: stages[newIdx] })
      playProgress()
    }

    if (checkPhase === 'harvest' && allDone) playCelebration()
  }
  const dataWithCelebration = { ...data, updateTask: updateTaskWithCelebration }

  const modalProject = modalState ? data.projects.find(p => p.id === modalState.id) : null
  const modalTasks   = modalState ? data.tasks.filter(t => t.project_id === modalState.id) : []

  if (data.loading) {
    return <div style={{ padding: '3rem 1.5rem', color: '#a1a1aa', fontSize: '13px', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>{t('projects.loading')}</div>
  }

  return (
    <div style={{ minHeight: '100%', background: '#FAFAF9', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.25rem 0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A3A1F', margin: 0, letterSpacing: '-0.02em' }}>{t('projects.title')}</h2>
          {data.projects.length > 0 && (
            <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '2px 0 0' }}>{t('projects.count', { count: data.projects.length })}</p>
          )}
        </div>
        <div style={{ display: 'flex', background: '#f4f4f5', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {['kanban', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '4px 14px', borderRadius: '8px', border: 'none', background: view === v ? '#fff' : 'transparent', color: view === v ? '#1A3A1F' : '#71717a', fontSize: '12px', fontWeight: view === v ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}>
              {t(`projects.view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {view === 'kanban'
        ? <KanbanBoard {...dataWithCelebration} onOpenModal={openModal} />
        : <ListView projects={data.projects} tasks={data.tasks} addProject={data.addProject} updateTask={updateTaskWithCelebration} onOpenModal={openModal} />
      }

      {modalProject && (
        <ProjectModal
          project={modalProject}
          tasks={modalTasks}
          initialTab={modalState.initialTab}
          onClose={closeModal}
          onUpdate={changes => data.updateProject(modalState.id, changes)}
          onDelete={() => { data.deleteProject(modalState.id); closeModal() }}
          onAddTask={(phase, d) => data.addTask(modalState.id, phase, d)}
          onUpdateTask={updateTaskWithCelebration}
          onDeleteTask={data.deleteTask}
        />
      )}
    </div>
  )
}
