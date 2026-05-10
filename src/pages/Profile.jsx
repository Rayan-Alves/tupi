import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Check, Save, ChevronDown } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: `${c.flag} ${c.name}`,
  name: c.name,
}))

function SearchableSelect({ options, value, onChange, placeholder, disabled = false }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const display = value ? (options.find(o => o.value === value)?.label ?? value) : ''
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options.slice(0, 100)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(opt) {
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center border rounded-xl transition-colors ${
        disabled
          ? 'bg-zinc-50 border-zinc-200 cursor-not-allowed'
          : 'bg-white border-zinc-200 hover:border-zinc-300 focus-within:border-tabatinga'
      }`}>
        <input
          value={open ? query : display}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (!disabled) { setOpen(true); setQuery('') } }}
          placeholder={disabled ? '—' : placeholder}
          disabled={disabled}
          className="flex-1 text-sm px-3 py-2 bg-transparent border-0 focus:ring-0 text-zinc-700 placeholder-zinc-300 disabled:cursor-not-allowed"
        />
        <ChevronDown size={14} className={`mr-3 text-zinc-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <p className="text-sm text-zinc-400 px-3 py-2">Nenhum resultado</p>
            : filtered.map(opt => (
              <button
                key={opt.value}
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(opt)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-[#C4A882]/10 hover:text-[#7a6040] transition-colors"
              >
                {opt.label}
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

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
  const { user } = useAuth()
  const { profile, loading, saveProfile, uploadAvatar } = useProfile()

  const [form, setForm] = useState({
    full_name: '', bio: '', birth_date: '',
    country: '', country_code: '',
    state: '', state_code: '',
    city: '',
    occupation: '', gender: '',
  })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [status, setStatus] = useState('clean')
  const [saveError, setSaveError] = useState('')

  const stateOptions = form.country_code
    ? State.getStatesOfCountry(form.country_code).map(s => ({ value: s.isoCode, label: s.name, name: s.name }))
    : []

  const cityOptions = form.country_code && form.state_code
    ? City.getCitiesOfCountry(form.country_code)
        .filter(c => c.stateCode === form.state_code)
        .map(c => ({ value: c.name, label: c.name }))
    : []

  useEffect(() => {
    if (!loading) {
      const savedCountry = profile.country || ''
      const countryMatch = ALL_COUNTRIES.find(c => c.name === savedCountry)
      const savedState = profile.state || ''
      const stateMatch = countryMatch
        ? State.getStatesOfCountry(countryMatch.value).find(s => s.name === savedState)
        : null

      setForm({
        full_name:    profile.full_name  || '',
        bio:          profile.bio        || '',
        birth_date:   profile.birth_date || '',
        country:      savedCountry,
        country_code: countryMatch?.value || '',
        state:        savedState,
        state_code:   stateMatch?.isoCode || '',
        city:         profile.city       || '',
        occupation:   profile.occupation || '',
        gender:       profile.gender     || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [loading])

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setStatus('dirty')
  }

  function handleCountry(opt) {
    setForm(p => ({ ...p, country: opt.name, country_code: opt.value, state: '', state_code: '', city: '' }))
    setStatus('dirty')
  }

  function handleState(opt) {
    setForm(p => ({ ...p, state: opt.name, state_code: opt.value, city: '' }))
    setStatus('dirty')
  }

  function handleCity(opt) {
    set('city', opt.value)
  }

  function handleAvatarFile(file) {
    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
    setStatus('dirty')
  }

  async function handleSave() {
    setStatus('saving')
    setSaveError('')
    let avatar_url = profile.avatar_url || null
    if (avatarFile) {
      const url = await uploadAvatar(avatarFile)
      if (url) { avatar_url = url; setAvatarUrl(url) }
    }
    const { country_code, state_code, ...fields } = form
    const { ok, error } = await saveProfile({ ...fields, avatar_url })
    setAvatarFile(null)
    if (ok) {
      setStatus('saved')
      setTimeout(() => setStatus('clean'), 2500)
    } else {
      setStatus('dirty')
      setSaveError(error?.message || JSON.stringify(error) || 'Erro ao salvar')
    }
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
            <SearchableSelect
              options={ALL_COUNTRIES}
              value={form.country_code}
              onChange={handleCountry}
              placeholder={t('profile.countryPlaceholder')}
            />
          </div>

          <div>
            <label className="field-label">{t('profile.state')}</label>
            <SearchableSelect
              options={stateOptions}
              value={form.state_code}
              onChange={handleState}
              placeholder={t('profile.statePlaceholder')}
              disabled={!form.country_code}
            />
          </div>
          <div>
            <label className="field-label">{t('profile.city')}</label>
            <SearchableSelect
              options={cityOptions}
              value={form.city}
              onChange={handleCity}
              placeholder={t('profile.cityPlaceholder')}
              disabled={!form.state_code}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">{t('profile.occupation')}</label>
            <input value={form.occupation} onChange={e => set('occupation', e.target.value)}
              placeholder={t('profile.occupationPlaceholder')}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:border-tabatinga focus:ring-0 transition-colors text-zinc-700 placeholder-zinc-300" />
          </div>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {saveError}
        </div>
      )}
      <div className="flex justify-end pb-8">
        <SaveButton status={status} onClick={handleSave} />
      </div>
    </div>
  )
}
