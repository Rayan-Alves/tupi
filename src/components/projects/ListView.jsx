import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { computeProgress } from '../../lib/recurring'
import { STAGES, stageLabel } from './KanbanBoard'

const CSS = `
.lv-toolbar { display:flex; justify-content:space-between; align-items:center; gap:18px; flex-wrap:wrap; padding: 0 40px 14px; }
.lv-toolbar__group { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.lv-toolbar__label { font-size:10px; color: var(--ink-mute); font-family: 'Courier Prime', monospace; text-transform: uppercase; letter-spacing: 0.08em; }
.lv-pill { background:transparent; border:0; padding:5px 12px; border-radius:999px; color: var(--ink-mute);
  font-family:'Courier Prime', monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.08em; cursor:pointer; }
.lv-pill.is-active { background: var(--ink); color: var(--bg-sand); }

.lv-table { margin: 0 40px 40px; border-top:1px solid var(--rule); }
.lv-row { display:grid; grid-template-columns: 2.1fr 1fr 1.2fr 1.6fr 1fr 0.7fr 1.2fr;
  gap:18px; align-items:center; padding: 14px 12px 14px 18px; border-bottom: 1px solid var(--rule-soft);
  position:relative; cursor:pointer; transition: background .15s; }
.lv-row:hover { background: var(--bg-paper); }
.lv-row::before { content:""; position:absolute; left:0; top:8px; bottom:8px; width:2px; background:transparent; transition: background .15s; }
.lv-row:hover::before { background: var(--stage); }
.lv-row--head { font-family:'Courier Prime', monospace; font-size:9.5px;
  text-transform:uppercase; letter-spacing:0.1em; color: var(--ink-mute); cursor:default;
  border-bottom: 1px solid var(--rule); }
.lv-row--head:hover { background: transparent; }
.lv-row--head::before { display:none; }

.lv-cell--name { display:flex; align-items:center; gap:10px; min-width:0; }
.lv-row__glyph { color: var(--stage); flex:0 0 auto; display:inline-flex; }
.lv-row__title { font-family:'Cormorant Garamond', serif; font-size:19px; font-weight:500; color:var(--ink);
  margin:0; line-height:1.15; word-break: break-word; }

.lv-stage { display:inline-flex; align-items:center; gap:6px;
  padding:4px 10px 4px 8px; border-radius:999px;
  background: var(--stage-soft); border: 1px solid var(--stage-tint);
  color: var(--stage-deep); font-family:'Courier Prime', monospace;
  font-size:9.5px; text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap; }
.lv-stage__glyph { color: var(--stage); display:inline-flex; }

.lv-progress { display:flex; flex-direction:column; gap:5px; min-width:80px; }
.lv-progress__track { height:4px; background: var(--rule-soft); border-radius:999px; position:relative; overflow:hidden; }
.lv-progress__fill { position:absolute; inset:0 auto 0 0; background: var(--stage); border-radius:999px; transition: width .3s; }
.lv-progress__meta { display:flex; align-items:baseline; gap:6px; font-size:10px;
  font-family:'Courier Prime', monospace; text-transform:uppercase; letter-spacing:0.08em; color: var(--ink-mute); }
.lv-progress__meta strong { color: var(--stage-deep); font-weight:700; }

.lv-next { display:flex; flex-direction:column; gap:3px; min-width:0; }
.lv-next__txt { font-size:14px; font-style:italic; color: var(--ink-soft);
  font-family:'Cormorant Garamond', serif; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lv-next__due { font-size:9.5px; color: var(--ink-faint); font-family:'Courier Prime', monospace;
  text-transform:uppercase; letter-spacing:0.08em; }

.lv-range { display:inline-flex; align-items:center; gap:6px; font-size:10px;
  font-family:'Courier Prime', monospace; text-transform:uppercase; letter-spacing:0.08em; color: var(--ink-mute); }
.lv-range__arrow { color: var(--ink-faint); }
.lv-dim { color: var(--ink-faint); }
.lv-italic { font-style:italic; }

.lv-cell--updated { font-size:10px; color: var(--ink-mute); font-family:'Courier Prime', monospace; text-transform:uppercase; letter-spacing:0.08em; }
.lv-cell--actions { display:flex; align-items:center; justify-content:flex-end; gap:10px; }
.lv-action--delete { background:none; border:0; cursor:pointer; font-size:10px;
  color: var(--ink-faint); opacity:0; transition: opacity .15s, color .15s;
  font-family:'Courier Prime', monospace; text-transform:lowercase; letter-spacing:0.08em; }
.lv-row:hover .lv-action--delete { opacity: 1; }
.lv-action--delete:hover { color:#b14a4a; }
.lv-action--advance { background:none; border:1px solid var(--rule); border-radius:999px;
  padding:5px 12px; color: var(--stage-deep); font-family:'Cormorant Garamond', serif;
  font-style:italic; font-size:13px; cursor:pointer; display:inline-flex; gap:6px; align-items:center; transition: border-color .15s; white-space:nowrap; }
.lv-action--advance:hover { border-color: var(--stage); }
.lv-action--advance:disabled { opacity:0.4; cursor:not-allowed; }
.lv-action__arrow { font-family:'Courier Prime', monospace; font-style:normal; font-size:12px; }
.lv-action--done { font-size:10px; letter-spacing:0.12em; color: var(--harvest-deep);
  font-family:'Courier Prime', monospace; text-transform:uppercase; }

.lv-groupHead { display:flex; align-items:center; gap:10px; padding: 18px 12px 8px 18px;
  border-bottom:1px solid var(--rule-soft); }
.lv-groupHead__glyph { color: var(--stage); display:inline-flex; }
.lv-groupHead__roman { font-family:'Cormorant Garamond', serif; font-style:italic; font-size:22px; color: var(--stage); font-weight:500; }
.lv-groupHead__label { font-size:10px; letter-spacing:0.14em; color: var(--stage-deep);
  font-family:'Courier Prime', monospace; text-transform:uppercase; }
.lv-groupHead__count { margin-left:auto; font-size:10px; color: var(--ink-mute);
  font-family:'Courier Prime', monospace; }

.lv-empty { padding: 60px 40px; text-align:center; color: var(--ink-mute);
  font-family:'Cormorant Garamond', serif; font-style:italic; font-size: 18px; }

@media (max-width: 880px) {
  .lv-table { margin: 0 20px 30px; }
  .lv-toolbar { padding: 0 20px 12px; }
  .lv-row { grid-template-columns: 1fr; gap:8px; padding: 14px 12px; }
  .lv-row--head { display:none; }
  .lv-cell--actions { justify-content: flex-start; }
}
`

function injectStyles() {
  const id = 'lv-revamp-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

function GlyphInline({ stage, size = 14 }) {
  const props = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (stage) {
    case 'soil':    return <svg {...props}><path d="M2 12 Q 9 7.5 16 12" /><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" /><path d="M9 10 V 13.5" /><path d="M5.5 13 H 12.5" opacity="0.5" strokeDasharray="1 2" /></svg>
    case 'plant':   return <svg {...props}><path d="M9 16 V 7" /><path d="M9 10.5 Q 4 10.5 3 7 Q 7 6 9 10.5 Z" fill="currentColor" fillOpacity="0.15" /><path d="M9 8.5 Q 14 8.5 15 5 Q 11 4 9 8.5 Z" fill="currentColor" fillOpacity="0.15" /></svg>
    case 'water':   return <svg {...props}><path d="M9 2.5 C 6 6, 4.5 9, 4.5 11.2 A 4.5 4.5 0 0 0 13.5 11.2 C 13.5 9, 12 6, 9 2.5 Z" fill="currentColor" fillOpacity="0.14" /><path d="M6.5 11 Q 8 12.5 9.5 11" opacity="0.7" /></svg>
    case 'harvest': return <svg {...props}><path d="M9 16 V 3" /><path d="M9 12 L 5.5 10 M 9 12 L 12.5 10" /><path d="M9 9 L 5.5 7 M 9 9 L 12.5 7" /><path d="M9 6 L 6.5 4 M 9 6 L 11.5 4" /></svg>
    default: return null
  }
}

function stageVarsCSS(stage) {
  const s = STAGES.find(x => x.key === stage)
  if (!s) return {}
  return { '--stage': s.color, '--stage-deep': s.deep, '--stage-tint': s.tint, '--stage-soft': s.soft, '--stage-tint-2': s.tint2 }
}

const STAGE_ROMAN = { soil: 'I', plant: 'II', water: 'III', harvest: 'IV' }

function fmtShort(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function nextTaskOf(project, tasks) {
  const pending = tasks.filter(t => t.project_id === project.id && !t.completed && t.phase === project.stage)
  if (!pending.length) return null
  // Sort by due_date
  pending.sort((a, b) => (a.due_date || 'zz').localeCompare(b.due_date || 'zz'))
  return pending[0]
}

function tasksForProject(project, tasks) {
  return tasks.filter(t => t.project_id === project.id && t.phase === project.stage)
}

function NextTaskCell({ project, tasks, t }) {
  if (project.stage === 'soil') return <span className="lv-dim lv-italic">{t('projects.listView.waiting')}</span>
  if (project.stage === 'harvest') return <span className="lv-cell--updated" style={{ color: 'var(--harvest-deep)' }}>{t('projects.listView.complete')}</span>
  const nt = nextTaskOf(project, tasks)
  if (!nt) return <span className="lv-dim">—</span>
  return (
    <div className="lv-next">
      <span className="lv-next__txt">{nt.title || '—'}</span>
      {nt.due_date && <span className="lv-next__due">{fmtShort(nt.due_date)}</span>}
    </div>
  )
}

function ListRow({ project, tasks, onOpen, onDelete, onAdvance, canAdvance, t }) {
  const phTasks = tasksForProject(project, tasks)
  const { done, total } = computeProgress(phTasks, project)
  const nextIdx = STAGES.findIndex(s => s.key === project.stage) + 1
  const nextStage = STAGES[nextIdx]
  const updated = project.updated_at
    ? fmtShort(project.updated_at.split('T')[0])
    : ''

  return (
    <div className="lv-row" style={stageVarsCSS(project.stage)} onClick={onOpen}>
      <div className="lv-cell lv-cell--name">
        <span className="lv-row__glyph"><GlyphInline stage={project.stage} /></span>
        <h3 className="lv-row__title">{project.title || t('projects.untitled')}</h3>
      </div>
      <div className="lv-cell">
        <span className="lv-stage" style={stageVarsCSS(project.stage)}>
          <span className="lv-stage__glyph"><GlyphInline stage={project.stage} size={11} /></span>
          {t(`projects.stages.${project.stage}`)}
        </span>
      </div>
      <div className="lv-cell">
        {total > 0 ? (
          <div className="lv-progress" style={stageVarsCSS(project.stage)}>
            <div className="lv-progress__track">
              <div className="lv-progress__fill" style={{ width: `${Math.round((done / total) * 100)}%` }} />
            </div>
            <div className="lv-progress__meta">
              <span><strong>{done}</strong>/{total}</span>
              <span className="lv-dim">·</span>
              <span>{Math.round((done / total) * 100)}%</span>
            </div>
          </div>
        ) : <span className="lv-dim">—</span>}
      </div>
      <div className="lv-cell">
        <NextTaskCell project={project} tasks={tasks} t={t} />
      </div>
      <div className="lv-cell">
        {(project.start_date || project.end_date) ? (
          <span className="lv-range">
            <span>{fmtShort(project.start_date) || '?'}</span>
            <span className="lv-range__arrow">→</span>
            <span>{fmtShort(project.end_date) || '?'}</span>
          </span>
        ) : <span className="lv-dim">—</span>}
      </div>
      <div className="lv-cell lv-cell--updated">
        {updated || <span className="lv-dim">—</span>}
      </div>
      <div className="lv-cell lv-cell--actions">
        <button className="lv-action--delete" onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}>del</button>
        {nextStage ? (
          <button
            className="lv-action--advance"
            style={stageVarsCSS(project.stage)}
            disabled={!canAdvance}
            onClick={e => { e.stopPropagation(); if (canAdvance) onAdvance() }}
            title={!canAdvance ? t('projects.card.blockedHint') : ''}
          >
            {t(`projects.stages.${nextStage.key}`)} <span className="lv-action__arrow">→</span>
          </button>
        ) : (
          <span className="lv-action--done">✓</span>
        )}
      </div>
    </div>
  )
}

const KEYS = STAGES.map(s => s.key)

export default function ListView({ projects, tasks, updateProject, deleteProject, onOpenModal }) {
  const { t } = useTranslation()

  useEffect(() => { injectStyles() }, [])

  function canAdvance(project) {
    const idx = KEYS.indexOf(project.stage)
    if (idx >= KEYS.length - 1) return false
    if (project.stage === 'plant' || project.stage === 'water') {
      const ts = tasks.filter(x => x.project_id === project.id && x.phase === project.stage)
      return ts.length > 0 && ts.every(x => x.completed)
    }
    return true
  }

  async function handleAdvance(project) {
    const idx = KEYS.indexOf(project.stage)
    const next = STAGES[idx + 1]
    if (next) await updateProject(project.id, { stage: next.key })
  }

  if (projects.length === 0) {
    return (
      <div className="kb-root">
        <div className="lv-empty">{t('projects.listView.noProjects')}</div>
      </div>
    )
  }

  return (
    <div className="kb-root">
      <div className="lv-toolbar">
        <div className="lv-toolbar__group">
          <span className="lv-toolbar__label">{t('projects.listView.group')}</span>
          <button className="lv-pill is-active">{t('projects.listView.byStage')}</button>
        </div>
      </div>
      <div className="lv-table">
        <div className="lv-row lv-row--head">
          <div className="lv-cell lv-cell--name">{t('projects.listView.headers.project')}</div>
          <div className="lv-cell">{t('projects.listView.headers.stage')}</div>
          <div className="lv-cell">{t('projects.listView.headers.progress')}</div>
          <div className="lv-cell">{t('projects.listView.headers.nextTask')}</div>
          <div className="lv-cell">{t('projects.listView.headers.period')}</div>
          <div className="lv-cell">{t('projects.listView.headers.updated')}</div>
          <div className="lv-cell"></div>
        </div>
        {STAGES.map(s => {
          const rows = projects.filter(p => p.stage === s.key)
          if (!rows.length) return null
          return (
            <div key={s.key}>
              <div className="lv-groupHead" style={stageVarsCSS(s.key)}>
                <span className="lv-groupHead__glyph"><GlyphInline stage={s.key} /></span>
                <span className="lv-groupHead__roman">{STAGE_ROMAN[s.key]}</span>
                <span className="lv-groupHead__label">{t(`projects.stages.${s.key}`)}</span>
                <span className="lv-groupHead__count">{String(rows.length).padStart(2, '0')}</span>
              </div>
              {rows.map(p => (
                <ListRow
                  key={p.id} project={p} tasks={tasks} t={t}
                  onOpen={() => onOpenModal(p.id)}
                  onDelete={() => deleteProject(p.id)}
                  onAdvance={() => handleAdvance(p)}
                  canAdvance={canAdvance(p)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
