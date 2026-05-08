import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function getCurrentWeekPeriod() {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export function navigateWeek(period, dir) {
  const [y, w] = period.split('-W').map(Number)
  const totalWeeks = 52
  let newW = w + dir
  let newY = y
  if (newW < 1) { newY -= 1; newW = 52 }
  if (newW > totalWeeks) { newY += 1; newW = 1 }
  return `${newY}-W${String(newW).padStart(2, '0')}`
}

export function formatWeekLabel(period, locale = 'pt-BR') {
  const [y, w] = period.split('-W').map(Number)
  const jan4 = new Date(y, 0, 4)
  const monday = new Date(jan4.getTime() + ((1 - (jan4.getDay() || 7)) + (w - 1) * 7) * 86400000)
  const sunday = new Date(monday.getTime() + 6 * 86400000)
  const fmt = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function useWeek(period) {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ how_start: '', how_end: '' })
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !period) return
    setLoading(true)
    setProfile({ how_start: '', how_end: '' })
    Promise.all([
      supabase.from('week_profile').select('*').eq('user_id', user.id).eq('period', period).single(),
      supabase.from('week_tasks').select('*').eq('user_id', user.id).eq('period', period).order('position'),
    ]).then(([p, t]) => {
      if (p.data) setProfile(p.data)
      setTasks(t.data || [])
      setLoading(false)
    })
  }, [user, period])

  async function saveProfileField(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
    await supabase.from('week_profile')
      .upsert({ user_id: user.id, period, [field]: value }, { onConflict: 'user_id,period' })
  }

  async function addTask() {
    const { data, error } = await supabase.from('week_tasks')
      .insert({ user_id: user.id, period, title: '', completed: false, position: tasks.length })
      .select().single()
    if (!error && data) setTasks(prev => [...prev, data])
  }
  async function updateTask(id, field, value) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    await supabase.from('week_tasks').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('week_tasks').delete().eq('id', id).eq('user_id', user.id)
  }

  return { profile, saveProfileField, tasks, addTask, updateTask, deleteTask, loading }
}
