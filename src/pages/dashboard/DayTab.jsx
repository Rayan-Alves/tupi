import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Check, Trash2, ChevronRight } from 'lucide-react'
import { useDayDashboard, TODAY_KEY } from '../../hooks/useDayDashboard'

/* ─── helpers ─────────────────────────────────── */
const SOURCE_DOT = { spirit:'#1B3A5C', mind:'#D4890A', body:'#2D5016', dashboard:'#a1a1aa' }
const SOURCE_LABEL = { spirit:'S', mind:'M', body:'B', dashboard:'D' }
const DAYS_PT = [
  { key:'sun',label:'D' },{ key:'mon',label:'S' },{ key:'tue',label:'T' },
  { key:'wed',label:'Q' },{ key:'thu',label:'Q' },{ key:'fri',label:'S' },{ key:'sat',label:'S' },
]

function pct(d,t) { return t>0 ? Math.round(d/t*100) : 0 }

/* ─── Shared primitives ──────────────────────── */
function CheckCircle({ done, onToggle, size=18 }) {
  const [flash, setFlash] = useState(false)
  function handle() {
    setFlash(true); setTimeout(() => setFlash(false), 600); onToggle()
  }
  const filled = done || flash
  return (
    <button onClick={handle} style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0, cursor:'pointer',
      border:`1.5px solid ${filled ? '#22c55e' : '#d4d4d8'}`,
      background: filled ? '#22c55e' : 'transparent',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'all .2s',
    }}>
      {filled && <Check size={size*0.5} strokeWidth={2.5} color="#fff" />}
    </button>
  )
}

function CounterBadge({ done, total, showPct, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      fontSize:11, fontWeight:600, color:'#a1a1aa',
      background:'#F4F4F5', border:'none', cursor:'pointer',
      padding:'2px 8px', borderRadius:99, transition:'color .15s',
    }}>
      {showPct ? `${pct(done,total)}%` : `${done}/${total}`}
    </button>
  )
}

function ThinBar({ done, total }) {
  const p = pct(done, total)
  return (
    <div style={{ height:2, background:'#F4F4F5', borderRadius:2, overflow:'hidden', margin:'8px 0 0' }}>
      <div style={{ height:'100%', width:`${p}%`, background: p===100 ? '#22c55e' : '#a1a1aa', borderRadius:2, transition:'width .4s ease' }} />
    </div>
  )
}

function SectionCard({ title, done, total, showPct, onToggleCounter, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#3f3f46' }}>
            {title}
          </span>
          {total > 0 && <CounterBadge done={done} total={total} showPct={showPct} onToggle={onToggleCounter} />}
        </div>
        {total > 0 && <ThinBar done={done} total={total} />}
      </div>
      <div style={{ padding:'8px 16px 14px' }}>{children}</div>
    </div>
  )
}

/* ─── Add Routine Form ───────────────────────── */
function AddRoutineForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [days, setDays]   = useState([])
  const [start, setStart] = useState('')
  const [end, setEnd]     = useState('')
  function toggleDay(k) { setDays(d => d.includes(k) ? d.filter(x=>x!==k) : [...d,k]) }
  function save() { if (!title.trim()) return; onSave({ title, days, start_date: start||null, end_date: end||null }); onCancel() }
  return (
    <div style={{ marginTop:8, padding:'12px 14px', background:'#FAFAF8', borderRadius:12, border:'1px solid #EBEBEB' }}>
      <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
        placeholder="Nome da rotina…"
        style={{ width:'100%', border:'none', borderBottom:'1px solid #E4E4E7', background:'transparent', fontSize:13, color:'#1a1a1a', padding:'2px 0 6px', outline:'none', marginBottom:10, boxSizing:'border-box' }}
        onKeyDown={e => { if(e.key==='Enter') save(); if(e.key==='Escape') onCancel() }}
      />
      {/* Day pills */}
      <div style={{ display:'flex', gap:4, marginBottom:10 }}>
        {DAYS_PT.map(d => (
          <button key={d.key} onClick={()=>toggleDay(d.key)}
            style={{ width:26, height:26, borderRadius:'50%', border:'none', fontSize:11, fontWeight:700, cursor:'pointer',
              background: days.includes(d.key) ? '#1a1a1a' : '#F4F4F5',
              color: days.includes(d.key) ? '#fff' : '#71717a', transition:'all .15s' }}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Dates */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        <input type="date" value={start} onChange={e=>setStart(e.target.value)}
          style={{ border:'1px solid #E4E4E7', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#3f3f46', outline:'none' }} />
        <span style={{ color:'#a1a1aa', fontSize:12 }}>→</span>
        <input type="date" value={end} onChange={e=>setEnd(e.target.value)}
          style={{ border:'1px solid #E4E4E7', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#3f3f46', outline:'none' }} />
      </div>
      {/* Actions */}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:12, color:'#a1a1aa', background:'none', border:'none', cursor:'pointer' }}>Cancelar</button>
        <button onClick={save}
          style={{ fontSize:12, fontWeight:700, color:'#fff', background: title.trim() ? '#1a1a1a' : '#d4d4d8',
            border:'none', borderRadius:99, padding:'5px 14px', cursor: title.trim() ? 'pointer' : 'default', transition:'background .15s' }}>
          Salvar
        </button>
      </div>
    </div>
  )
}

/* ─── Routine row ────────────────────────────── */
function RoutineRow({ routine, done, onToggle, onDelete }) {
  const dot = SOURCE_DOT[routine.source] || '#a1a1aa'
  const lbl = SOURCE_LABEL[routine.source] || 'D'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:10 }}>
      <CheckCircle done={done} onToggle={() => onToggle(routine.id, routine.source)} />
      <span style={{ flex:1, fontSize:13, color: done ? '#a1a1aa' : '#1a1a1a', textDecoration: done ? 'line-through' : 'none', transition:'color .2s' }}>
        {routine.title || '—'}
      </span>
      <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.08em', color: dot, background:`${dot}18`, padding:'2px 5px', borderRadius:99, flexShrink:0 }}>
        {lbl}
      </span>
      {routine.source === 'dashboard' && (
        <button onClick={()=>onDelete(routine.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d4d4d8', padding:2 }}
          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

/* ─── Task row (day tasks) ───────────────────── */
function TaskRow({ task, subtasks, onToggle, onTitleChange, onDelete, onAddSub }) {
  const [title, setTitle] = useState(task.title || '')
  const [expanded, setExpanded] = useState(false)
  const dirty = useRef(false)
  useEffect(() => { setTitle(task.title || '') }, [task.id])
  function flush() { if (dirty.current) { onTitleChange(task.id, title); dirty.current = false } }

  return (
    <div style={{ paddingTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <CheckCircle done={task.completed} onToggle={() => onToggle(task.id, { completed: !task.completed })} />
        {subtasks.length > 0 && (
          <button onClick={() => setExpanded(e=>!e)} style={{ background:'none', border:'none', cursor:'pointer', color:'#a1a1aa', padding:0, display:'flex' }}>
            <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition:'transform .15s' }} />
          </button>
        )}
        <input value={title} onChange={e=>{setTitle(e.target.value);dirty.current=true}} onBlur={flush}
          onKeyDown={e=>e.key==='Enter'&&flush()}
          placeholder="Nova tarefa…"
          style={{ flex:1, border:'none', background:'transparent', fontSize:13, color: task.completed ? '#a1a1aa' : '#1a1a1a',
            textDecoration: task.completed ? 'line-through' : 'none', outline:'none' }} />
        <button onClick={()=>onAddSub(task.id)} title="Subtarefa"
          style={{ background:'none', border:'none', cursor:'pointer', color:'#d4d4d8', padding:2 }}
          onMouseEnter={e=>e.currentTarget.style.color='#71717a'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
          <Plus size={12} />
        </button>
        <button onClick={()=>onDelete(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d4d4d8', padding:2 }}
          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
          <Trash2 size={12} />
        </button>
      </div>
      {/* Subtasks */}
      {(expanded || subtasks.length > 0) && subtasks.map(sub => (
        <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:8, paddingTop:6, paddingLeft:26 }}>
          <CheckCircle done={sub.completed} onToggle={()=>onToggle(sub.id,{completed:!sub.completed})} size={14} />
          <SubInput sub={sub} onChange={(id,v)=>onTitleChange(id,v)} onDelete={onDelete} />
        </div>
      ))}
    </div>
  )
}

function SubInput({ sub, onChange, onDelete }) {
  const [v, setV] = useState(sub.title || '')
  const dirty = useRef(false)
  useEffect(()=>{setV(sub.title||'')},[sub.id])
  function flush() { if(dirty.current){onChange(sub.id,v);dirty.current=false} }
  return (
    <>
      <input value={v} onChange={e=>{setV(e.target.value);dirty.current=true}} onBlur={flush}
        placeholder="Subtarefa…"
        style={{ flex:1, border:'none', background:'transparent', fontSize:12, color: sub.completed?'#a1a1aa':'#3f3f46',
          textDecoration: sub.completed?'line-through':'none', outline:'none' }} />
      <button onClick={()=>onDelete(sub.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d4d4d8', padding:2 }}
        onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d4d4d8'}>
        <Trash2 size={11} />
      </button>
    </>
  )
}

/* ─── Note area ──────────────────────────────── */
function NoteArea({ content, onSave }) {
  const [text, setText] = useState(content || '')
  const timer = useRef(null)
  useEffect(() => { setText(content || '') }, [content])
  function handleChange(v) {
    setText(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(v), 800)
  }
  return (
    <textarea value={text} onChange={e=>handleChange(e.target.value)}
      placeholder="Pensamentos, reflexões, intenções para hoje…"
      rows={5}
      style={{ width:'100%', border:'none', background:'transparent', resize:'none', outline:'none',
        fontSize:14, color:'#1a1a1a', lineHeight:1.8, fontFamily:'Georgia, serif', boxSizing:'border-box' }} />
  )
}

/* ─── Add button ─────────────────────────────── */
function AddBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:5, marginTop:12, fontSize:12, color:'#a1a1aa',
        background:'none', border:'none', cursor:'pointer', padding:0, transition:'color .15s' }}
      onMouseEnter={e=>e.currentTarget.style.color='#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.color='#a1a1aa'}>
      <Plus size={13} />{label}
    </button>
  )
}

/* ─── Main DayTab ────────────────────────────── */
export default function DayTab() {
  const {
    loading,
    routinesToday, completions, toggleRoutine, addDashRoutine, deleteDashRoutine,
    dayTasks, addDayTask, updateDayTask, deleteDayTask,
    projTasks, toggleProjTask,
    note, saveNote,
  } = useDayDashboard()

  const [showRPct,  setShowRPct]  = useState(false)
  const [showTPct,  setShowTPct]  = useState(false)
  const [showPPct,  setShowPPct]  = useState(false)
  const [addingR,   setAddingR]   = useState(false)

  if (loading) {
    return <div style={{ textAlign:'center', padding:'60px 0', color:'#a1a1aa', fontSize:13 }}>Carregando…</div>
  }

  const rootTasks = dayTasks.filter(t => !t.parent_id)
  const getSubs   = id => dayTasks.filter(t => t.parent_id === id)
  const rDone     = routinesToday.filter(r => completions.has(r.id)).length
  const tDone     = dayTasks.filter(t => !t.parent_id && t.completed).length
  const pDone     = projTasks.filter(t => t.completed).length

  async function handleAddTask() {
    await addDayTask(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* ── 1. ROTINAS ─────────────────────────── */}
      <SectionCard title="Rotinas do Dia" done={rDone} total={routinesToday.length}
        showPct={showRPct} onToggleCounter={() => setShowRPct(v=>!v)}>
        {routinesToday.length === 0 && !addingR && (
          <p style={{ fontSize:13, color:'#a1a1aa', margin:'8px 0 0' }}>
            Adicione rotinas em Espírito, Mente ou Corpo — elas aparecem aqui.
          </p>
        )}
        {routinesToday.map(r => (
          <RoutineRow key={r.id} routine={r} done={completions.has(r.id)}
            onToggle={toggleRoutine} onDelete={deleteDashRoutine} />
        ))}
        {addingR
          ? <AddRoutineForm onSave={addDashRoutine} onCancel={() => setAddingR(false)} />
          : <AddBtn label="Nova rotina" onClick={() => setAddingR(true)} />
        }
      </SectionCard>

      {/* ── 2. TAREFAS DO DIA ──────────────────── */}
      <SectionCard title="Tarefas do Dia" done={tDone} total={rootTasks.length}
        showPct={showTPct} onToggleCounter={() => setShowTPct(v=>!v)}>
        {rootTasks.length === 0 && (
          <p style={{ fontSize:13, color:'#a1a1aa', margin:'8px 0 0' }}>O que você vai fazer hoje?</p>
        )}
        {rootTasks.map(task => (
          <TaskRow key={task.id} task={task} subtasks={getSubs(task.id)}
            onToggle={(id, changes) => updateDayTask(id, changes)}
            onTitleChange={(id, title) => updateDayTask(id, { title })}
            onDelete={deleteDayTask}
            onAddSub={addDayTask} />
        ))}
        <AddBtn label="Nova tarefa" onClick={handleAddTask} />
      </SectionCard>

      {/* ── 3. PROJETOS ────────────────────────── */}
      {projTasks.length > 0 && (
        <SectionCard title="Projetos — Hoje" done={pDone} total={projTasks.length}
          showPct={showPPct} onToggleCounter={() => setShowPPct(v=>!v)}>
          {projTasks.map(task => (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, paddingTop:10 }}>
              <CheckCircle done={task.completed} onToggle={() => toggleProjTask(task.id)} />
              <span style={{ flex:1, fontSize:13, color: task.completed?'#a1a1aa':'#1a1a1a', textDecoration: task.completed?'line-through':'none' }}>
                {task.title || '—'}
              </span>
              {task.projects?.title && (
                <span style={{ fontSize:10, color:'#a1a1aa', flexShrink:0 }}>
                  {task.projects.title}
                </span>
              )}
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── 4. NOTAS DO DIA ────────────────────── */}
      <SectionCard title="Notas do Dia" done={0} total={0} showPct={false} onToggleCounter={()=>{}}>
        <div style={{ paddingTop:8 }}>
          <NoteArea content={note.content} onSave={saveNote} />
        </div>
      </SectionCard>

    </div>
  )
}
