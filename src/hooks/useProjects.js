import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from('kanban_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('kanban_tasks').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    if (p) setProjects(p)
    if (t) setTasks(t)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  async function addProject(data) {
    const { data: p } = await supabase
      .from('kanban_projects').insert({ user_id: user.id, ...data }).select().single()
    if (p) setProjects(prev => [p, ...prev])
    return p
  }

  async function updateProject(id, changes) {
    const { data: p } = await supabase
      .from('kanban_projects')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id).select().single()
    if (p) setProjects(prev => prev.map(x => x.id === id ? p : x))
    return p
  }

  async function deleteProject(id) {
    await supabase.from('kanban_projects').delete().eq('id', id).eq('user_id', user.id)
    setProjects(prev => prev.filter(x => x.id !== id))
    setTasks(prev => prev.filter(x => x.project_id !== id))
  }

  async function addTask(projectId, phase, data = {}) {
    const order = tasks.filter(t => t.project_id === projectId && t.phase === phase).length
    const { data: t } = await supabase
      .from('kanban_tasks')
      .insert({ user_id: user.id, project_id: projectId, phase, sort_order: order, title: '', ...data })
      .select().single()
    if (t) setTasks(prev => [...prev, t])
    return t
  }

  async function updateTask(id, changes) {
    // 1. Optimistic: apply changes immediately so UI never reverts
    setTasks(prev => prev.map(x => x.id === id ? { ...x, ...changes } : x))

    const { data: t, error } = await supabase
      .from('kanban_tasks').update(changes).eq('id', id).eq('user_id', user.id).select().single()

    if (error) {
      console.warn('updateTask error:', error.message, '— fields:', Object.keys(changes))
      // Keep optimistic state — don't revert
    } else if (t) {
      // 2. Merge ONLY the changed fields from DB (+ server-computed fields).
      //    Never do a full replace — that would wipe fields set by other concurrent saves.
      const safeSync = { ...changes }
      if ('completed_count' in t) safeSync.completed_count = t.completed_count
      if ('recurring'       in t) safeSync.recurring       = t.recurring
      setTasks(prev => prev.map(x => x.id === id ? { ...x, ...safeSync } : x))
    }
    return t
  }

  async function deleteTask(id) {
    await supabase.from('kanban_tasks').delete().eq('id', id).eq('user_id', user.id)
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  return { projects, tasks, loading, addProject, updateProject, deleteProject, addTask, updateTask, deleteTask }
}
