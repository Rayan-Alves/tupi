import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useShadowWork() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('shadow_work_sessions')
      .select('id, title, canvas_aes, node_style, entry_bg, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setSessions(data)
        setLoading(false)
      })
  }, [user?.id])

  async function createSession({ canvasAes = 'mono', nodeStyle = 'floating', entryBg = 'neblina' } = {}) {
    const { data, error } = await supabase
      .from('shadow_work_sessions')
      .insert({ user_id: user.id, title: '', nodes: {}, connections: [], canvas_aes: canvasAes, node_style: nodeStyle, entry_bg: entryBg })
      .select().single()
    if (error) throw error
    setSessions(prev => [data, ...prev])
    return data
  }

  async function saveSession(id, { title, nodes, connections, canvasAes, nodeStyle, entryBg }) {
    const { data, error } = await supabase
      .from('shadow_work_sessions')
      .update({ title, nodes, connections, canvas_aes: canvasAes, node_style: nodeStyle, entry_bg: entryBg, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select().single()
    if (error) throw error
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    return data
  }

  async function loadSession(id) {
    const { data, error } = await supabase
      .from('shadow_work_sessions')
      .select('*')
      .eq('id', id).eq('user_id', user.id)
      .single()
    if (error) throw error
    return data
  }

  async function deleteSession(id) {
    await supabase.from('shadow_work_sessions').delete().eq('id', id).eq('user_id', user.id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return { sessions, loading, createSession, saveSession, loadSession, deleteSession }
}
