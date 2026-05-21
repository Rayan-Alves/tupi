import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import DayTab from './dashboard/DayTab'
import WeekTab from './dashboard/WeekTab'
import MonthTab from './dashboard/MonthTab'

const TABS = ['month', 'week', 'day']

function greet(t) {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.greeting_morning')
  if (h < 18) return t('dashboard.greeting_afternoon')
  return t('dashboard.greeting_evening')
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [active, setActive] = useState('day')
  const name = profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="type-h1">
          {greet(t)}{name ? `, ${name}` : ''} 👋
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-150 ${
                active === tab
                  ? 'border-spirit text-spirit'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {t(`dashboard.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {active === 'day'   && <DayTab />}
        {active === 'week'  && <WeekTab />}
        {active === 'month' && <MonthTab />}
      </div>
    </div>
  )
}
