import { formatRecurrence } from './RecurrenceModal'
const STATUS_NEXT = { todo: 'doing', doing: 'done', done: 'todo' }
const COLUMNS = [
  { id: 'todo',  label: 'A Fazer', color: '#71717a', bg: '#F4F4F5' },
  { id: 'doing', label: 'Fazendo', color: '#D4890A', bg: '#FFFBEB' },
  { id: 'done',  label: 'Feito',   color: '#2D5016', bg: '#F0FDF4' },
]

export default function KanbanView({ tasks, onUpdate }) {
  const rootTasks = tasks.filter(t => !t.parent_id)
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, alignItems:'start' }}>
      {COLUMNS.map(col => {
        const colTasks = rootTasks.filter(t => (t.status||'todo') === col.id)
        return (
          <div key={col.id} style={{ background:col.bg, borderRadius:14, padding:12, border:'1px solid #f0f0f0', minHeight:180 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:col.color }} />
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:col.color }}>{col.label}</span>
              <span style={{ fontSize:11, color:'#a1a1aa', marginLeft:'auto' }}>{colTasks.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {colTasks.map(task => (
                <div key={task.id} style={{ background:'#fff', borderRadius:10, padding:'10px 12px', border:'1px solid #ebebeb', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#1a1a1a', lineHeight:1.4, marginBottom:4, wordBreak:'break-word' }}>
                    {task.title || 'Sem título'}
                  </div>
                  {task.due_date && (
                    <div style={{ fontSize:11, color:'#a1a1aa', marginBottom:4 }}>
                      📅 {new Date(task.due_date+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
                    </div>
                  )}
                  {task.recurrence && <div style={{ fontSize: 10, color: '#4A0E8F', marginBottom: 6 }}>↺ {formatRecurrence(task.recurrence)}</div>}
                  <div style={{ display:'flex', gap:4, justifyContent:'flex-end', marginTop:6 }}>
                    {col.id !== 'todo' && (
                      <button onClick={()=>onUpdate(task.id,{status:col.id==='doing'?'todo':'doing',completed:false})}
                        style={{ fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #e4e4e7', background:'#fff', cursor:'pointer', color:'#71717a', fontWeight:500 }}>← Voltar</button>
                    )}
                    {col.id !== 'done' && (
                      <button onClick={()=>onUpdate(task.id,{status:col.id==='todo'?'doing':'done',completed:col.id==='doing'})}
                        style={{ fontSize:10, padding:'3px 8px', borderRadius:6, border:'none', background:col.id==='todo'?'#D4890A':'#2D5016', color:'#fff', cursor:'pointer', fontWeight:600 }}>Avançar →</button>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && <div style={{ textAlign:'center', padding:'20px 0', color:'#d4d4d8', fontSize:12 }}>vazio</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
