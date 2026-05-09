import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { Globe } from 'lucide-react'
import i18n from '../../i18n'

const LANGS = [{ code: 'pt', label: 'PT' }, { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }]

export default function Register() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) {
      const msg = err.message || err.status || err.code || err.error_description
      const full = JSON.stringify(err, Object.getOwnPropertyNames(err))
      setError(msg || full || 'Unknown error — check console')
      console.error('signUp error:', err)
      return
    }
    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-areia flex items-center justify-center px-4">
      {/* Lang switcher */}
      <div className="absolute top-5 right-5 flex items-center gap-1">
        <Globe size={13} className="text-zinc-400" />
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('art_lang', l.code) }}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${
              i18n.language === l.code ? 'bg-spirit text-white' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-52 mb-2">
            <img src="/tupi.png" alt="TUPI" className="w-full h-auto" style={{ mixBlendMode: 'multiply' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, #F5F0E8 80%)' }} />
          </div>
          <p className="text-zinc-500 text-sm">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-4">✉️</div>
              <h2 className="font-bold text-zinc-900 mb-2">{t('auth.checkEmail')}</h2>
              <Link to="/login" className="text-spirit text-sm font-semibold hover:text-[#152e4a]">
                {t('auth.signIn')} →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-zinc-900 mb-6">{t('auth.signUp')}</h1>

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
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-tabatinga focus:ring-1 focus:ring-tabatinga/20 transition-all"
                  />
                </div>
                <div>
                  <label className="field-label">{t('auth.password')}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-tabatinga focus:ring-1 focus:ring-tabatinga/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-spirit hover:bg-[#152e4a] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm mt-2"
                >
                  {loading ? t('common.loading') : t('auth.signUp')}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500 mt-6">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="text-spirit font-semibold hover:text-[#152e4a]">
                  {t('auth.signIn')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
