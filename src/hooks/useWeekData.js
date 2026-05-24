import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const toISO = d => d.toISOString().split('T')[0]

/* Returns the Monday-of-the-week Date for a given Date. */
export function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0..6, Sun = 0
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function shiftWeek(monday, dir) {
  const d = new Date(monday)
  d.setDate(d.getDate() + dir * 7)
  return d
}

/* Returns 7 Date objects, Monday → Sunday. */
function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function useWeekData(monday) {
  const { user } = useAuth()
  const [routines,    setRoutines]    = useState([])
  const [completions, setCompletions] = useState(new Set())
  const [tasks,       setTasks]       = useState([])
  const [projTasks,   setProjTasks]   = useState([])
  const [loading,     setLoading]     = useState(true)

  const dates    = useMemo(() => getWeekDates(monday), [monday])
  const startISO = toISO(dates[0])
  const endISO   = toISO(dates[6])

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [sr, mr, br, dr, comp, dt, pt] = await Promise.allSettled([
      supabase.from('spirit_routines').select('*').eq('user_id', user.id),
      supabase.from('mind_routines').select('*').eq('user_id', user.id),
      supabase.from('body_routines').select('*').eq('user_id', user.id),
      supabase.from('dashboard_routines').select('*').eq('user_id', user.id),
      supabase.from('routine_completions').select('routine_id, completed_date')
        .eq('user_id', user.id).gte('completed_date', startISO).lte('completed_date', endISO),
      supabase.from('day_tasks').select('*')
        .eq('user_id', user.id).gte('task_date', startISO).lte('task_date', endISO).order('created_at'),
      supabase.from('kanban_tasks').select('id,title,completed,project_id,phase,due_date,kanban_projects(title,stage)')
        .eq('user_id', user.id).gte('due_date', startISO).lte('due_date', endISO).order('sort_order'),
    ])
    setRoutines([
      ...(sr.value?.data || []).map(r => ({ ...r, source: 'spirit' })),
      ...(mr.value?.data || []).map(r => ({ ...r, source: 'mind' })),
      ...(br.value?.data || []).map(r => ({ ...r, source: 'body' })),
      ...(dr.value?.data || []).map(r => ({ ...r, source: 'dashboard' })),
    ])
    setCompletions(new Set((comp.value?.data || []).map(c => `${c.routine_id}_${c.completed_date}`)))
    setTasks(dt.value?.data || [])
    const ACTIVE = new Set(['plant', 'water', 'harvest'])
    setProjTasks((pt.value?.data || [])
      .filter(t => t.kanban_projects && ACTIVE.has(t.kanban_projects.stage))
      .map(t => ({ ...t, projects: t.kanban_projects })))
    setLoading(false)
  }, [user?.id, startISO, endISO])

  useEffect(() => { refresh() }, [refresh])

  /* Per-day computed view */
  const byDay = useMemo(() => {
    return dates.map(date => {
      const dayKey = DAY_KEYS[date.getDay()]
      const iso    = toISO(date)
      const dayRoutines = routines.filter(r => (r.days || []).includes(dayKey))
      const completedRoutines = dayRoutines.filter(r => completions.has(`${r.id}_${iso}`))
      const dayTasks = tasks.filter(t => t.task_date === iso && !t.parent_id)
      const completedTasks = dayTasks.filter(t => t.completed)
      const dayProjTasks = projTasks.filter(t => t.due_date === iso)
      const completedProjTasks = dayProjTasks.filter(t => t.completed)
      return {
        date, iso, dayKey,
        routines: dayRoutines,
        completedRoutines: new Set(completedRoutines.map(r => r.id)),
        tasks: dayTasks,
        completedTasksCount: completedTasks.length,
        projTasks: dayProjTasks,
        completedProjTasksCount: completedProjTasks.length,
      }
    })
  }, [dates, routines, completions, tasks, projTasks])

  /* Aggregated week stats */
  const stats = useMemo(() => {
    const totalRoutines  = byDay.reduce((s, d) => s + d.routines.length, 0)
    const doneRoutines   = byDay.reduce((s, d) => s + d.completedRoutines.size, 0)
    const totalTasks     = byDay.reduce((s, d) => s + d.tasks.length, 0)
    const doneTasks      = byDay.reduce((s, d) => s + d.completedTasksCount, 0)
    const totalProjTasks = byDay.reduce((s, d) => s + d.projTasks.length, 0)
    const doneProjTasks  = byDay.reduce((s, d) => s + d.completedProjTasksCount, 0)
    const total          = totalRoutines + totalTasks + totalProjTasks
    const done           = doneRoutines + doneTasks + doneProjTasks
    const pct            = total > 0 ? Math.round((done / total) * 100) : 0
    return { totalRoutines, doneRoutines, totalTasks, doneTasks, totalProjTasks, doneProjTasks, total, done, pct }
  }, [byDay])

  async function toggleRoutine(routineId, source, dateISO) {
    const key = `${routineId}_${dateISO}`
    const isDone = completions.has(key)
    if (isDone) {
      const next = new Set(completions); next.delete(key)
      setCompletions(next)
      await supabase.from('routine_completions')
        .delete().eq('user_id', user.id).eq('routine_id', routineId).eq('completed_date', dateISO)
    } else {
      setCompletions(prev => new Set([...prev, key]))
      await supabase.from('routine_completions')
        .upsert({ user_id: user.id, routine_id: routineId, source, completed_date: dateISO },
                { onConflict: 'user_id,routine_id,completed_date' })
    }
  }

  async function addTask(dateISO) {
    const { data } = await supabase.from('day_tasks')
      .insert({ user_id: user.id, title: '', completed: false, task_date: dateISO })
      .select().single()
    if (data) setTasks(prev => [...prev, data])
    return data
  }

  async function addTasksBulk(dates, title) {
    if (!dates.length || !title.trim()) return
    const trimmedTitle = title.trim()

    // Optimistic: show tasks immediately in the week view
    const tempTasks = dates
      .filter(d => d >= startISO && d <= endISO)
      .map(d => ({
        id: `temp-${d}-${Math.random().toString(36).slice(2)}`,
        title: trimmedTitle, completed: false,
        task_date: d, user_id: user.id, parent_id: null,
        created_at: new Date().toISOString(),
      }))
    const tempIds = new Set(tempTasks.map(t => t.id))
    if (tempTasks.length) setTasks(prev => [...prev, ...tempTasks])

    const inserted = []
    for (const d of dates) {
      const { data, error } = await supabase
        .from('day_tasks')
        .insert({ user_id: user.id, title: trimmedTitle, completed: false, task_date: d })
        .select()
        .single()
      if (data) inserted.push(data)
      else if (error) console.warn('addTasksBulk error:', d, error.message)
    }

    // Replace temp rows with real DB rows (or drop if insert failed)
    setTasks(prev => {
      const withoutTemp = prev.filter(t => !tempIds.has(t.id))
      const weekRows = inserted.filter(r => r.task_date >= startISO && r.task_date <= endISO)
      return [...withoutTemp, ...weekRows]
    })
  }

  async function updateTask(id, changes) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
    await supabase.from('day_tasks').update(changes).eq('id', id).eq('user_id', user.id)
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('day_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  async function toggleProjTask(id) {
    const t = projTasks.find(x => x.id === id)
    if (!t) return
    const next = !t.completed
    setProjTasks(prev => prev.map(x => x.id === id ? { ...x, completed: next } : x))
    await supabase.from('kanban_tasks').update({ completed: next }).eq('id', id).eq('user_id', user.id)
  }

  return { byDay, dates, stats, loading, toggleRoutine, addTask, addTasksBulk, updateTask, deleteTask, toggleProjTask, refresh }
}
