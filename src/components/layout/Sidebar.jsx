import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Sparkles, Brain, Dumbbell, Plane, Sprout, Compass, LogOut, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import i18n from '../../i18n'


const LANGS = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard', color: 'text-zinc-400' },
  { to: '/spirit',    icon: Sparkles,        key: 'nav.spirit',    color: 'text-[#5a8ab8]' },
  { to: '/mind',      icon: Brain,           key: 'nav.mind',      color: 'text-[#e0a840]' },
  { to: '/body',      icon: Dumbbell,        key: 'nav.body',      color: 'text-[#6aaa30]' },
  { to: '/travels',   icon: Plane,           key: 'nav.travels',   color: 'text-[#8B5A2B]', comingSoon: true },
  { to: '/projects',  icon: Sprout,          key: 'nav.projects',  color: 'text-[#C4A882]' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [lang, setLang] = [i18n.language, (l) => { i18n.changeLanguage(l); localStorage.setItem('art_lang', l) }]

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-[220px] flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Logo */}
      <div className="py-5 border-b border-white/5 flex justify-center overflow-visible">
        <img src="/tupi-logo.png" alt="TUPI" style={{ width: '260px' }} className="h-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, key, color, comingSoon }) => (
          comingSoon ? (
            <div
              key={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 cursor-default select-none"
              title={t('nav.comingSoon')}
            >
              <Icon size={17} className={color || 'text-zinc-600'} style={{ opacity: 0.5 }} />
              <span className="opacity-60">{t(key)}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider text-zinc-600 opacity-70">
                {t('nav.comingSoon')}
              </span>
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/6'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? (color || 'text-white') : (color || 'text-zinc-500')} />
                  {t(key)}
                </>
              )}
            </NavLink>
          )
        ))}

        {/* Jornada — abre em nova janela */}
        <button
          onClick={() => { const w = window.open('/jornada', '_blank'); w?.moveTo(0,0); w?.resizeTo(screen.width, screen.height) }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-zinc-400 hover:text-white hover:bg-white/6"
        >
          <Compass size={17} className="text-[#C4A882]" />
          {t('nav.jornada')}
        </button>
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-5 space-y-3 border-t border-white/5 pt-4">
        {/* Language */}
        <div className="flex items-center gap-1 px-1">
          <Globe size={13} className="text-zinc-500" />
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${
                lang === l.code ? 'bg-tabatinga text-white' : 'text-zinc-500 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center justify-between px-1 gap-2">
          <NavLink to="/profile" className="flex items-center gap-2 min-w-0 group">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/10" />
              : <div className="w-7 h-7 rounded-full bg-[#152e4a] flex items-center justify-center text-[11px] font-bold text-[#5a8ab8] flex-shrink-0">
                  {(profile.full_name || user?.email || '?')[0].toUpperCase()}
                </div>
            }
            <span className="text-[12px] text-zinc-500 group-hover:text-zinc-300 truncate transition-colors">
              {profile.full_name || 'Perfil'}
            </span>
          </NavLink>
          <button
            onClick={handleSignOut}
            title={t('common.logout')}
            className="text-zinc-500 hover:text-urucum transition-colors p-1 flex-shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
