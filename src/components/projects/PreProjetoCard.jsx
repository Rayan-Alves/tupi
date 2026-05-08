import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, X } from 'lucide-react'

function EditableTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() {
    setEditing(false)
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        className="text-[13px] font-semibold text-[#1A3A1F] bg-transparent border-b border-[#C4A882] focus:outline-none w-full"
      />
    )
  }

  return (
    <span
      onDoubleClick={() => { setDraft(value); setEditing(true) }}
      title="Duplo clique para editar"
      className="text-[13px] font-semibold text-[#1A3A1F] cursor-text select-none"
    >
      {value}
    </span>
  )
}

function TaskInput({ task, onUpdate, onDelete, autoFocus, onEnter, isSubtask = false }) {
  const { t } = useTranslation()
  const [title, setTitle]       = useState(task.title)
  const [completed, setCompleted] = useState(task.completed)
  const timerRef   = useRef(null)
  const isFocused  = useRef(false)
  const inputRef   = useRef(null)

  useEffect(() => { if (!isFocused.current) setTitle(task.title) }, [task.title])
  useEffect(() => { if (!isFocused.current) setCompleted(task.completed) }, [task.completed])
  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleTitleChange(e) {
    const v = e.target.value
    setTitle(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onUpdate(task.id, { title: v }), 700)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(timerRef.current)
      onUpdate(task.id, { title })
      onEnter?.()
    }
  }

  function handleCheck(e) {
    const v = e.target.checked
    setCompleted(v)
    onUpdate(task.id, { completed: v })
  }

  return (
    <div className={`group/row flex items-center gap-2 py-1.5 ${isSubtask ? 'pl-5' : ''}`}>
      <input
        type="checkbox"
        checked={completed}
        onChange={handleCheck}
        aria-label={t('projects.toggleTask')}
        className="w-3.5 h-3.5 rounded-sm border-[#C4A882] text-[#2D5016] accent-[#2D5016] flex-shrink-0 cursor-pointer"
      />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { isFocused.current = true }}
        onBlur={() => {
          isFocused.current = false
          clearTimeout(timerRef.current)
          onUpdate(task.id, { title })
        }}
        placeholder={t('projects.taskPlaceholder')}
        className={`flex-1 text-[12px] bg-transparent border-0 focus:outline-none placeholder-[#C4A882] min-w-0 ${
          completed ? 'line-through text-[#C4A882]' : 'text-[#1A3A1F]'
        }`}
      />
      <button
        onClick={() => onDelete(task.id)}
        aria-label={t('projects.deleteTask')}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity text-[#C4A882] hover:text-[#A83228] flex-shrink-0 p-0.5"
      >
        <X size={11} />
      </button>
    </div>
  )
}

export default function PreProjetoCard({
  activity, tasks, progress,
  onUpdateTitle, onDelete,
  onAddTask, onAddSubTask,
  onUpdateTask, onDeleteTask,
}) {
  const { t } = useTranslation()
  const [focusId, setFocusId] = useState(null)

  const topTasks = tasks.filter(t => !t.parent_task_id)
  const subTasks = (parentId) => tasks.filter(t => t.parent_task_id === parentId)

  async function handleAddTask() {
    const task = await onAddTask(activity.id)
    if (task) setFocusId(task.id)
  }

  async function handleAddSubTask(parentTaskId) {
    const task = await onAddSubTask(parentTaskId, activity.id)
    if (task) setFocusId(task.id)
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#E8E0D0] rounded-2xl p-4 min-w-[220px] flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <EditableTitle value={activity.title} onSave={title => onUpdateTitle(activity.id, title)} />
        <div className="flex items-center gap-2 flex-shrink-0">
          {progress > 0 && (
            <span className="text-[10px] font-semibold text-[#2D5016] bg-[#2D5016]/10 px-2 py-0.5 rounded-full">
              {progress}%
            </span>
          )}
          <button
            onClick={() => onDelete(activity.id)}
            aria-label={t('projects.deleteActivity')}
            className="text-[#C4A882] hover:text-[#A83228] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-[#EDE7DA]">
        {topTasks.map(task => (
          <div key={task.id}>
            <div className="group/task flex items-center">
              <div className="flex-1 min-w-0">
                <TaskInput
                  task={task}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                  autoFocus={task.id === focusId}
                  onEnter={handleAddTask}
                />
              </div>
              {/* Subtask + button — aparece só quando a task tem título */}
              {task.title?.trim() && (
                <button
                  onClick={() => handleAddSubTask(task.id)}
                  aria-label="Adicionar subtarefa"
                  className="opacity-0 group-hover/task:opacity-100 transition-opacity text-[#C4A882] hover:text-[#1A3A1F] flex-shrink-0 p-0.5 mr-1"
                >
                  <Plus size={11} />
                </button>
              )}
            </div>

            {/* Subtasks */}
            {subTasks(task.id).map(sub => (
              <TaskInput
                key={sub.id}
                task={sub}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                autoFocus={sub.id === focusId}
                onEnter={() => handleAddSubTask(task.id)}
                isSubtask
              />
            ))}
          </div>
        ))}
      </div>

      {/* Add task */}
      <button
        onClick={handleAddTask}
        className="flex items-center gap-1 text-[11px] text-[#C4A882] hover:text-[#1A3A1F] transition-colors mt-3"
      >
        <Plus size={12} />
        {t('projects.addTask')}
      </button>
    </div>
  )
}
