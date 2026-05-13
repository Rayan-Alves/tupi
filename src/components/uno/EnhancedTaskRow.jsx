import { useState, useEffect } from 'react'
import { Check, Trash2, Plus } from 'lucide-react'

const RECURRENCE_LABELS = { daily: '↺ Diário', weekly: '↺ Semanal', monthly: '↺ Mensal' }
const STATUS_NEXT = { todo: 'doing', doing: 'done', done: 'todo' }
const STATUS_BG = { todo: '#fff', doing: '#FFFBEB', done: '#F0FDF4' }

function SubtaskRow({ task, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.title || '')
  useEffect(() => { setTitle(task.title || '') }, [task.id])
  function flush() { if (title !== task.title) onUpdate(task.id, { title }) }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:32, marginTop:4, padding:'8px 12px', background:'#fafafa', borderRadius:10, border:'1px solid #f0f0f0' }}>
      <button onClick={() => onUpdate(task.id, { status: STATUS_NEXT[task.status||'todo'], completed: STATUS_NEXT[task.status||'todo']==='done' })}
        style={{ width:14, height:14, borderRadius:'50%', border:'2px solid', borderColor:task.status==='done'?'#2D5016':'#d4d4d8', background:task.status==='done'?'#2D5016':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
        {task.status==='done' && <Check size={8} style={{color:'#fff'}} />}
      </button>
      <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={flush} placeholder="Subtarefa…"
        style={{ flex:1, border:'none', background:'transparent', fontSize:12, color:task.status==='done'?'#a1a1aa':'#3f3f46', outline:'none', textDecoration:task.status==='done'?'line-through':'none' }} />
      <button onClick={()=>onDelete(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d4d4d8', display:'flex' }}
        onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
        <Trash2 size={11} />
      </button>
    </div>
  )
}

export default function EnhancedTaskRow({ task, subtasks=[], onUpdate, onDelete, onAddSubtask }) {
  const [title, setTitle] = useState(task.title || '')
  const [notes, setNotes] = useState(task.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { setTitle(task.title || '') }, [task.id])
  useEffect(() => { setNotes(task.notes || '') }, [task.id])
  function flush() { if (title !== task.title) onUpdate(task.id, { title }) }
  function flushNotes() { onUpdate(task.id, { notes }) }
  function cycleStatus() {
    const next = STATUS_NEXT[task.status||'todo']
    onUpdate(task.id, { status: next, completed: next==='done' })
  }
  return (
    <div style={{ marginBottom:8 }}>
      <div className="uno-task-row" style={{ background: STATUS_BG[task.status||'todo'], flexWrap:'wrap', gap:6 }}>
        <button onClick={cycleStatus} className="uno-check"
          style={task.status==='done'?{background:'#2D5016',borderColor:'#2D5016'}:task.status==='doing'?{background:'#D4890A',borderColor:'#D4890A'}:{}}>
          {task.status==='done' && <Check size={9} style={{color:'#fff'}} />}
          {task.status==='doing' && <div style={{width:5,height:5,background:'#fff',borderRadius:1}} />}
        </button>
        <input value={title} onChange={e=>{setTitle(e.target.value)}} onBlur={flush} onKeyDown={e=>e.key==='Enter'&&flush()} placeholder="Nome da tarefa…"
          style={{ flex:1, minWidth:120, border:'none', background:'transparent', fontSize:14, color:task.status==='done'?'#a1a1aa':'#1a1a1a', outline:'none', textDecoration:task.status==='done'?'line-through':'none' }} />
        {task.recurrence && <span style={{fontSize:10,color:'#D4890A',background:'#FEF3C7',padding:'2px 7px',borderRadius:99,fontWeight:600}}>{RECURRENCE_LABELS[task.recurrence]}</span>}
        <input type="date" value={task.start_date||''} onChange={e=>onUpdate(task.id,{start_date:e.target.value||null})} className="uno-date-input" title="Início" />
        <input type="date" value={task.due_date||''} onChange={e=>onUpdate(task.id,{due_date:e.target.value||null})} className="uno-date-input" title="Fim" />
        <select value={task.recurrence||''} onChange={e=>onUpdate(task.id,{recurrence:e.target.value||null})}
          style={{fontSize:11,border:'1px solid #e4e4e7',borderRadius:8,padding:'3px 6px',background:'white',outline:'none',color:'#71717a'}}>
          <option value="">↺</option>
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
        <button onClick={()=>setShowNotes(n=>!n)} title="Notas"
          style={{background:showNotes?'#f0f0f0':'none',border:'none',cursor:'pointer',fontSize:13,padding:'2px 6px',borderRadius:6,color:'#a1a1aa'}}>📝</button>
        {subtasks.length>0 && <button onClick={()=>setExpanded(e=>!e)}
          style={{fontSize:11,color:'#71717a',background:'#f4f4f5',border:'none',cursor:'pointer',padding:'2px 8px',borderRadius:6,fontWeight:600}}>
          {subtasks.length} ↳</button>}
        <button onClick={()=>onAddSubtask(task.id)} title="Adicionar subtarefa"
          style={{background:'none',border:'none',cursor:'pointer',color:'#c4c4c7',display:'flex',padding:3,borderRadius:6}}
          onMouseEnter={e=>e.currentTarget.style.color='#4A0E8F'} onMouseLeave={e=>e.currentTarget.style.color='#c4c4c7'}>
          <Plus size={12} /></button>
        <button onClick={()=>onDelete(task.id)}
          style={{background:'none',border:'none',cursor:'pointer',color:'#d4d4d8',display:'flex',padding:3,borderRadius:6}}
          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
          <Trash2 size={13} /></button>
      </div>
      {showNotes && (
        <div style={{marginLeft:28,padding:'8px 12px',background:'#FAFAF7',borderRadius:'0 0 10px 10px',border:'1px solid #f0f0f0',borderTop:'none'}}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} onBlur={flushNotes} placeholder="Notas sobre essa tarefa…" rows={2}
            style={{width:'100%',border:'none',background:'transparent',fontSize:13,color:'#3f3f46',outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.6,boxSizing:'border-box'}} />
        </div>
      )}
      {expanded && subtasks.map(sub => <SubtaskRow key={sub.id} task={sub} onUpdate={onUpdate} onDelete={onDelete} />)}
    </div>
  )
}
