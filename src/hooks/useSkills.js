import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useSkills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)   // { skillId, milestones, notes, resources }
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('mind_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSkills(data)
        setLoading(false)
      })
  }, [user?.id])

  async function addSkill() {
    const { data, error } = await supabase
      .from('mind_skills')
      .insert({
        user_id: user.id,
        name: '',
        type: 'quero-aprender',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (!error && data) {
      setSkills(prev => [data, ...prev])
      return data
    }
  }

  async function updateSkill(id, fields) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s))
    await supabase.from('mind_skills').update(fields).eq('id', id).eq('user_id', user.id)
  }

  async function deleteSkill(id) {
    setSkills(prev => prev.filter(s => s.id !== id))
    await supabase.from('mind_skills').delete().eq('id', id).eq('user_id', user.id)
  }

  async function loadDetail(skillId) {
    setDetailLoading(true)
    const [m, n, r] = await Promise.all([
      supabase.from('skill_milestones').select('*').eq('skill_id', skillId).order('order'),
      supabase.from('skill_notes').select('*').eq('skill_id', skillId).order('created_at', { ascending: false }),
      supabase.from('skill_resources').select('*').eq('skill_id', skillId).order('created_at'),
    ])
    setDetail({
      skillId,
      milestones: m.data || [],
      notes:      n.data || [],
      resources:  r.data || [],
    })
    setDetailLoading(false)
  }

  function clearDetail() { setDetail(null) }

  /* ── Milestones ── */
  async function addMilestone(skillId) {
    const order = detail?.milestones?.length ?? 0
    const { data, error } = await supabase
      .from('skill_milestones')
      .insert({ skill_id: skillId, user_id: user.id, text: '', done: false, order })
      .select()
      .single()
    if (!error && data)
      setDetail(prev => ({ ...prev, milestones: [...(prev?.milestones ?? []), data] }))
  }

  async function updateMilestone(id, fields) {
    setDetail(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === id ? { ...m, ...fields } : m),
    }))
    await supabase.from('skill_milestones').update(fields).eq('id', id)
  }

  async function deleteMilestone(id) {
    setDetail(prev => ({ ...prev, milestones: prev.milestones.filter(m => m.id !== id) }))
    await supabase.from('skill_milestones').delete().eq('id', id)
  }

  /* ── Notes ── */
  async function addNote(skillId, text) {
    const { data, error } = await supabase
      .from('skill_notes')
      .insert({ skill_id: skillId, user_id: user.id, text })
      .select()
      .single()
    if (!error && data)
      setDetail(prev => ({ ...prev, notes: [data, ...(prev?.notes ?? [])] }))
  }

  /* ── Resources ── */
  async function addResource(skillId, name, type, url) {
    const { data, error } = await supabase
      .from('skill_resources')
      .insert({ skill_id: skillId, user_id: user.id, name, type, url: url ?? '' })
      .select()
      .single()
    if (!error && data)
      setDetail(prev => ({ ...prev, resources: [...(prev?.resources ?? []), data] }))
  }

  async function deleteResource(id) {
    setDetail(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== id) }))
    await supabase.from('skill_resources').delete().eq('id', id)
  }

  return {
    skills, loading,
    addSkill, updateSkill, deleteSkill,
    detail, detailLoading, loadDetail, clearDetail,
    addMilestone, updateMilestone, deleteMilestone,
    addNote,
    addResource, deleteResource,
  }
}
