import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGES } from './KanbanBoard'


const CSS = `
.rm-toolbar { display:flex; justify-content:space-between; align-items:center; gap:18px; padding: 0 40px 14px; flex-wrap:wrap; }
.rm-toolbar__group { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.rm-toolbar__horizon { font-family:'Courier Prime', monospace; font-size:11px; color: var(--ink); text-transform:lowercase; letter-spacing:0.05em; }
.rm-toolbar__arrow { color: var(--ink-faint); font-family:'Courier Prime', monospace; margin: 0 4px; }

.rm-frame { margin: 0 40px 40px; border:1px solid var(--rule); border-radius: 4px; background: var(--bg-paper); overflow:hidden; }
.rm-frame__head { display:grid; grid-template-columns: 220px 1fr; border-bottom:1px solid var(--rule); }
.rm-frame__labelHead { padding: 14px 18px; font-family:'Courier Prime', monospace; font-size:10px;
  text-transform:uppercase; letter-spacing:0.12em; color: var(--ink-mute); border-right:1px solid var(--rule); }
.rm-frame__trackHead { position:relative; height:36px; }

.rm-months { position:relative; width:100%; height:100%; }
.rm-months__cell { position:absolute; top:0; height:100%; display:flex; align-items:center; justify-content:flex-start;
  padding-left:10px; font-size:10px; letter-spacing:0.08em; color: var(--ink-mute);
  font-family:'Courier Prime', monospace; text-transform:uppercase; border-left:1px solid var(--rule-soft); }
.rm-months__label { font-weight: 600; color: var(--ink-soft); }
.rm-months__year { margin-left:4px; color: var(--ink-faint); }

.rm-frame__body { display:grid; grid-template-columns: 220px 1fr; }
.rm-frame__labels { border-right: 1px solid var(--rule); display:flex; flex-direction:column; }
.rm-frame__tracks { position:relative; }

.rm-groupHead { display:flex; align-items:center; gap:8px; padding: 14px 16px 6px; }
.rm-groupHead__roman { font-family:'Cormorant Garamond', serif; font-style:italic; font-size:20px; color: var(--stage); font-weight:500; }
.rm-groupHead__label { font-size:9.5px; letter-spacing:0.14em; color: var(--stage-deep);
  font-family:'Courier Prime', monospace; text-transform:uppercase; }
.rm-groupTrack { height: 36px; }

.rm-rowLabel { display:flex; align-items:flex-start; gap:8px; padding: 14px 16px;
  border-top:1px solid var(--rule-soft); min-height: 64px; cursor:pointer; transition: background .15s; }
.rm-rowLabel:hover { background: var(--bg-paper-soft); }
.rm-row__glyph { color: var(--stage); flex:0 0 auto; margin-top: 2px; }
.rm-row__textgroup { flex:1; min-width:0; }
.rm-row__title { font-family:'Cormorant Garamond', serif; font-size:17px; font-weight:500; margin:0; line-height:1.2; color: var(--ink); word-break:break-word; }
.rm-row__sub { display:flex; align-items:center; gap:6px; margin-top:3px; font-size:9.5px;
  font-family:'Courier Prime', monospace; text-transform:uppercase; letter-spacing:0.08em; color: var(--ink-mute); }

.rm-track { position:relative; height:64px; border-top:1px solid var(--rule-soft); }

.rm-grid { position:absolute; inset:0; pointer-events:none; }
.rm-grid__line { position:absolute; top:0; bottom:0; width:1px; background: var(--rule-soft); }
.rm-grid__line--first, .rm-grid__line--last { background: var(--rule); }

.rm-today { position:absolute; top:0; bottom:0; width:0; z-index:2; pointer-events:none; transform: translateX(-1px); }
.rm-today__line { position:absolute; top:0; bottom:0; width:1px;
  background: repeating-linear-gradient(to bottom, var(--ink-soft) 0 4px, transparent 4px 8px); opacity: 0.7; }
.rm-today__pill { position:absolute; top:-26px; left:0; transform: translateX(-50%);
  background: var(--ink); color: var(--bg-sand); padding: 3px 9px; border-radius:999px;
  font-size:9px; font-family:'Courier Prime', monospace; text-transform:uppercase;
  letter-spacing:0.08em; white-space:nowrap; }

.rm-bar { position:absolute; top:14px; bottom:14px; min-width: 40px;
  border-radius: 4px; display:flex; align-items:center; padding: 0 10px;
  font-size:10px; color: var(--stage-deep); overflow:hidden;
  cursor: pointer; transition: transform .15s, box-shadow .15s; }
.rm-bar:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.rm-bar__label { display:flex; align-items:center; gap:8px; min-width:0; position:relative; z-index: 1; }
.rm-bar__dates { font-family:'Courier Prime', monospace; text-transform:uppercase; letter-spacing:0.08em; }
.rm-bar__sep { color: var(--ink-faint); margin: 0 2px; }

.rm-bar--soil { background: transparent; border: 1px dashed var(--stage); padding: 0 8px;
  width: auto; min-width: auto; transform: translateX(-50%); }
.rm-bar__seed { color: var(--stage); display:inline-flex; margin-right:6px; }
.rm-bar__seedLabel { font-family:'Courier Prime', monospace; font-size:9.5px;
  text-transform:uppercase; letter-spacing:0.08em; color: var(--stage-deep); }

.rm-bar--plant { background: transparent; border: 1px dashed var(--stage); }
.rm-bar__cap { width:5px; height: 100%; background: var(--stage); position: absolute; top: 0; }
.rm-bar__cap--start { left: 0; }
.rm-bar__cap--end { right: 0; }

.rm-bar--water { background: var(--stage-soft); border: 1px solid var(--stage-tint); }
.rm-bar__fill { position:absolute; left:0; top:0; bottom:0;
  background: linear-gradient(90deg, var(--stage-tint), var(--stage-tint-2));
  border-radius: 4px 0 0 4px; }
.rm-bar__progress { font-family:'Courier Prime', monospace; font-size:9.5px;
  text-transform:uppercase; letter-spacing:0.08em; color: var(--stage-deep);
  background: var(--bg-paper); padding: 2px 7px; border-radius:999px;
  border: 1px solid var(--stage-tint); margin-left: 8px; white-space: nowrap; }

.rm-bar--harvest { background: var(--stage); color: var(--bg-paper); }
.rm-bar--harvest .rm-bar__dates { color: var(--bg-paper); opacity: 0.85; }
.rm-bar__done { font-family:'Courier Prime', monospace; font-size:9.5px;
  text-transform:uppercase; letter-spacing:0.08em; background: rgba(255,255,255,0.18);
  padding: 2px 7px; border-radius:999px; margin-left: 8px; }

.rm-legend { display:flex; gap:18px; padding: 14px 18px; border-top: 1px solid var(--rule);
  flex-wrap:wrap; font-size:9.5px; font-family:'Courier Prime', monospace;
  text-transform:uppercase; letter-spacing:0.08em; color: var(--ink-mute); }
.rm-legend__item { display:inline-flex; align-items:center; gap:6px; }
.rm-legend__swatch { width:18px; height:8px; border-radius:2px; }
.rm-legend__swatch--seed { background: transparent; border:1px dashed var(--stage); }
.rm-legend__swatch--plant { background: transparent; border:1px dashed var(--stage); }
.rm-legend__swatch--water { background: var(--stage-soft); border: 1px solid var(--stage-tint); }
.rm-legend__swatch--harvest { background: var(--stage); }

.rm-empty { padding: 60px 40px; text-align:center; color: var(--ink-mute);
  font-family:'Cormorant Garamond', serif; font-style:italic; font-size: 18px; }

@media (max-width: 880px) {
  .rm-frame { margin: 0 20px 30px; }
  .rm-toolbar { padding: 0 20px 12px; }
  .rm-frame__head, .rm-frame__body { grid-template-columns: 140px 1fr; }
  .rm-frame__labelHead { padding: 10px 12px; }
  .rm-rowLabel { padding: 10px 10px; min-height: 56px; }
  .rm-row__title { font-size: 14px; }
}
`

function injectStyles() {
  const id = 'rm-revamp-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

function GlyphInline({ stage, size = 14 }) {
  const props = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (stage) {
    case 'soil':    return <svg {...props}><path d="M2 12 Q 9 7.5 16 12" /><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" /><path d="M9 10 V 13.5" /></svg>
    case 'plant':   return <svg {...props}><path d="M9 16 V 7" /><path d="M9 10.5 Q 4 10.5 3 7 Q 7 6 9 10.5 Z" fill="currentColor" fillOpacity="0.15" /><path d="M9 8.5 Q 14 8.5 15 5 Q 11 4 9 8.5 Z" fill="currentColor" fillOpacity="0.15" /></svg>
    case 'water':   return <svg {...props}><path d="M9 2.5 C 6 6, 4.5 9, 4.5 11.2 A 4.5 4.5 0 0 0 13.5 11.2 C 13.5 9, 12 6, 9 2.5 Z" fill="currentColor" fillOpacity="0.14" /></svg>
    case 'harvest': return <svg {...props}><path d="M9 16 V 3" /><path d="M9 12 L 5.5 10 M 9 12 L 12.5 10" /><path d="M9 9 L 5.5 7 M 9 9 L 12.5 7" /></svg>
    default: return null
  }
}

function stageVarsCSS(stage) {
  const s = STAGES.find(x => x.key === stage)
  if (!s) return {}
  return { '--stage': s.color, '--stage-deep': s.deep, '--stage-tint': s.tint, '--stage-soft': s.soft, '--stage-tint-2': s.tint2 }
}

const STAGE_ROMAN = { soil: 'I', plant: 'II', water: 'III', harvest: 'IV' }

function fmtDayMonth(d) {
  if (!d) return ''
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

export default function ProjectsTimeline({ projects, tasks, onOpenModal }) {
  const { t } = useTranslation()

  useEffect(() => { injectStyles() }, [])

  const { horizonStart, horizonEnd, horizonDays, months } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let minD = today, maxD = today
    projects.forEach(p => {
      if (p.start_date) { const d = new Date(p.start_date + 'T00:00:00'); if (d < minD) minD = d }
      if (p.end_date)   { const d = new Date(p.end_date + 'T00:00:00');   if (d > maxD) maxD = d }
    })
    const start = new Date(minD.getFullYear(), minD.getMonth() - 1, 1)
    const end = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 1)
    const days = Math.max(60, Math.round((end - start) / 86400000))
    const ms = []
    const cursor = new Date(start)
    while (cursor < end) {
      const monthStart = new Date(cursor)
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      ms.push({ start: monthStart, end: monthEnd, label: monthStart.toLocaleDateString(undefined, { month: 'short' }), year: monthStart.getFullYear() })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return { horizonStart: start, horizonEnd: end, horizonDays: days, months: ms }
  }, [projects])

  const pctOf = (date) => {
    if (!date) return 0
    const d = (date - horizonStart) / 86400000
    return Math.max(0, Math.min(100, (d / horizonDays) * 100))
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayPct = pctOf(today)

  function StageBar({ project }) {
    const start = project.start_date ? new Date(project.start_date + 'T00:00:00') : null
    const end = project.end_date ? new Date(project.end_date + 'T00:00:00') : null
    const ptasks = tasks.filter(x => x.project_id === project.id && x.phase === project.stage)
    const total = ptasks.length
    const done = ptasks.filter(x => x.completed).length

    if (project.stage === 'soil') {
      return (
        <div className="rm-bar rm-bar--soil" style={{ left: `${todayPct}%`, ...stageVarsCSS('soil') }} onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}>
          <span className="rm-bar__seed">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="3.2" fill="currentColor" /></svg>
          </span>
          <span className="rm-bar__seedLabel">{t('projects.timeline.noDate')}</span>
        </div>
      )
    }
    if (!start || !end) return null
    const left = pctOf(start)
    const width = Math.max(2, pctOf(end) - left)

    if (project.stage === 'plant') {
      return (
        <div className="rm-bar rm-bar--plant" style={{ left: `${left}%`, width: `${width}%`, ...stageVarsCSS('plant') }} onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}>
          <span className="rm-bar__cap rm-bar__cap--start" />
          <span className="rm-bar__label">
            <span className="rm-bar__dates">{fmtDayMonth(start)} <span className="rm-bar__sep">→</span> {fmtDayMonth(end)}</span>
          </span>
          <span className="rm-bar__cap rm-bar__cap--end" />
        </div>
      )
    }
    if (project.stage === 'water') {
      const elapsed = Math.max(0, Math.min(100, ((today - start) / (end - start)) * 100))
      const pct = total ? Math.round((done / total) * 100) : 0
      return (
        <div className="rm-bar rm-bar--water" style={{ left: `${left}%`, width: `${width}%`, ...stageVarsCSS('water') }} onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}>
          <span className="rm-bar__fill" style={{ width: `${elapsed}%` }} />
          <span className="rm-bar__label">
            <span className="rm-bar__dates">{fmtDayMonth(start)} <span className="rm-bar__sep">→</span> {fmtDayMonth(end)}</span>
            {total > 0 && <span className="rm-bar__progress">{done}/{total} · {pct}%</span>}
          </span>
        </div>
      )
    }
    if (project.stage === 'harvest') {
      return (
        <div className="rm-bar rm-bar--harvest" style={{ left: `${left}%`, width: `${width}%`, ...stageVarsCSS('harvest') }} onClick={e => { e.stopPropagation(); onOpenModal(project.id) }}>
          <span className="rm-bar__label">
            <span className="rm-bar__dates">{fmtDayMonth(start)} <span className="rm-bar__sep">→</span> {fmtDayMonth(end)}</span>
            <span className="rm-bar__done">{t('projects.timeline.harvested')}</span>
          </span>
        </div>
      )
    }
    return null
  }

  if (projects.length === 0) {
    return (
      <div className="kb-root">
        <div className="rm-empty">{t('projects.timeline.noProjects')}</div>
      </div>
    )
  }

  return (
    <div className="kb-root">
      <div className="rm-toolbar">
        <div className="rm-toolbar__group">
          <span style={{ fontSize: 10, fontFamily: 'Courier Prime, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)' }}>{t('projects.timeline.horizon')}</span>
          <span className="rm-toolbar__horizon">
            {horizonStart.toLocaleDateString(undefined, { month: 'short' })} <span style={{ color: 'var(--ink-faint)' }}>·{String(horizonStart.getFullYear()).slice(2)}</span>
            <span className="rm-toolbar__arrow">→</span>
            {new Date(horizonEnd - 1).toLocaleDateString(undefined, { month: 'short' })} <span style={{ color: 'var(--ink-faint)' }}>·{String(new Date(horizonEnd - 1).getFullYear()).slice(2)}</span>
          </span>
        </div>
      </div>

      <div className="rm-frame">
        <div className="rm-frame__head">
          <div className="rm-frame__labelHead">{t('projects.listView.headers.project')}</div>
          <div className="rm-frame__trackHead">
            <div className="rm-months">
              {months.map((mo, i) => {
                const left = pctOf(mo.start)
                const width = pctOf(mo.end) - left
                return (
                  <div key={i} className="rm-months__cell" style={{ left: `${left}%`, width: `${width}%` }}>
                    <span className="rm-months__label">{mo.label}</span>
                    <span className="rm-months__year">·{String(mo.year).slice(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rm-frame__body">
          <div className="rm-frame__labels">
            {STAGES.map(s => {
              const rows = projects.filter(p => p.stage === s.key)
              if (!rows.length) return null
              return (
                <div key={s.key}>
                  <div className="rm-groupHead" style={stageVarsCSS(s.key)}>
                    <span className="rm-groupHead__roman">{STAGE_ROMAN[s.key]}</span>
                    <span className="rm-groupHead__label">{t(`projects.stages.${s.key}`)}</span>
                  </div>
                  {rows.map(p => {
                    const total = tasks.filter(x => x.project_id === p.id && x.phase === p.stage).length
                    const done = tasks.filter(x => x.project_id === p.id && x.phase === p.stage && x.completed).length
                    return (
                      <div key={p.id} className="rm-rowLabel" style={stageVarsCSS(p.stage)} onClick={() => onOpenModal(p.id)}>
                        <span className="rm-row__glyph"><GlyphInline stage={p.stage} /></span>
                        <div className="rm-row__textgroup">
                          <h3 className="rm-row__title">{p.title || t('projects.untitled')}</h3>
                          <div className="rm-row__sub">
                            {total > 0 ? <span>{done}/{total} · {Math.round(done / total * 100)}%</span> : <span>{t(`projects.stages.${p.stage}`)}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="rm-frame__tracks">
            <div className="rm-grid">
              {months.map((mo, i) => (
                <div key={i} className={'rm-grid__line' + (i === 0 ? ' rm-grid__line--first' : '')} style={{ left: `${pctOf(mo.start)}%` }} />
              ))}
              <div className="rm-grid__line rm-grid__line--last" style={{ left: '100%' }} />
            </div>
            <div className="rm-today" style={{ left: `${todayPct}%` }}>
              <span className="rm-today__pill">{t('projects.timeline.today', { date: fmtDayMonth(today) })}</span>
              <span className="rm-today__line" />
            </div>
            {STAGES.map(s => {
              const rows = projects.filter(p => p.stage === s.key)
              if (!rows.length) return null
              return (
                <div key={s.key}>
                  <div className="rm-groupTrack" />
                  {rows.map(p => (
                    <div key={p.id} className="rm-track" style={stageVarsCSS(p.stage)}>
                      <StageBar project={p} />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rm-legend">
          <span className="rm-legend__item" style={stageVarsCSS('soil')}>
            <span className="rm-legend__swatch rm-legend__swatch--seed" />
            {t('projects.timeline.legend.soil')}
          </span>
          <span className="rm-legend__item" style={stageVarsCSS('plant')}>
            <span className="rm-legend__swatch rm-legend__swatch--plant" />
            {t('projects.timeline.legend.plant')}
          </span>
          <span className="rm-legend__item" style={stageVarsCSS('water')}>
            <span className="rm-legend__swatch rm-legend__swatch--water" />
            {t('projects.timeline.legend.water')}
          </span>
          <span className="rm-legend__item" style={stageVarsCSS('harvest')}>
            <span className="rm-legend__swatch rm-legend__swatch--harvest" />
            {t('projects.timeline.legend.harvest')}
          </span>
        </div>
      </div>
    </div>
  )
}
