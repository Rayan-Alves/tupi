import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjects } from '../../hooks/useProjects'
import LeafCard from '../../components/projects/LeafCard'
import ProjectView from '../../components/projects/ProjectView'

export default function ProjectsTab() {
  const { t } = useTranslation()
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects()
  const [selectedProject, setSelectedProject] = useState(null)
  const [showNew, setShowNew] = useState(false)

  async function handleSaveNew(title) {
    setShowNew(false)
    const data = await addProject(title)
    if (data) setSelectedProject(data)
  }

  // If a project is open, show its inner view
  if (selectedProject) {
    const current = projects.find(p => p.id === selectedProject.id) || selectedProject
    return (
      <ProjectView
        project={current}
        onBack={() => setSelectedProject(null)}
        onUpdateTitle={title => updateProject(current.id, title)}
      />
    )
  }

  const totalProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress ?? 0), 0) / projects.length)
    : 0

  return (
    <div className="max-w-3xl mx-auto px-2 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#1A3A1F]">
            {t('projects.gardenTitle')}
          </h2>
          {projects.length > 0 && (
            <p className="text-[12px] text-[#C4A882] mt-0.5">
              {t('projects.gardenSubtitle', { count: projects.length, pct: totalProgress })}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-[#C4A882] text-sm">{t('common.loading')}</div>
      ) : (
        <>
          {/* Empty state */}
          {projects.length === 0 && !showNew && (
            <p className="text-[13px] text-[#C4A882] mb-6">{t('projects.emptyHint')}</p>
          )}

          {/* Garden grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-8 items-end">
            {projects.map(project => (
              <LeafCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}

            {/* New project leaf */}
            {showNew && (
              <LeafCard
                isNew
                onSave={handleSaveNew}
                onCancel={() => setShowNew(false)}
              />
            )}

            {/* Add button */}
            {!showNew && (
              <div className="flex flex-col items-center">
                <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #C4A882)' }} />
                <button
                  onClick={() => setShowNew(true)}
                  aria-label={t('projects.newProject')}
                  className="w-[46px] h-[46px] rounded-full border-2 border-dashed border-[#C4A882] hover:border-[#C8841A] text-[#C4A882] hover:text-[#C8841A] transition-colors flex items-center justify-center text-xl font-light"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
