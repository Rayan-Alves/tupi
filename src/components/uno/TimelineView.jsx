const STATUS_COLOR = { todo: '#a1a1aa', doing: '#D4890A', done: '#2D5016' }

export default function TimelineView({ project, tasks }) {
  if (!project.project_start_date || !project.project_end_date) {
    return (
      <div style={{ textAlign:'center', padding:'40px 24px', color:'#a1a1aa', fontSize:13, background:'#fafafa', borderRadius:14, border:'1px solid #f0f0f0' }}>
        Defina as datas de início e entrega do projeto para ver a timeline.
      </div>
    )
  }
  const startMs = new Date(project.project_start_date).getTime()
  const endMs   = new Date(project.project_end_date).getTime()
  const totalMs = endMs - startMs
  if (totalMs <= 0) return <div style={{textAlign:'center',padding:'40px 0',color:'#a1a1aa',fontSize:13}}>Datas de projeto inválidas.</div>

  const rootTasks    = tasks.filter(t => !t.parent_id)
  const datedTasks   = rootTasks.filter(t => t.start_date || t.due_date)
  const undatedTasks = rootTasks.filter(t => !t.start_date && !t.due_date)

  // Month labels
  const months = []
  const cur = new Date(project.project_start_date); cur.setDate(1)
  while (cur.getTime() <= endMs) {
    const pct = ((cur.getTime() - startMs) / totalMs) * 100
    if (pct >= 0 && pct <= 100) months.push({ label: cur.toLocaleDateString('pt-BR',{month:'short'}), pct: Math.max(0, pct) })
    cur.setMonth(cur.getMonth() + 1)
  }

  return (
    <div>
      <div style={{ background:'#FAFAFA', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        {/* Header months */}
        <div style={{ position:'relative', height:32, borderBottom:'1px solid #f0f0f0', background:'#fff' }}>
          {months.map((m,i) => (
            <div key={i} style={{ position:'absolute', left:`${m.pct}%`, top:0, height:'100%', display:'flex', alignItems:'center', paddingLeft:8, borderLeft:'1px solid #f0f0f0' }}>
              <span style={{ fontSize:10, color:'#a1a1aa', fontWeight:600, whiteSpace:'nowrap' }}>{m.label}</span>
            </div>
          ))}
        </div>

        {datedTasks.length === 0 && (
          <div style={{ padding:'24px 16px', textAlign:'center', color:'#a1a1aa', fontSize:13 }}>
            Adicione datas de início e fim às tarefas para visualizá-las aqui.
          </div>
        )}

        {datedTasks.map(task => {
          const ts    = task.start_date ? new Date(task.start_date).getTime() : startMs
          const te    = task.due_date   ? new Date(task.due_date).getTime()   : ts + 86400000 * 3
          const left  = Math.max(0, Math.min(98, ((ts - startMs) / totalMs) * 100))
          const width = Math.max(2, Math.min(100 - left, ((te - ts) / totalMs) * 100))
          const color = STATUS_COLOR[task.status || 'todo']
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'center', height:40, borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ width:130, paddingLeft:12, fontSize:12, color:'#3f3f46', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:0 }}>
                {task.title || 'Sem título'}
              </div>
              <div style={{ flex:1, position:'relative', height:28, marginRight:12 }}>
                <div style={{ position:'absolute', left:`${left}%`, width:`${width}%`, height:16, top:6, background:color, borderRadius:99, opacity:0.8,
                  display:'flex', alignItems:'center', paddingLeft:6, overflow:'hidden' }}>
                  <span style={{ fontSize:10, color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {task.title}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {undatedTasks.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#a1a1aa', marginBottom:8 }}>Sem data definida</div>
          {undatedTasks.map(t => (
            <div key={t.id} style={{ fontSize:13, color:'#71717a', padding:'6px 0', borderBottom:'1px solid #f8f8f8' }}>
              · {t.title || 'Sem título'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
