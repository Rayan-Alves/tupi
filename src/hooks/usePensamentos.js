import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePensamentos() {
  const { user } = useAuth()
  const [pensamentos, setPensamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('pensamentos').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPensamentos(data); setLoading(false) })
  }, [user?.id])

  async function addPensamento() {
    const { data, error } = await supabase
      .from('pensamentos')
      .insert({ user_id: user.id, title: '', body: '' })
      .select().single()
    if (!error && data) {
      setPensamentos(prev => [data, ...prev])
      return data
    }
  }

  async function savePensamento(id, fields) {
    setPensamentos(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    await supabase.from('pensamentos')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
  }

  async function deletePensamento(id) {
    setPensamentos(prev => prev.filter(p => p.id !== id))
    await supabase.from('pensamentos').delete().eq('id', id).eq('user_id', user.id)
  }

  return { pensamentos, loading, addPensamento, savePensamento, deletePensamento }
}
