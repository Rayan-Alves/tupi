import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMentalPattern() {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('mental_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPatterns(data)
        setLoading(false)
      })
  }, [user?.id])

  async function addPattern() {
    const { data, error } = await supabase
      .from('mental_patterns')
      .insert({
        user_id: user.id,
        neg_belief: '', neg_causes: '', neg_feeling: '', neg_result: '',
        pos_action: '', pos_feeling: '', pos_impact: '', pos_belief: '',
      })
      .select().single()
    if (!error && data) {
      setPatterns(prev => [data, ...prev])
      return data
    }
    return null
  }

  async function savePattern(id, fields) {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    await supabase
      .from('mental_patterns')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
  }

  async function deletePattern(id) {
    setPatterns(prev => prev.filter(p => p.id !== id))
    await supabase
      .from('mental_patterns')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
  }

  return { patterns, loading, addPattern, savePattern, deletePattern }
}
