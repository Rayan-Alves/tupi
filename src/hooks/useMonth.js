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

const PROFILE_DEFAULTS = {
  how_start: '', how_end: '',
  palavra_do_mes: '', o_que_traz: '',
  pilar_corpo: '', pilar_mente: '', pilar_espirito: '',
}

export function useMonth(period) {
  const { user } = useAuth()
  const [profile, setProfile]   = useState(PROFILE_DEFAULTS)
  const [goals, setGoals]       = useState([])
  const [tasks, setTasks]       = useState([])
  const [events, setEvents]     = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [reading, setReading]   = useState([])
  const [bills, setBills]       = useState([])
  const [health, setHealth]     = useState([])
  const [largar, setLargar]     = useState([])
  const [explorar, setExplorar] = useState([])
  const [stats, setStats]       = useState({ routinesDone: 0, weekBars: [] })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user || !period) return
    setLoading(true)
    setProfile(PROFILE_DEFAULTS)

    const [y, mo] = period.split('-').map(Number)
    const daysInMonth = new Date(y, mo, 0).getDate()
    const start = `${period}-01`
    const end   = `${period}-${String(daysInMonth).padStart(2, '0')}`

    Promise.allSettled([
      supabase.from('month_profile').select('*').eq('user_id', user.id).eq('period', period).maybeSingle(),
      supabase.from('month_goals').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_tasks').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_events').select('*').eq('user_id', user.id).eq('period', period).order('event_date'),
      supabase.from('month_birthdays').select('*').eq('user_id', user.id).eq('period', period).order('birth_date'),
      supabase.from('month_reading').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_bills').select('*').eq('user_id', user.id).eq('period', period).order('day_of_month'),
      supabase.from('month_health').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('month_largar').select('*').eq('user_id', user.id).eq('period', period).order('position'),
      supabase.from('routine_completions').select('completed_date').eq('user_id', user.id).gte('completed_date', start).lte('completed_date', end),
      supabase.from('month_explorar').select('*').eq('user_id', user.id).eq('period', period).order('position'),
    ]).then(([p, g, t, e, b, r, bl, h, l, rc, ex]) => {
      if (p.value?.data) setProfile(prev => ({ ...prev, ...p.value.data }))
      setGoals(g.value?.data || [])
      setTasks(t.value?.data || [])
      setEvents(e.value?.data || [])
      setBirthdays(b.value?.data || [])
      setReading(r.value?.data || [])
      setBills(bl.value?.data || [])
      setHealth(h.value?.data || [])
      setLargar(l.value?.data || [])
      setExplorar(ex.value?.data || [])

      // Compute stats from routine completions
      const completions = rc.value?.data || []
      const routinesDone = completions.length

      // Group by week (days 1-7 = W1, 8-14 = W2, 15-21 = W3, 22-28 = W4, 29+ = W5)
      const weekCounts = [0, 0, 0, 0, 0]
      completions.forEach(({ completed_date }) => {
        const day = parseInt(completed_date.split('-')[2], 10)
        const wi = Math.min(Math.floor((day - 1) / 7), 4)
        weekCounts[wi]++
      })

      // Determine how many weeks the month has
      const lastDay = daysInMonth
      const weeksCount = Math.ceil((new Date(y, mo - 1, 1).getDay() + lastDay) / 7)

      // Build week bars (remove trailing weeks that haven't started)
      const today = new Date()
      const isThisMonth = today.getFullYear() === y && today.getMonth() + 1 === mo
      const todayDay = isThisMonth ? today.getDate() : (today > new Date(y, mo - 1, lastDay) ? lastDay + 1 : 0)

      const weekBars = Array.from({ length: weeksCount }, (_, wi) => {
        const weekStart = wi * 7 + 1
        const weekEnd = Math.min((wi + 1) * 7, lastDay)
        const future = todayDay < weekStart
        return { label: `S${wi + 1}`, count: weekCounts[wi], future, weekStart, weekEnd }
      })

      setStats({ routinesDone, weekBars })
      setLoading(false)
    })
  }, [user, period])

  async function saveProfileField(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
    await supabase.from('month_profile')
      .upsert({ user_id: user.id, period, [field]: value }, { onConflict: 'user_id,period' })
  }

  // ── Goals ──────────────────────────────────────────────────────────
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

  // ── Tasks ──────────────────────────────────────────────────────────
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

  // ── Events ────────────────────────────────────────────────────────
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

  // ── Birthdays ─────────────────────────────────────────────────────
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

  // ── Reading ───────────────────────────────────────────────────────
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

  // ── Bills ─────────────────────────────────────────────────────────
  async function addBill() {
    const { data, error } = await supabase.from('month_bills')
      .insert({ user_id: user.id, period, title: '', day_of_month: null, recurring: false })
      .select().single()
    if (!error && data) setBills(prev => [...prev, data])
  }
  async function updateBill(id, field, value) {
    setBills(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
    await supabase.from('month_bills').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteBill(id) {
    setBills(prev => prev.filter(b => b.id !== id))
    await supabase.from('month_bills').delete().eq('id', id).eq('user_id', user.id)
  }

  // ── Health ────────────────────────────────────────────────────────
  async function addHealth() {
    const { data, error } = await supabase.from('month_health')
      .insert({ user_id: user.id, period, title: '', position: health.length })
      .select().single()
    if (!error && data) setHealth(prev => [...prev, data])
  }
  async function updateHealth(id, field, value) {
    setHealth(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
    await supabase.from('month_health').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteHealth(id) {
    setHealth(prev => prev.filter(h => h.id !== id))
    await supabase.from('month_health').delete().eq('id', id).eq('user_id', user.id)
  }

  // ── Explorar ──────────────────────────────────────────────────────
  async function addExplorar(category) {
    const { data, error } = await supabase.from('month_explorar')
      .insert({ user_id: user.id, period, category, title: '', position: explorar.filter(e => e.category === category).length })
      .select().single()
    if (!error && data) setExplorar(prev => [...prev, data])
  }
  async function updateExplorar(id, field, value) {
    setExplorar(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await supabase.from('month_explorar').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteExplorar(id) {
    setExplorar(prev => prev.filter(e => e.id !== id))
    await supabase.from('month_explorar').delete().eq('id', id).eq('user_id', user.id)
  }

  // ── Largar ────────────────────────────────────────────────────────
  async function addLargar() {
    const { data, error } = await supabase.from('month_largar')
      .insert({ user_id: user.id, period, title: '', position: largar.length })
      .select().single()
    if (!error && data) setLargar(prev => [...prev, data])
  }
  async function updateLargar(id, field, value) {
    setLargar(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    await supabase.from('month_largar').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }
  async function deleteLargar(id) {
    setLargar(prev => prev.filter(l => l.id !== id))
    await supabase.from('month_largar').delete().eq('id', id).eq('user_id', user.id)
  }

  return {
    profile, saveProfileField,
    goals, addGoal, updateGoal, deleteGoal,
    tasks, addTask, updateTask, deleteTask,
    events, addEvent, updateEvent, deleteEvent,
    birthdays, addBirthday, updateBirthday, deleteBirthday,
    reading, addReading, updateReading, deleteReading,
    bills, addBill, updateBill, deleteBill,
    health, addHealth, updateHealth, deleteHealth,
    largar, addLargar, updateLargar, deleteLargar,
    explorar, addExplorar, updateExplorar, deleteExplorar,
    stats, loading,
  }
}
