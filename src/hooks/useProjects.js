import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DEFAULT_QUESTIONS = [
  'Qual o propósito desse projeto?',
  'O que esse projeto exige de mim?',
  'O que pode me fazer pará-lo ou repensá-lo?',
  'O que vou desenvolver nesse projeto?',
]

// ── Garden hook ────────────────────────────────────────────────────────────────

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchProjects() }, [user])

  async function fetchProjects() {
    setLoading(true)
    const [pRes, tRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('tasks').select('project_id, title, completed, parent_task_id').eq('user_id', user.id),
    ])
    const allTasks = tRes.data || []
    const projectsWithProgress = (pRes.data || []).map(p => {
      const top = allTasks.filter(t => t.project_id === p.id && !t.parent_task_id)
      const filled = top.filter(t => t.title?.trim())
      const progress = filled.length === 0 ? 0 : Math.round(filled.filter(t => t.completed).length / filled.length * 100)
      return { ...p, progress }
    })
    setProjects(projectsWithProgress)
    setLoading(false)
  }

  async function addProject(title) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title })
      .select()
      .single()
    if (error || !data) return null

    await supabase.from('questions').insert(
      DEFAULT_QUESTIONS.map((text, i) => ({
        project_id: data.id, user_id: user.id, number: i + 1, text, answer: '',
      }))
    )

    const { data: act } = await supabase
      .from('activities')
      .insert({ project_id: data.id, user_id: user.id, title: 'Pré-projeto', position: 0 })
      .select().single()

    if (act) {
      await supabase.from('tasks').insert({
        activity_id: act.id, project_id: data.id, user_id: user.id,
        title: '', completed: false,
      })
    }

    setProjects(prev => [...prev, { ...data, progress: 0 }])
    return data
  }

  async function updateProject(id, title) {
    await supabase.from('projects').update({ title }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title } : p))
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  function refreshProjectProgress(projectId, allTasks) {
    const top = allTasks.filter(t => t.project_id === projectId && !t.parent_task_id)
    const filled = top.filter(t => t.title?.trim())
    const progress = filled.length === 0 ? 0 : Math.round(filled.filter(t => t.completed).length / filled.length * 100)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, progress } : p))
  }

  return { projects, loading, addProject, updateProject, deleteProject, refreshProjectProgress }
}

// ── Project view hook ──────────────────────────────────────────────────────────

export function useProjectView(projectId) {
  const { user } = useAuth()
  const [questions,  setQuestions]  = useState([])
  const [activities, setActivities] = useState([])
  const [tasks,      setTasks]      = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { if (user && projectId) fetchAll() }, [user, projectId])

  async function fetchAll() {
    setLoading(true)
    const [qRes, aRes, tRes] = await Promise.all([
      supabase.from('questions').select('*').eq('project_id', projectId).order('number'),
      supabase.from('activities').select('*').eq('project_id', projectId).order('position'),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    ])
    setQuestions(qRes.data || [])
    setActivities(aRes.data || [])
    setTasks(tRes.data || [])
    setLoading(false)
  }

  // ── Questions ────────────────────────────────────────────────────────────────

  async function updateAnswer(id, answer) {
    await supabase.from('questions').update({ answer }).eq('id', id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer } : q))
  }

  async function deleteQuestion(id) {
    await supabase.from('questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  // ── Activities ───────────────────────────────────────────────────────────────

  async function addActivity() {
    const position = activities.length
    const { data, error } = await supabase
      .from('activities')
      .insert({ project_id: projectId, user_id: user.id, title: 'Pré-projeto', position })
      .select().single()
    if (error) { console.error('addActivity error:', error); return }
    if (!data) return
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({ activity_id: data.id, project_id: projectId, user_id: user.id, title: '', completed: false })
      .select().single()
    if (taskErr) console.error('addActivity seed task error:', taskErr)
    setActivities(prev => [...prev, data])
    if (task) setTasks(prev => [...prev, task])
  }

  async function updateActivityTitle(id, title) {
    await supabase.from('activities').update({ title }).eq('id', id)
    setActivities(prev => prev.map(a => a.id === id ? { ...a, title } : a))
  }

  async function deleteActivity(id) {
    await supabase.from('activities').delete().eq('id', id)
    setActivities(prev => prev.filter(a => a.id !== id))
    setTasks(prev => prev.filter(t => t.activity_id !== id))
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async function addTask(activityId) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ activity_id: activityId, project_id: projectId, user_id: user.id, title: '', completed: false })
      .select().single()
    if (error) { console.error('addTask error:', error); return null }
    if (data) setTasks(prev => [...prev, data])
    return data
  }

  async function addSubTask(parentTaskId, activityId) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ activity_id: activityId, project_id: projectId, user_id: user.id, title: '', completed: false, parent_task_id: parentTaskId })
      .select().single()
    if (error) { console.error('addSubTask error:', error); return null }
    if (data) setTasks(prev => [...prev, data])
    return data
  }

  async function updateTask(id, fields) {
    await supabase.from('tasks').update(fields).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id))
  }

  // ── Progress (only top-level tasks count) ────────────────────────────────────

  function pct(subset) {
    const top = subset.filter(t => !t.parent_task_id)
    const filled = top.filter(t => t.title?.trim())
    if (!filled.length) return 0
    return Math.round(filled.filter(t => t.completed).length / filled.length * 100)
  }

  const progress = pct(tasks)

  function activityProgress(activityId) {
    return pct(tasks.filter(t => t.activity_id === activityId))
  }

  return {
    questions, activities, tasks, loading, progress,
    updateAnswer, deleteQuestion,
    addActivity, updateActivityTitle, deleteActivity,
    addTask, addSubTask, updateTask, deleteTask,
    activityProgress,
  }
}
