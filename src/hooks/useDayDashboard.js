import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TODAY     = new Date().toISOString().split('T')[0]
export const TODAY_KEY = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]

export function useDayDashboard() {
  const { user } = useAuth()
  const [spiritR, setSpiritR]   = useState([])
  const [mindR,   setMindR]     = useState([])
  const [bodyR,   setBodyR]     = useState([])
  const [dashR,   setDashR]     = useState([])
  const [completions, setComp]  = useState(new Set())
  const [dayTasks, setDayTasks] = useState([])
  const [projTasks, setProjT]   = useState([])
  const [note, setNote]         = useState({ id: null, content: '' })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.allSettled([
      supabase.from('spirit_routines').select('*').eq('user_id', user.id),
      supabase.from('mind_routines').select('*').eq('user_id', user.id),
      supabase.from('body_routines').select('*').eq('user_id', user.id),
      supabase.from('dashboard_routines').select('*').eq('user_id', user.id),
      supabase.from('routine_completions').select('routine_id').eq('user_id', user.id).eq('completed_date', TODAY),
      supabase.from('day_tasks').select('*').eq('user_id', user.id).eq('task_date', TODAY).order('created_at'),
      supabase.from('kanban_tasks').select('id,title,completed,project_id,phase,due_date,kanban_projects(title,stage)').eq('user_id', user.id).eq('completed', false).order('sort_order'),
      supabase.from('day_notes').select('*').eq('user_id', user.id).eq('note_date', TODAY).maybeSingle(),
    ]).then(([sr, mr, br, dr, comp, dt, pt, dn]) => {
      setSpiritR(sr.value?.data || [])
      setMindR(mr.value?.data || [])
      setBodyR(br.value?.data || [])
      setDashR(dr.value?.data || [])
      setComp(new Set((comp.value?.data || []).map(c => c.routine_id)))
      setDayTasks(dt.value?.data || [])
      const filtered = (pt.value?.data || [])
      setProjT(filtered.map(t => ({ ...t, projects: t.kanban_projects })))
      if (dn.value?.data) setNote({ id: dn.value.data.id, content: dn.value.data.content || '' })
      setLoading(false)
    })
  }, [user])

  // Routines active today
  const routinesToday = [
    ...spiritR.filter(r => (r.days||[]).includes(TODAY_KEY)).map(r => ({...r, source:'spirit'})),
    ...mindR.filter(r => (r.days||[]).includes(TODAY_KEY)).map(r => ({...r, source:'mind'})),
    ...bodyR.filter(r => (r.days||[]).includes(TODAY_KEY)).map(r => ({...r, source:'body'})),
    ...dashR.filter(r => (r.days||[]).includes(TODAY_KEY)).map(r => ({...r, source:'dashboard'})),
  ]

  async function toggleRoutine(id, source) {
    const done = completions.has(id)
    if (done) {
      setComp(prev => { const s = new Set(prev); s.delete(id); return s })
      await supabase.from('routine_completions').delete().eq('user_id', user.id).eq('routine_id', id).eq('completed_date', TODAY)
    } else {
      setComp(prev => new Set([...prev, id]))
      await supabase.from('routine_completions').upsert({ user_id: user.id, routine_id: id, source, completed_date: TODAY }, { onConflict: 'user_id,routine_id,completed_date' })
    }
  }

  async function addDashRoutine(data) {
    const { data: row } = await supabase.from('dashboard_routines').insert({ user_id: user.id, ...data }).select().single()
    if (row) setDashR(prev => [...prev, row])
  }

  async function deleteDashRoutine(id) {
    setDashR(prev => prev.filter(r => r.id !== id))
    await supabase.from('dashboard_routines').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addDayTask(parentId = null) {
    // 1. Add immediately (optimistic)
    const tempId = `temp-${Date.now()}`
    const tempTask = {
      id: tempId, title: '', completed: false,
      parent_id: parentId, task_date: TODAY,
      created_at: new Date().toISOString(),
    }
    setDayTasks(prev => [...prev, tempTask])

    // 2. Persist to DB in background
    try {
      const { data, error } = await supabase
        .from('day_tasks')
        .insert({ user_id: user.id, title: '', completed: false, parent_id: parentId, task_date: TODAY })
        .select().single()
      if (data) {
        // Replace temp with real DB row
        setDayTasks(prev => prev.map(t => t.id === tempId ? data : t))
        return data
      }
      if (error) console.warn('day_tasks insert error:', error.message)
    } catch (e) {
      console.warn('day_tasks unavailable, using local-only mode')
    }
    return tempTask
  }

  async function updateDayTask(id, changes) {
    setDayTasks(prev => prev.map(t => t.id === id ? {...t, ...changes} : t))
    if (id.startsWith('temp-')) return // Not in DB yet
    await supabase.from('day_tasks').update(changes).eq('id', id).eq('user_id', user.id)
  }

  async function deleteDayTask(id) {
    setDayTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id))
    if (id.startsWith('temp-')) return // Not in DB yet
    await supabase.from('day_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  async function toggleProjTask(id) {
    const task = projTasks.find(t => t.id === id)
    if (!task) return
    const next = !task.completed
    setProjT(prev => prev.map(t => t.id === id ? {...t, completed: next} : t))
    await supabase.from('kanban_tasks').update({ completed: next }).eq('id', id).eq('user_id', user.id)
  }

  async function saveNote(content) {
    setNote(n => ({...n, content}))
    if (note.id) {
      await supabase.from('day_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', note.id)
    } else {
      const { data } = await supabase.from('day_notes').upsert({ user_id: user.id, note_date: TODAY, content }, { onConflict: 'user_id,note_date' }).select().single()
      if (data) setNote({ id: data.id, content })
    }
  }

  return {
    loading,
    routinesToday, completions, toggleRoutine, addDashRoutine, deleteDashRoutine,
    dayTasks, addDayTask, updateDayTask, deleteDayTask,
    projTasks, toggleProjTask,
    note, saveNote,
  }
}
