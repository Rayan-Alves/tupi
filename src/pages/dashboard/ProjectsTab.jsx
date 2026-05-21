import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProjects } from '../../hooks/useProjects'
import KanbanBoard, { STAGES, NewProjectForm } from '../../components/projects/KanbanBoard'
import ProjectModal from '../../components/projects/ProjectModal'
import ProjectsTimeline from '../../components/projects/ProjectsTimeline'
import ListView from '../../components/projects/ListView'
import FluxoView from '../../components/projects/FluxoView'
import { isSmartComplete } from '../../components/projects/SmartTab'
import { playCheck, playCelebration, playProgress } from '../../lib/sounds'
import { hasRecurrence, totalOccurrences, computeCheckUpdate, computeProgress } from '../../lib/recurring'

/* ─── Helpers ─────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/* ─── Premium Project Card (used in List view) ────────────── */
function ProjectCard({ project, tasks, onOpenModal, onDelete }) {
  const { t } = useTranslation()
  const stage   = STAGES.find(s => s.key === project.stage) || STAGES[0]
  const pTasks  = tasks.filter(t => t.project_id === project.id)
  const { done, total: progTotal, pct } = computeProgress(pTasks, project)
  const smart   = isSmartComplete(project)
  const overdue = project.end_date && !project.completed &&
    new Date(project.end_date + 'T00:00:00') < new Date()

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB',
      borderTop: `3px solid ${stage.dot}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'box-shadow .2s, transform .18s',
    }}
      onClick={() => onOpenModal(project.id)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Card header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.3, flex: 1 }}>
            {project.title || t('projects.untitled')}
          </h3>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {smart && (
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', color: '#15803d', background: '#F0FDF4', padding: '2px 7px', borderRadius: 99, border: '1px solid #BBF7D0' }}>
                SMART ✓
              </span>
            )}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: stage.dot, background: stage.bg, padding: '2px 8px', borderRadius: 99 }}>
              {t(`projects.stages.${stage.key}`)}
            </span>
          </div>
        </div>

        {/* Why snippet */}
        {project.why && (
          <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.why}
          </p>
        )}

        {/* Progress */}
        {progTotal > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{done}/{progTotal} tarefas</span>
              <span style={{ fontSize: 11, color: stage.dot, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: '#F4F4F5', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: stage.dot, width: `${pct}%`, borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
          </div>
        )}

        {/* Dates */}
        {(project.start_date || project.end_date) && (
          <div style={{ fontSize: 11, color: overdue ? '#EF4444' : '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}>
            📅 {fmtDate(project.start_date)} {project.end_date ? `→ ${fmtDate(project.end_date)}` : ''}
            {overdue && <span style={{ fontWeight: 700 }}>· Prazo vencido</span>}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${stage.color}22`, background: stage.bg + '44', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete(project.id) }}
          style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#d4d4d8'}
        >
          {t('projects.card.delete')}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}
          style={{ fontSize: 11, fontWeight: 600, color: stage.dot, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Abrir →
        </button>
      </div>
    </div>
  )
}

/* ─── List View ───────────────────────────────────────────── */
// (Old inline ListView removed — replaced by imported ListView from components/projects/ListView.jsx)

/* ─── Main Tab ────────────────────────────────────────────── */
const VIEWS = [
  { id: 'kanban',   label: '⊞  Kanban' },
  { id: 'list',     label: '≡  Lista' },
  { id: 'timeline', label: '──  Timeline' },
  { id: 'fluxo',    label: '⌇  Fluxo' },
]

export default function ProjectsTab() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const data = useProjects()
  const [view, setView]         = useState('kanban')
  const [modalState, setModal]  = useState(null)
  const [creating, setCreating] = useState(false)
  const [triggerCreate, setTriggerCreate] = useState(0)

  function openModal(id, initialTab) { setModal({ id, initialTab }) }
  function closeModal() { setModal(null) }

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
    const taskIdx    = stages.indexOf(before.phase)
    let newIdx = currentIdx
    if (taskIdx > newIdx) newIdx = taskIdx
    const checkPhase = stages[newIdx]
    const phaseTasks = data.tasks.filter(t => t.project_id === project.id && t.phase === checkPhase)
    const allDone    = phaseTasks.length > 0 && phaseTasks.every(t => t.id === taskId ? true : t.completed)
    if (allDone && checkPhase !== 'harvest') newIdx = Math.min(newIdx + 1, stages.length - 1)
    if (newIdx !== currentIdx) { await data.updateProject(project.id, { stage: stages[newIdx] }); playProgress() }
    if (checkPhase === 'harvest' && allDone) playCelebration()
  }

  const dataWithCelebration = { ...data, updateTask: updateTaskWithCelebration }
  const modalProject = modalState ? data.projects.find(p => p.id === modalState.id) : null
  const modalTasks   = modalState ? data.tasks.filter(t => t.project_id === modalState.id) : []

  if (data.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#a1a1aa', fontSize: 13 }}>
        Carregando projetos…
      </div>
    )
  }

  const smartCount = data.projects.filter(p => isSmartComplete(p)).length
  const eyebrow = data.projects.length === 0
    ? 'nenhum projeto · em quatro campos'
    : `${data.projects.length} projeto${data.projects.length > 1 ? 's' : ''} · em quatro campos${smartCount > 0 ? ` · ${smartCount} smart ✓` : ''}`

  return (
    <div className="kb-root" style={{ minHeight: '100%' }}>
      {/* ─── Header (variant A) ───────────────────────────── */}
      <div className="kb-header">
        <div>
          <h1 className="kb-title">
            {t('projects.title')} <em></em>
          </h1>
          <div className="kb-eyebrow">{eyebrow}</div>
        </div>
        <div className="kb-headerR">
          <div className="kb-viewtoggle">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => setView(v.id)} className={view === v.id ? 'is-active' : ''}>
                {v.label}
              </button>
            ))}
          </div>
          <button className="kb-newbtn" onClick={() => { setView('kanban'); setTriggerCreate(c => c + 1) }}>
            novo projeto
          </button>
        </div>
      </div>

      {/* Stage chips */}
      {data.projects.length > 0 && (
        <div className="kb-chips">
          {STAGES.map(s => {
            const count = data.projects.filter(p => p.stage === s.key).length
            return (
              <span key={s.key} onClick={() => setView('kanban')}
                className="kb-chip"
                style={{ '--c': s.deep, '--bg': s.soft, cursor: 'pointer' }}
              >
                <span className="kb-chip__dot" style={{ background: s.color }} />
                {t(`projects.stages.${s.key}`)}
                <span className="kb-chip__n">· {count}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* ─── Views ────────────────────────────────────────── */}
      <div style={{ paddingTop: 16 }}>
        {view === 'kanban' && (
          <KanbanBoard {...dataWithCelebration} onOpenModal={openModal} triggerCreate={triggerCreate} />
        )}
        {view === 'list' && (
          <ListView
            projects={data.projects}
            tasks={data.tasks}
            updateProject={data.updateProject}
            deleteProject={data.deleteProject}
            onOpenModal={openModal}
          />
        )}
        {view === 'timeline' && (
          <ProjectsTimeline
            projects={data.projects}
            tasks={data.tasks}
            onOpenModal={openModal}
          />
        )}
        {view === 'fluxo' && (
          <FluxoView
            projects={data.projects}
            tasks={data.tasks}
            updateTask={updateTaskWithCelebration}
            updateProject={data.updateProject}
            addTask={data.addTask}
            deleteTask={data.deleteTask}
            addProject={data.addProject}
            deleteProject={data.deleteProject}
          />
        )}
      </div>

      {/* ─── Project Modal ────────────────────────────────── */}
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
