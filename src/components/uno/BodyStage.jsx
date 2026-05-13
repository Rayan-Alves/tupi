import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import EnhancedTaskRow from './EnhancedTaskRow'
import KanbanView from './KanbanView'
import TimelineView from './TimelineView'

const VIEWS = [
  { id: 'list',     label: '≡  Lista' },
  { id: 'kanban',   label: '⊞  Kanban' },
  { id: 'timeline', label: '──  Timeline' },
]

function ViewSwitcher({ current, onChange }) {
  return (
    <div style={{ display:'flex', background:'#f4f4f5', borderRadius:10, padding:3, gap:2, width:'fit-content' }}>
      {VIEWS.map(v => (
        <button key={v.id} onClick={() => onChange(v.id)}
          style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
            background: current === v.id ? '#fff' : 'transparent',
            color: current === v.id ? '#1a1a1a' : '#71717a',
            boxShadow: current === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition:'all .15s' }}>
          {v.label}
        </button>
      ))}
    </div>
  )
}

function ReadonlyField({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#a1a1aa', marginBottom:6 }}>{label}</div>
      <p style={{ fontSize:15, color:'#3f3f46', lineHeight:1.7, fontFamily:'Georgia,serif', margin:0 }}>{value}</p>
    </div>
  )
}

const SPIRIT_QUESTIONS = [
  { field:'spirit_internal',    label:'O que eu preciso trabalhar internamente?' },
  { field:'spirit_generates',   label:'O que isso gera em mim?' },
  { field:'spirit_destination', label:'Onde eu quero chegar?' },
  { field:'spirit_feeling',     label:'Qual sentimento isso gera em mim?' },
  { field:'spirit_start',       label:'Quando eu pretendo iniciar?' },
]
const MIND_QUESTIONS = [
  { field:'mind_beliefs',      label:'Quais crenças trazer para realizar esse desejo?' },
  { field:'mind_affirmations', label:'Firmamentos e afirmações mentais' },
]

function Accordion({ label, children, accentColor='#4A0E8F' }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom:16 }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 16px', borderRadius:10, border:'1px solid #f0f0f0', transition:'all .15s' }}
        onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
        onMouseLeave={e=>e.currentTarget.style.background='none'}>
        <span style={{ fontSize:12, fontWeight:600, color:accentColor }}>{label}</span>
        <span style={{ fontSize:14, color:'#a1a1aa' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding:'12px 16px 16px', border:'1px solid #f0f0f0', borderTop:'none', borderRadius:'0 0 10px 10px', marginTop:-4 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function BodyStage({ project, tasks, saveField, addTask, updateTask, deleteTask }) {
  const [view, setView]         = useState('list')
  const [startDate, setStartDate] = useState(project.project_start_date || '')
  const [endDate, setEndDate]   = useState(project.project_end_date || '')
  const [notes, setNotes]       = useState(project.project_notes || '')

  const rootTasks  = tasks.filter(t => !t.parent_id)
  const getSubtasks = id => tasks.filter(t => t.parent_id === id)
  const done = tasks.filter(t => t.status === 'done').length
  const pct  = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  return (
    <>
      <Accordion label="Ver respostas do Espírito →" accentColor="#1B3A5C">
        {SPIRIT_QUESTIONS.map(q => <ReadonlyField key={q.field} label={q.label} value={project[q.field]} />)}
      </Accordion>
      <Accordion label="Ver respostas da Mente →" accentColor="#D4890A">
        {MIND_QUESTIONS.map(q => <ReadonlyField key={q.field} label={q.label} value={project[q.field]} />)}
      </Accordion>

      {/* Project dates */}
      <div style={{ display:'flex', gap:16, marginBottom:28, flexWrap:'wrap' }}>
        {[
          { label:'Data de início', val:startDate, set:setStartDate, field:'project_start_date' },
          { label:'Data de entrega', val:endDate, set:setEndDate, field:'project_end_date' },
        ].map(({ label, val, set, field }) => (
          <div key={field}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#71717a', marginBottom:6 }}>{label}</div>
            <input type="date" value={val} onChange={e => { set(e.target.value); saveField(field, e.target.value||null) }}
              className="uno-date-input" style={{ padding:'8px 12px', fontSize:13 }} />
          </div>
        ))}
      </div>

      {/* Project notes */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#71717a', marginBottom:8 }}>Notas do Projeto</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => saveField('project_notes', notes)}
          placeholder="Contexto, decisões, referências importantes…" rows={3}
          style={{ width:'100%', border:'1px solid #e4e4e7', borderRadius:12, padding:'12px 14px', fontSize:14, color:'#1a1a1a', fontFamily:'Georgia,serif',
            lineHeight:1.7, resize:'vertical', outline:'none', boxSizing:'border-box', background:'#FAFAF7', transition:'border-color .2s' }}
          onFocus={e=>e.target.style.borderColor='#4A0E8F'} onBlur={e=>{e.target.style.borderColor='#e4e4e7'; saveField('project_notes',notes)}} />
      </div>

      {/* Task section header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#71717a', marginBottom:2 }}>
            Tarefas — {done}/{tasks.length} concluídas
          </div>
          {tasks.length > 0 && (
            <div style={{ height:4, width:120, background:'#f0f0f0', borderRadius:2, overflow:'hidden', marginTop:4 }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'#2D5016', borderRadius:2, transition:'width .4s ease' }} />
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <ViewSwitcher current={view} onChange={setView} />
          <button onClick={() => addTask(null)}
            style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#fff',
              background:'#2D5016', border:'none', padding:'7px 14px', borderRadius:8, cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#1f5010'}
            onMouseLeave={e=>e.currentTarget.style.background='#2D5016'}>
            <Plus size={13} /> Nova tarefa
          </button>
        </div>
      </div>

      {/* Views */}
      {view === 'list' && (
        <div>
          {rootTasks.length === 0
            ? <div style={{ textAlign:'center', padding:'32px 0', color:'#a1a1aa', fontSize:13 }}>Clique em "Nova tarefa" para começar.</div>
            : rootTasks.map(task => (
                <EnhancedTaskRow key={task.id} task={task} subtasks={getSubtasks(task.id)}
                  onUpdate={updateTask} onDelete={deleteTask} onAddSubtask={addTask} />
              ))
          }
        </div>
      )}
      {view === 'kanban' && <KanbanView tasks={tasks} onUpdate={updateTask} />}
      {view === 'timeline' && <TimelineView project={project} tasks={tasks} />}

      {pct === 100 && tasks.length > 0 && (
        <div style={{ textAlign:'center', padding:'24px', background:'#f0fdf4', borderRadius:16, border:'1px solid #bbf7d0', marginTop:32 }}>
          <div style={{ fontSize:28, marginBottom:6 }}>🌿</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#15803d', marginBottom:4 }}>Todas as tarefas concluídas!</div>
          <div style={{ fontSize:13, color:'#4ade80' }}>Seu desejo de alma tomou forma no mundo.</div>
        </div>
      )}
    </>
  )
}
