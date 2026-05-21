import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * useHabits — backing data for the "Soltar" feature.
 *
 * Habits live in `body_habits`, their progressive stages in `body_habit_stages`.
 * Each stage has a `marked_days` jsonb array (booleans), one entry per day
 * in [startDate..endDate] inclusive.
 *
 * The hook exposes: { habits, stagesByHabit, loading, addHabit, updateHabit,
 * deleteHabit, addStage, updateStage, toggleDay, completeStage }
 */
export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])         // array of habit rows
  const [stages, setStages] = useState([])         // array of stage rows
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [h, s] = await Promise.all([
      supabase.from('body_habits').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('body_habit_stages').select('*').eq('user_id', user.id).order('stage_order'),
    ])
    if (h.data) setHabits(h.data)
    if (s.data) setStages(s.data)
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  function stagesByHabit(habitId) {
    return stages.filter(s => s.habit_id === habitId).sort((a, b) => a.stage_order - b.stage_order)
  }

  async function addHabit({ name, why, how, pulse }, firstStage) {
    const { data: habit, error } = await supabase
      .from('body_habits')
      .insert({ user_id: user.id, name, why, how, pulse, status: 'active' })
      .select().single()
    if (error || !habit) return null
    setHabits(prev => [...prev, habit])

    // Insert first stage
    const stage = await insertStage(habit.id, {
      stage_order: 1,
      step:       firstStage.step,
      start_date: firstStage.start_date,
      end_date:   firstStage.end_date,
      total_days: firstStage.total_days,
    })
    return { habit, stage }
  }

  async function updateHabit(id, patch) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h))
    await supabase.from('body_habits').update(patch).eq('id', id).eq('user_id', user.id)
  }

  async function deleteHabit(id) {
    setHabits(prev => prev.filter(h => h.id !== id))
    setStages(prev => prev.filter(s => s.habit_id !== id))
    await supabase.from('body_habits').delete().eq('id', id).eq('user_id', user.id)
  }

  async function insertStage(habitId, partial) {
    const marked = Array(partial.total_days || 0).fill(false)
    const { data, error } = await supabase
      .from('body_habit_stages')
      .insert({
        user_id: user.id, habit_id: habitId,
        marked_days: marked,
        reflection: '',
        ...partial,
      })
      .select().single()
    if (error || !data) return null
    setStages(prev => [...prev, data])
    return data
  }

  async function addStage(habitId, { step, start_date, end_date, total_days }) {
    const habitStages = stagesByHabit(habitId)
    const order = habitStages.length + 1
    return insertStage(habitId, { stage_order: order, step, start_date, end_date, total_days })
  }

  async function updateStage(id, patch) {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    await supabase.from('body_habit_stages').update(patch).eq('id', id).eq('user_id', user.id)
  }

  // Cycle a day's state: 0 (untouched) → 1 (done) → 2 (missed) → 0
  async function cycleDay(stageId, dayIndex) {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return
    const normalized = (stage.marked_days || []).map(normalizeDayValue)
    while (normalized.length < stage.total_days) normalized.push(0)
    const cur = normalized[dayIndex] || 0
    normalized[dayIndex] = (cur + 1) % 3
    await updateStage(stageId, { marked_days: normalized })
    return normalized
  }

  // Convenience: extend a stage end date. Pads marked_days with 0s if longer,
  // truncates from the tail if shorter (won't go below today's index + 1).
  async function extendStage(stageId, newEndISO) {
    const stage = stages.find(s => s.id === stageId)
    if (!stage || !stage.start_date) return
    const newTotal = daysBetweenInclusive(stage.start_date, newEndISO)
    if (newTotal <= 0) return
    const current = (stage.marked_days || []).map(normalizeDayValue)
    let next
    if (newTotal >= current.length) {
      next = [...current, ...Array(newTotal - current.length).fill(0)]
    } else {
      next = current.slice(0, newTotal)
    }
    await updateStage(stageId, {
      end_date: newEndISO,
      total_days: newTotal,
      marked_days: next,
    })
  }

  async function saveReflection(stageId, reflection) {
    await updateStage(stageId, { reflection })
  }

  async function completeStage(stageId) {
    await updateStage(stageId, { completed_at: new Date().toISOString() })
  }

  async function completeHabit(habitId) {
    await updateHabit(habitId, { status: 'completed' })
  }

  async function reopenHabit(habitId) {
    await updateHabit(habitId, { status: 'active' })
  }

  return {
    habits, stages, stagesByHabit, loading,
    addHabit, updateHabit, deleteHabit,
    addStage, updateStage, cycleDay, extendStage,
    saveReflection, completeStage,
    completeHabit, reopenHabit,
    reload,
  }
}

/* ─── Day-state helpers ────────────────────────────────────────────────
   marked_days[i] is a tristate: 0 = untouched, 1 = done, 2 = missed.
   Legacy values: true → 1, false → 0. */

export function normalizeDayValue(v) {
  if (v === 1 || v === true || v === 'done')  return 1
  if (v === 2 || v === 'miss' || v === 'missed') return 2
  return 0
}
export function normalizeDays(arr, total) {
  const n = Array.isArray(arr) ? arr.map(normalizeDayValue) : []
  while (n.length < (total || 0)) n.push(0)
  return n.slice(0, total || n.length)
}

/* ─── Helpers (pure, useful in views) ────────────────────────────────── */

export function daysBetweenInclusive(startISO, endISO) {
  if (!startISO || !endISO) return 0
  const s = new Date(startISO + 'T00:00:00')
  const e = new Date(endISO + 'T00:00:00')
  const diff = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1
  return Math.max(0, diff)
}

export function todayIndexInStage(stage) {
  if (!stage?.start_date) return -1
  const start = new Date(stage.start_date + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - start) / (24 * 60 * 60 * 1000))
  if (diff < 0 || diff >= stage.total_days) return -1
  return diff
}

export function markedCount(stage) {
  if (!stage || !Array.isArray(stage.marked_days)) return 0
  return stage.marked_days.filter(v => normalizeDayValue(v) === 1).length
}

export function missedCount(stage) {
  if (!stage || !Array.isArray(stage.marked_days)) return 0
  return stage.marked_days.filter(v => normalizeDayValue(v) === 2).length
}

export function addressedCount(stage) {
  if (!stage || !Array.isArray(stage.marked_days)) return 0
  return stage.marked_days.filter(v => normalizeDayValue(v) !== 0).length
}

export function consistency(stage) {
  if (!stage || !stage.total_days) return 0
  return Math.round((markedCount(stage) / stage.total_days) * 100)
}

export function activeStage(stages) {
  if (!stages || stages.length === 0) return null
  // active = first stage without completed_at, else last
  const open = stages.find(s => !s.completed_at)
  return open || stages[stages.length - 1]
}

export function addDaysISO(startISO, days) {
  const d = new Date(startISO + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayISO() {
  const d = new Date(); d.setHours(0,0,0,0)
  return d.toISOString().slice(0, 10)
}
