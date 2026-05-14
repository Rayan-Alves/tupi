import { STAGES } from './KanbanBoard'
import { computeProgress } from '../../lib/recurring'

function fmtMonth(date) {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function getMonths(startMs, endMs) {
  const months = []
  const cur = new Date(startMs)
  cur.setDate(1)
  const end = new Date(endMs)
  while (cur <= end) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

export default function ProjectsTimeline({ projects, tasks, onOpenModal }) {
  const dated   = projects.filter(p => p.start_date && p.end_date)
  const undated  = projects.filter(p => !p.start_date || !p.end_date)

  if (dated.length === 0 && undated.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a1a1aa', fontSize: 14 }}>Nenhum projeto ainda.</div>
  }

  let gantt = null
  if (dated.length > 0) {
    const startMs = Math.min(...dated.map(p => new Date(p.start_date + 'T00:00:00').getTime()))
    const endMs   = Math.max(...dated.map(p => new Date(p.end_date   + 'T00:00:00').getTime()))
    const totalMs = endMs - startMs || 1
    const months  = getMonths(startMs, endMs)
    const LEFT_COL = 160 // px for project name column

    gantt = (
      <div style={{ overflowX: 'auto', marginBottom: 40 }}>
        <div style={{ minWidth: Math.max(700, months.length * 80 + LEFT_COL) }}>
          {/* Month axis */}
          <div style={{ display: 'flex', marginLeft: LEFT_COL, marginBottom: 8, borderBottom: '1px solid #EBEBEB', paddingBottom: 6 }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a1a1aa', textAlign: 'center' }}>
                {fmtMonth(m)}
              </div>
            ))}
          </div>

          {/* Today marker */}
          {(() => {
            const todayMs = new Date().getTime()
            if (todayMs < startMs || todayMs > endMs) return null
            const pct = (todayMs - startMs) / totalMs * 100
            return (
              <div style={{ position: 'relative', height: 0 }}>
                <div style={{
                  position: 'absolute', left: `calc(${LEFT_COL}px + ${pct}%)`,
                  top: -2, height: dated.length * 44 + 10,
                  width: 2, background: '#EF4444', borderRadius: 1, opacity: 0.5, zIndex: 1,
                  transform: 'translateX(-50%)',
                }} />
              </div>
            )
          })()}

          {/* Project rows */}
          {dated.map(project => {
            const stage   = STAGES.find(s => s.key === project.stage) || STAGES[0]
            const pTasks  = tasks.filter(t => t.project_id === project.id)
            const { pct } = computeProgress(pTasks, project)
            const ps = new Date(project.start_date + 'T00:00:00').getTime()
            const pe = new Date(project.end_date   + 'T00:00:00').getTime()
            const barLeft  = (ps - startMs) / totalMs * 100
            const barWidth = Math.max((pe - ps) / totalMs * 100, 1)
            const isSmart  = project.smart_specific && project.smart_measurable && project.smart_attainable && project.smart_relevant

            return (
              <div key={project.id} style={{ display: 'flex', alignItems: 'center', height: 44, borderBottom: '1px solid #F5F5F5' }}>
                {/* Name column */}
                <div style={{ width: LEFT_COL, flexShrink: 0, paddingRight: 12, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#1a1a1a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: stage.dot, flexShrink: 0 }} />
                    {project.title || 'Sem título'}
                    {isSmart && <span style={{ fontSize: 8, color: '#15803d', background: '#F0FDF4', padding: '1px 4px', borderRadius: 99, border: '1px solid #BBF7D0', fontWeight: 700 }}>S</span>}
                  </div>
                </div>

                {/* Bar track */}
                <div style={{ flex: 1, position: 'relative', height: 24, cursor: 'pointer' }} onClick={() => onOpenModal(project.id)}>
                  {/* Bar */}
                  <div style={{
                    position: 'absolute',
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    height: '100%',
                    background: stage.dot,
                    borderRadius: 99,
                    opacity: 0.85,
                    overflow: 'hidden',
                    transition: 'opacity .2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
                  >
                    {/* Progress fill */}
                    <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(255,255,255,0.3)', borderRadius: 99 }} />
                    {/* Label */}
                    {barWidth > 12 && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', paddingLeft: 8,
                        fontSize: 10, fontWeight: 700, color: '#fff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {project.title}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 20px 40px' }}>
      {gantt}

      {undated.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 12 }}>
            Sem período definido
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {undated.map(project => {
              const stage = STAGES.find(s => s.key === project.stage) || STAGES[0]
              return (
                <div key={project.id} onClick={() => onOpenModal(project.id)}
                  style={{ padding: '6px 12px', borderRadius: 99, border: `1px solid ${stage.color}`, background: stage.bg, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: stage.dot, transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {project.title || 'Sem título'}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
