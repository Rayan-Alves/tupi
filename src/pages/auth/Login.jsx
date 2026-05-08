import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { Globe } from 'lucide-react'
import i18n from '../../i18n'

const LANGS = [{ code: 'pt', label: 'PT' }, { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }]

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(t('auth.error')); return }
    setShowIntro(true)
  }

  function handleVideoEnd() {
    navigate('/dashboard')
  }

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <video
          src="/tupi-branco.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="w-full max-w-lg mx-auto"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      {/* Lang switcher */}
      <div className="absolute top-5 right-5 flex items-center gap-1">
        <Globe size={13} className="text-zinc-400" />
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('art_lang', l.code) }}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${
              i18n.language === l.code ? 'bg-[#2D5016] text-white' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/tupi-logo.png" alt="TUPI" className="w-full h-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-8">
          <h1 className="text-lg font-bold text-zinc-900 mb-6">{t('auth.signIn')}</h1>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#4a8024] focus:ring-1 focus:ring-[#4a8024]/20 transition-all"
              />
            </div>
            <div>
              <label className="field-label">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#4a8024] focus:ring-1 focus:ring-[#4a8024]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D5016] hover:bg-[#1f380f] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm mt-2"
            >
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#2D5016] font-semibold hover:text-[#1f380f]">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
