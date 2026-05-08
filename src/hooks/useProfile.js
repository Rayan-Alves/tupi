import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
        setLoading(false)
      })
  }, [user?.id])

  async function saveProfile(fields) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
    if (!error) setProfile(p => ({ ...p, ...fields }))
    return !error
  }

  async function uploadAvatar(file) {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl + `?t=${Date.now()}`
  }

  return { profile, loading, saveProfile, uploadAvatar }
}
