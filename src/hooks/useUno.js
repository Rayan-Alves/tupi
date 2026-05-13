import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useUno() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('uno_projects').select('*')
      .eq('user_id', user.id).order('created_at')
      .then(({ data }) => { if (data) setProjects(data); setLoading(false) })
  }, [user?.id])

  async function activateDesire(desireId, desireTitle) {
    const { data: existing } = await supabase.from('uno_projects')
      .select('id').eq('user_id', user.id).eq('desire_id', desireId).maybeSingle()
    if (existing) return existing.id
    const { data } = await supabase.from('uno_projects')
      .insert({ user_id: user.id, desire_id: desireId, title: desireTitle || 'Desejo de Alma', stage: 'spirit' })
      .select().single()
    if (data) setProjects(prev => [...prev, data])
    return data?.id
  }

  return { projects, loading, activateDesire }
}

export function useUnoProject(projectId) {
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !projectId) return
    Promise.all([
      supabase.from('uno_projects').select('*').eq('id', projectId).eq('user_id', user.id).single(),
      supabase.from('uno_tasks').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at'),
    ]).then(([p, t]) => {
      if (p.data) setProject(p.data)
      if (t.data) setTasks(t.data)
      setLoading(false)
    })
  }, [user?.id, projectId])

  async function saveField(field, value) {
    setProject(prev => ({ ...prev, [field]: value }))
    await supabase.from('uno_projects').update({ [field]: value }).eq('id', projectId).eq('user_id', user.id)
  }

  async function advanceStage(nextStage) {
    setProject(prev => ({ ...prev, stage: nextStage }))
    await supabase.from('uno_projects').update({ stage: nextStage }).eq('id', projectId).eq('user_id', user.id)
  }

  async function addTask(parentId = null) {
    const { data } = await supabase.from('uno_tasks')
      .insert({ user_id: user.id, project_id: projectId, title: '', completed: false, status: 'todo', notes: '', parent_id: parentId || null })
      .select().single()
    if (data) setTasks(prev => [...prev, data])
  }

  async function updateTask(id, fields) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
    await supabase.from('uno_tasks').update(fields).eq('id', id).eq('user_id', user.id)
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('uno_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  return { project, tasks, loading, saveField, advanceStage, addTask, updateTask, deleteTask }
}
