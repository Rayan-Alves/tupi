import { useState, useEffect, useRef } from 'react'
import { Check, Trash2, Plus } from 'lucide-react'
import RecurrenceModal, { formatRecurrence, parseRecurrence } from './RecurrenceModal'

const STATUS_NEXT = { todo: 'doing', doing: 'done', done: 'todo' }
const STATUS_BG   = { todo: '#fff', doing: '#FFFBEB', done: '#F0FDF4' }

/* ── Recurring occurrence counter button ─────────────────── */
function RecurringCheck({ occDone, totalOcc, onCheck }) {
  const [flash, setFlash] = useState(false)
  const isDone = totalOcc > 0 && occDone >= totalOcc

  function handle() {
    if (isDone) return
    setFlash(true)
    onCheck()
    setTimeout(() => setFlash(false), 800)
  }

  // Neutral: gray pill showing N/total. Flash: brief green. Done: permanent green.
  const bg    = isDone ? '#2D5016' : flash ? '#16a34a' : '#f0f0f0'
  const color = isDone || flash ? '#fff' : '#71717a'

  return (
    <button onClick={handle} title={`${occDone}/${totalOcc} realizadas`}
      style={{
        minWidth: 48, height: 22, borderRadius: 99, border: 'none',
        cursor: isDone ? 'default' : 'pointer',
        background: bg, color,
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 9px', gap: 3,
        transition: 'background .35s, color .35s',
      }}>
      {(isDone || flash) && <Check size={9} />}
      {`${occDone}/${totalOcc}`}
    </button>
  )
}

/* ── Date chip like Google Calendar ───────────────────────── */
function DateChip({ value, onChange, placeholder, color = '#71717a' }) {
  const ref = useRef(null)
  const formatted = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  function open() {
    if (ref.current) {
      try { ref.current.showPicker() } catch { ref.current.click() }
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid', borderColor: value ? '#C4A882' : '#e4e4e7',
          borderRadius: 99, padding: '3px 10px',
          background: value ? '#FDF8F2' : '#fafafa',
          color: value ? '#7C4A1A' : color,
          fontSize: 12, fontWeight: value ? 600 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#C4A882'}
        onMouseLeave={e => e.currentTarget.style.borderColor = value ? '#C4A882' : '#e4e4e7'}
      >
        <span style={{ fontSize: 11 }}>📅</span>
        {formatted || placeholder}
        {value && (
          <span
            onClick={ev => { ev.stopPropagation(); onChange({ target: { value: '' } }) }}
            style={{ marginLeft: 2, fontSize: 11, color: '#a1a1aa', lineHeight: 1 }}
          >✕</span>
        )}
      </button>
      <input
        ref={ref}
        type="date"
        value={value || ''}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
      />
    </div>
  )
}

/* ── Subtask row ──────────────────────────────────────────── */
function SubtaskRow({ task, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.title || '')
  useEffect(() => { setTitle(task.title || '') }, [task.id])
  function flush() { if (title !== task.title) onUpdate(task.id, { title }) }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginLeft: 32, marginTop: 4,
      padding: '7px 12px',
      background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0',
    }}>
      <button
        onClick={() => onUpdate(task.id, { status: STATUS_NEXT[task.status || 'todo'], completed: STATUS_NEXT[task.status || 'todo'] === 'done' })}
        style={{
          width: 14, height: 14, borderRadius: '50%', border: '2px solid',
          borderColor: task.status === 'done' ? '#2D5016' : '#d4d4d8',
          background: task.status === 'done' ? '#2D5016' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
        }}
      >
        {task.status === 'done' && <Check size={8} style={{ color: '#fff' }} />}
      </button>

      <input
        value={title} onChange={e => setTitle(e.target.value)} onBlur={flush}
        placeholder="Subtarefa…"
        style={{
          flex: 1, border: 'none', background: 'transparent', fontSize: 12,
          color: task.status === 'done' ? '#a1a1aa' : '#3f3f46', outline: 'none',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
        }}
      />

      <DateChip
        value={task.due_date || ''}
        onChange={e => onUpdate(task.id, { due_date: e.target.value || null })}
        placeholder="Prazo"
      />

      <button
        onClick={() => onDelete(task.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4d4d8', display: 'flex', padding: 3, borderRadius: 6 }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#d4d4d8'}
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

/* ── Main task row ────────────────────────────────────────── */
export default function EnhancedTaskRow({ task, subtasks = [], totalOcc = 1, onUpdate, onDelete, onAddSubtask }) {
  const [title, setTitle]       = useState(task.title || '')
  const [notes, setNotes]       = useState(task.notes || '')
  const [showNotes, setShowNotes]       = useState(false)
  const [expanded, setExpanded]         = useState(false)
  const [showRecurrence, setShowRecurrence] = useState(false)

  useEffect(() => { setTitle(task.title || '') }, [task.id])
  useEffect(() => { setNotes(task.notes || '') }, [task.id])

  function flush() { if (title !== task.title) onUpdate(task.id, { title }) }
  function flushNotes() { onUpdate(task.id, { notes }) }
  const rec        = parseRecurrence(task.recurrence)
  const isRecurring = !!rec
  const occDone    = task.occurrences_done || 0
  const isRecDone  = totalOcc > 0 && occDone >= totalOcc

  function cycleStatus() {
    if (isRecurring) {
      const newOcc = occDone + 1
      const done   = newOcc >= totalOcc
      onUpdate(task.id, { occurrences_done: newOcc, status: done ? 'done' : 'doing', completed: done })
    } else {
      const next = STATUS_NEXT[task.status || 'todo']
      onUpdate(task.id, { status: next, completed: next === 'done' })
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Main row */}
      <div
        className="uno-task-row"
        style={{ background: STATUS_BG[task.status || 'todo'], flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
      >
        {/* Check button — recurring shows counter, normal shows status */}
        {isRecurring ? (
          <RecurringCheck occDone={occDone} totalOcc={totalOcc} onCheck={cycleStatus} />
        ) : (
          <button
            onClick={cycleStatus}
            className="uno-check"
            title={`Status: ${task.status || 'todo'}`}
            style={
              task.status === 'done'  ? { background: '#2D5016', borderColor: '#2D5016' } :
              task.status === 'doing' ? { background: '#D4890A', borderColor: '#D4890A' } : {}
            }
          >
            {task.status === 'done'  && <Check size={9} style={{ color: '#fff' }} />}
            {task.status === 'doing' && <div style={{ width: 5, height: 5, background: '#fff', borderRadius: 1 }} />}
          </button>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={flush}
          onKeyDown={e => e.key === 'Enter' && flush()}
          placeholder="Nome da tarefa…"
          style={{
            flex: 1, minWidth: 120, border: 'none', background: 'transparent',
            fontSize: 14, outline: 'none',
            color: task.status === 'done' ? '#a1a1aa' : '#1a1a1a',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}
        />

        {/* Recurrence badge + button */}
        {task.recurrence && (
          <button
            onClick={() => setShowRecurrence(true)}
            style={{ fontSize: 10, color: '#4A0E8F', background: '#EDE9FE', padding: '2px 8px', borderRadius: 99, fontWeight: 600, flexShrink: 0, border: 'none', cursor: 'pointer' }}>
            ↺ {formatRecurrence(task.recurrence)}
          </button>
        )}

        {/* Date chips — Google Calendar style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <DateChip
            value={task.start_date || ''}
            onChange={e => onUpdate(task.id, { start_date: e.target.value || null })}
            placeholder="Início"
          />
          {(task.start_date || task.due_date) && <span style={{ color: '#d4d4d8', fontSize: 12 }}>→</span>}
          <DateChip
            value={task.due_date || ''}
            onChange={e => onUpdate(task.id, { due_date: e.target.value || null })}
            placeholder="Prazo"
          />
        </div>

        {/* Recurrence selector → opens modal */}
        <button
          onClick={() => setShowRecurrence(true)}
          title="Recorrência"
          style={{ fontSize: 12, color: task.recurrence ? '#4A0E8F' : '#a1a1aa', background: task.recurrence ? '#EDE9FE' : '#f4f4f5', border: 'none', cursor: 'pointer', padding: '3px 9px', borderRadius: 8, fontWeight: 600, flexShrink: 0 }}
        >↺</button>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(n => !n)}
          title="Notas"
          style={{ background: showNotes ? '#f0f0f0' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 6px', borderRadius: 6, color: '#a1a1aa' }}
        >📝</button>

        {/* Subtasks toggle */}
        {subtasks.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 11, color: '#71717a', background: '#f4f4f5', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}
          >{subtasks.length} ↳</button>
        )}

        {/* Add subtask */}
        <button
          onClick={() => onAddSubtask(task.id)}
          title="Adicionar subtarefa"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4c7', display: 'flex', padding: 3, borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = '#4A0E8F'}
          onMouseLeave={e => e.currentTarget.style.color = '#c4c4c7'}
        ><Plus size={12} /></button>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4d4d8', display: 'flex', padding: 3, borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#d4d4d8'}
        ><Trash2 size={13} /></button>
      </div>

      {/* Notes */}
      {showNotes && (
        <div style={{ marginLeft: 28, padding: '8px 12px', background: '#FAFAF7', borderRadius: '0 0 10px 10px', border: '1px solid #f0f0f0', borderTop: 'none' }}>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)} onBlur={flushNotes}
            placeholder="Notas sobre essa tarefa…" rows={2}
            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, color: '#3f3f46', outline: 'none', resize: 'none', fontFamily: 'Georgia,serif', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Subtasks */}
      {expanded && subtasks.map(sub => (
        <SubtaskRow key={sub.id} task={sub} onUpdate={onUpdate} onDelete={onDelete} />
      ))}

      {/* Recurrence modal */}
      {showRecurrence && (
        <RecurrenceModal
          raw={task.recurrence}
          onSave={val => onUpdate(task.id, { recurrence: val })}
          onClose={() => setShowRecurrence(false)}
        />
      )}
    </div>
  )
}
