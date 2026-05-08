import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMind() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ self_thought: '', sabotage: '', turn_gold: '', skills: '', tips: '' })
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      supabase.from('mind_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('mind_goals').select('*').eq('user_id', user.id).order('position'),
      supabase.from('mind_tasks').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('mind_routines').select('*').eq('user_id', user.id).order('created_at'),
    ]).then(([p, g, t, r]) => {
      if (p.data) setProfile(p.data)
      if (g.data) setGoals(g.data)
      if (t.data) setTasks(t.data)
      if (r.data) setRoutines(r.data)
      setLoading(false)
    })
  }, [user])

  async function saveProfileField(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
    await supabase.from('mind_profile').upsert({ user_id: user.id, [field]: value }, { onConflict: 'user_id' })
  }

  async function addGoal() {
    const { data, error } = await supabase
      .from('mind_goals')
      .insert({ user_id: user.id, title: '', why: '', how: '', what_needed: '', reflection: '', position: goals.length })
      .select().single()
    if (!error && data) setGoals(prev => [...prev, data])
  }

  async function saveGoalFields(id, fields) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...fields } : g))
    await supabase.from('mind_goals').update(fields).eq('id', id).eq('user_id', user.id)
  }

  async function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
    setTasks(prev => prev.filter(t => t.goal_id !== id))
    await supabase.from('mind_goals').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addTask(goalId) {
    const { data, error } = await supabase
      .from('mind_tasks')
      .insert({ user_id: user.id, goal_id: goalId, title: '', completed: false, repeat: false, repeat_days: [] })
      .select().single()
    if (!error && data) setTasks(prev => [...prev, data])
  }

  async function updateTask(id, field, value) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    await supabase.from('mind_tasks').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('mind_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addRoutine() {
    const { data, error } = await supabase
      .from('mind_routines')
      .insert({ user_id: user.id, title: '', days: [], start_time: null, end_time: null })
      .select().single()
    if (!error && data) setRoutines(prev => [...prev, data])
  }

  async function saveRoutineField(id, field, value) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    await supabase.from('mind_routines').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }

  async function deleteRoutine(id) {
    setRoutines(prev => prev.filter(r => r.id !== id))
    await supabase.from('mind_routines').delete().eq('id', id).eq('user_id', user.id)
  }

  return {
    profile, saveProfileField,
    goals, addGoal, saveGoalFields, deleteGoal,
    tasks, addTask, updateTask, deleteTask,
    routines, addRoutine, saveRoutineField, deleteRoutine,
    loading,
  }
}
