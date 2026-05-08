import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus } from 'lucide-react'
import { useProjectView } from '../../hooks/useProjects'
import QuestionsList from './QuestionsList'
import PreProjetoCard from './PreProjetoCard'

function EditableTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
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
        className="font-display text-2xl font-semibold text-[#1A3A1F] bg-transparent border-b-2 border-[#C4A882] focus:outline-none w-full max-w-md"
      />
    )
  }

  return (
    <h1
      onDoubleClick={() => { setDraft(value); setEditing(true) }}
      title="Duplo clique para editar"
      className="font-display text-2xl font-semibold text-[#1A3A1F] cursor-text select-none"
    >
      {value}
    </h1>
  )
}

export default function ProjectView({ project, onBack, onUpdateTitle }) {
  const { t } = useTranslation()
  const {
    questions, activities, tasks, loading, progress,
    updateAnswer, deleteQuestion,
    addActivity, updateActivityTitle, deleteActivity,
    addTask, addSubTask, updateTask, deleteTask,
    activityProgress,
  } = useProjectView(project.id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#C4A882] text-sm">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-2 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-[#C4A882] hover:text-[#1A3A1F] transition-colors"
        >
          <ArrowLeft size={14} />
          {t('projects.backToGarden')}
        </button>

        <div className="flex items-start justify-between gap-4">
          <EditableTitle value={project.title} onSave={onUpdateTitle} />
          {progress > 0 && (
            <span className="text-[11px] font-semibold text-[#2D5016] mt-1.5 flex-shrink-0">
              {progress}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-[#E8E0D0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D5016] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <section>
        <h2 className="font-display text-base font-semibold text-[#1A3A1F] mb-3">
          {t('projects.questionsTitle')}
        </h2>
        <QuestionsList
          questions={questions}
          onUpdateAnswer={updateAnswer}
          onDelete={deleteQuestion}
        />
      </section>

      {/* Activities */}
      <section>
        <h2 className="font-display text-base font-semibold text-[#1A3A1F] mb-3">
          {t('projects.activitiesTitle')}
        </h2>

        <div className="flex flex-wrap gap-4">
          {activities.map(activity => (
            <PreProjetoCard
              key={activity.id}
              activity={activity}
              tasks={tasks.filter(t => t.activity_id === activity.id)}
              progress={activityProgress(activity.id)}
              onUpdateTitle={updateActivityTitle}
              onDelete={deleteActivity}
              onAddTask={addTask}
              onAddSubTask={addSubTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          ))}
        </div>

        <button
          onClick={addActivity}
          className="flex items-center gap-1.5 text-[12px] text-[#C4A882] hover:text-[#1A3A1F] transition-colors mt-4"
        >
          <Plus size={14} />
          {t('projects.addActivity')}
        </button>
      </section>
    </div>
  )
}
