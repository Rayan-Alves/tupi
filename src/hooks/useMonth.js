import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function getCurrentMonthPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function navigateMonth(period, dir) {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, m - 1 + dir, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(period, locale = 'pt-BR') {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export function useMonth(period) {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ how_start: '', how_end: '' })
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [reading, setReading] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !period) return
    setLoading(true)
    setProfile({ how_start: '', how_end: '' })
    Promise.all([
      supabase.from('month_profile').select('*').eq('user_id', user.id).eq('period', period).single(),
      supabase.from('month_goals').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_tasks').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_events').select('*').eq('user_id', user.id).eq('period', period).order('event_date'),
      supabase.from('month_birthdays').select('*').eq('user_id', user.id).eq('period', period).order('birth_date'),
      supabase.from('month_reading').select('*').eq('user_id', user.id).eq('period', period).order('position'),
    ]).then(([p, g, t, e, b, r]) => {
      if (p.data) setProfile(p.data)
      setGoals(g.data || [])
      setTasks(t.data || [])
      setEvents(e.data || [])
      setBirthdays(b.data || [])
      setReading(r.data || [])
      setLoading(false)
    })
  }, [user, period])

  async function saveProfileField(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
    await supabase.from('month_profile')
      .upsert({ user_id: user.id, period, [field]: value }, { onConflict: 'user_id,period' })
  }

  async function addGoal() {
    const { data, error } = await supabase.from('month_goals')
      .insert({ user_id: user.id, period, title: '', why: '', position: goals.length })
      .select().single()
    if (!error && data) setGoals(prev => [...prev, data])
  }
  async function updateGoal(id, field, value) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
    await supabase.from('month_goals').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
    await supabase.from('month_goals').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addTask() {
    const { data, error } = await supabase.from('month_tasks')
      .insert({ user_id: user.id, period, title: '', due_date: null, completed: false, position: tasks.length })
      .select().single()
    if (!error && data) setTasks(prev => [...prev, data])
  }
  async function updateTask(id, field, value) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    await supabase.from('month_tasks').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('month_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addEvent() {
    const { data, error } = await supabase.from('month_events')
      .insert({ user_id: user.id, period, title: '', event_date: null, position: events.length })
      .select().single()
    if (!error && data) setEvents(prev => [...prev, data])
  }
  async function updateEvent(id, field, value) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await supabase.from('month_events').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
    await supabase.from('month_events').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addBirthday() {
    const { data, error } = await supabase.from('month_birthdays')
      .insert({ user_id: user.id, period, name: '', birth_date: null, position: birthdays.length })
      .select().single()
    if (!error && data) setBirthdays(prev => [...prev, data])
  }
  async function updateBirthday(id, field, value) {
    setBirthdays(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
    await supabase.from('month_birthdays').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteBirthday(id) {
    setBirthdays(prev => prev.filter(b => b.id !== id))
    await supabase.from('month_birthdays').delete().eq('id', id).eq('user_id', user.id)
  }

  async function addReading(type = 'read') {
    const { data, error } = await supabase.from('month_reading')
      .insert({ user_id: user.id, period, title: '', type, completed: false, position: reading.length })
      .select().single()
    if (!error && data) setReading(prev => [...prev, data])
  }
  async function updateReading(id, field, value) {
    setReading(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    await supabase.from('month_reading').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteReading(id) {
    setReading(prev => prev.filter(r => r.id !== id))
    await supabase.from('month_reading').delete().eq('id', id).eq('user_id', user.id)
  }

  return {
    profile, saveProfileField,
    goals, addGoal, updateGoal, deleteGoal,
    tasks, addTask, updateTask, deleteTask,
    events, addEvent, updateEvent, deleteEvent,
    birthdays, addBirthday, updateBirthday, deleteBirthday,
    reading, addReading, updateReading, deleteReading,
    loading,
  }
}
