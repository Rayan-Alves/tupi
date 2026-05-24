import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Check, Save } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function SaveButton({ status, onClick }) {
  const styles = {
    clean:  'bg-zinc-100 text-zinc-400 cursor-default',
    dirty:  'bg-spirit hover:bg-[#152e4a] text-white cursor-pointer',
    saving: 'bg-[#3a6490] text-white cursor-wait',
    saved:  'bg-emerald-500 text-white cursor-default',
  }
  const labels = { clean: 'Salvo', dirty: 'Salvar', saving: 'Salvando…', saved: 'Salvo ✓' }
  return (
    <button
      onClick={status === 'dirty' ? onClick : undefined}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${styles[status]}`}
    >
      {status === 'saved' ? <Check size={14} /> : <Save size={14} />}
      {labels[status]}
    </button>
  )
}

function Avatar({ url, name, onUpload }) {
  const fileRef = useRef(null)
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="relative group w-24 h-24 cursor-pointer" onClick={() => fileRef.current?.click()}>
      {url
        ? <img src={url} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
        : <div className="w-24 h-24 rounded-full bg-[#C4A882]/20 border-4 border-white shadow-md flex items-center justify-center text-tabatinga text-2xl font-bold font-display">{initials}</div>
      }
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Camera size={22} className="text-white" />
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
    </div>
  )
}

export default function Profile() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { profile, loading, saveProfile, uploadAvatar } = useProfile()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '', bio: '', birth_date: '',
    country: '', state: '', city: '',
    occupation: '', gender: '',
  })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [status, setStatus] = useState('clean')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteStep, setDeleteStep] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading) {
      setForm({
        full_name:  profile.full_name  || '',
        bio:        profile.bio        || '',
        birth_date: profile.birth_date || '',
        country:    profile.country    || '',
        state:      profile.state      || '',
        city:       profile.city       || '',
        occupation: profile.occupation || '',
        gender:     profile.gender     || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [loading])

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setStatus('dirty')
  }

  function handleAvatarFile(file) {
    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
    setStatus('dirty')
  }

  async function handleSave() {
    setStatus('saving')
    let avatar_url = profile.avatar_url || null
    if (avatarFile) {
      const url = await uploadAvatar(avatarFile)
      if (url) { avatar_url = url; setAvatarUrl(url) }
    }
    await saveProfile({ ...form, avatar_url })
    setAvatarFile(null)
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    await supabase.rpc('delete_own_account')
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <div className="text-sm text-zinc-400 p-6">{t('common.loading')}</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t('profile.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-6">
        <div className="flex items-center gap-6">
          <Avatar url={avatarUrl} name={form.full_name} onUpload={handleAvatarFile} />
          <div className="flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{t('profile.clickToChange')}</p>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder={t('profile.fullNamePlaceholder')}
              className="w-full text-xl font-bold text-zinc-900 bg-transparent border-0 border-b border-zinc-200 focus:border-tabatinga focus:ring-0 px-0 py-1 transition-colors placeholder-zinc-300"
            />
            <input
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              className="w-full text-sm text-zinc-500 bg-transparent border-0 focus:ring-0 px-0 py-0.5 placeholder-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-6 space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{t('profile.personal')}</h2>

        <div>
          <label className="field-label">{t('profile.email')}</label>
          <input value={user?.email || ''} readOnly
            className="w-full bg-zinc-50 text-sm text-zinc-500 border border-zinc-200 rounded-xl px-3 py-2 cursor-default focus:ring-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">{t('profile.birthDate')}</label>
            <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700" />
          </div>
          <div>
            <label className="field-label">{t('profile.gender')}</label>
            <input value={form.gender} onChange={e => set('gender', e.target.value)}
              placeholder={t('profile.genderPlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">{t('profile.country')}</label>
            <input value={form.country} onChange={e => set('country', e.target.value)}
              placeholder={t('profile.countryPlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>

          <div>
            <label className="field-label">{t('profile.state')}</label>
            <input value={form.state} onChange={e => set('state', e.target.value)}
              placeholder={t('profile.statePlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>
          <div>
            <label className="field-label">{t('profile.city')}</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              placeholder={t('profile.cityPlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">{t('profile.occupation')}</label>
            <input value={form.occupation} onChange={e => set('occupation', e.target.value)}
              placeholder={t('profile.occupationPlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <SaveButton status={status} onClick={handleSave} />
      </div>

      {/* Danger zone */}
      <div className="border border-red-100 rounded-2xl p-6 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">{t('profile.dangerZone')}</h2>
        <p className="text-sm text-zinc-500 mb-4">{t('profile.deleteAccountDesc')}</p>

        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            className="text-sm text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
          >
            {t('profile.deleteAccount')}
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3">
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={t('profile.deleteConfirmPrompt')}
              className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 focus:border-red-400 focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="text-sm bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
              >
                {deleting ? t('profile.deleteConfirming') : t('profile.deleteAccount')}
              </button>
              <button
                onClick={() => { setDeleteStep(0); setDeleteConfirm('') }}
                className="text-sm text-zinc-400 hover:text-zinc-600 px-4 py-2 rounded-xl transition-colors"
              >
                {t('profile.deleteCancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
