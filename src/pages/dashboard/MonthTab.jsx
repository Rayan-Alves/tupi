import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Save, BookOpen, Tv, CalendarDays, Cake } from 'lucide-react'
import { useMonth, getCurrentMonthPeriod, navigateMonth, formatMonthLabel } from '../../hooks/useMonth'

// ── Shared UI ──────────────────────────────────────────────────────

function SaveButton({ status, onClick }) {
  const styles = { clean: 'bg-zinc-100 text-zinc-400 cursor-default', dirty: 'bg-spirit hover:bg-[#152e4a] text-white cursor-pointer', saving: 'bg-[#3a6490] text-white cursor-wait', saved: 'bg-emerald-500 text-white cursor-default' }
  const labels = { clean: 'Salvo', dirty: 'Salvar', saving: 'Salvando…', saved: 'Salvo ✓' }
  return (
    <button onClick={status === 'dirty' ? onClick : undefined} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${styles[status]}`}>
      {status === 'saved' ? <Check size={11} /> : <Save size={11} />}{labels[status]}
    </button>
  )
}

function SaveableTextarea({ initialValue, onSave, placeholder }) {
  const [value, setValue] = useState(initialValue || '')
  const [status, setStatus] = useState('clean')
  const ref = useRef(null)
  const resize = useCallback(() => { const el = ref.current; if (!el) return; el.style.height = '1px'; el.style.height = el.scrollHeight + 'px' }, [])
  useLayoutEffect(() => { resize() })
  useEffect(() => { setValue(initialValue || ''); setStatus('clean') }, [initialValue])
  async function handleSave() { setStatus('saving'); await onSave(value); setStatus('saved'); setTimeout(() => setStatus('clean'), 2500) }
  return (
    <div className="space-y-2">
      <textarea ref={ref} value={value} onChange={e => { setValue(e.target.value); setStatus('dirty') }} placeholder={placeholder} rows={1} className="auto-textarea" />
      <div className="flex justify-end"><SaveButton status={status} onClick={handleSave} /></div>
    </div>
  )
}

// ── Mini Calendar ──────────────────────────────────────────────────

function MiniCalendar({ period }) {
  const [y, m] = period.split('-').map(Number)
  const today = new Date()
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const cells = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const isToday = (d) => d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear()
  const isPast = (d) => new Date(y, m - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => (
          <div key={i} className={`aspect-square flex items-center justify-center rounded-full text-[12px] font-medium transition-all
            ${!day ? '' : isToday(day) ? 'bg-spirit text-white' : isPast(day) ? 'text-zinc-400' : 'text-zinc-700 hover:bg-zinc-100'}`}>
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────

function Section({ title, icon: Icon, color = 'text-zinc-500', onAdd, addLabel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
          {Icon && <Icon size={15} />}{title}
        </div>
        {onAdd && (
          <button onClick={onAdd} className="btn-ghost text-[12px]">
            <Plus size={12} />{addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Month Goals ────────────────────────────────────────────────────

function MonthGoalItem({ goal, onUpdate, onDelete, t }) {
  const [local, setLocal] = useState({ title: goal.title || '', why: goal.why || '' })
  const [status, setStatus] = useState('clean')
  const whyRef = useRef(null)
  const resizeWhy = useCallback(() => { const el = whyRef.current; if (!el) return; el.style.height = '1px'; el.style.height = el.scrollHeight + 'px' }, [])
  useLayoutEffect(() => { resizeWhy() })
  useEffect(() => { setLocal({ title: goal.title || '', why: goal.why || '' }) }, [goal.id])

  async function save() {
    setStatus('saving')
    await Promise.all([onUpdate(goal.id, 'title', local.title), onUpdate(goal.id, 'why', local.why)])
    setStatus('saved'); setTimeout(() => setStatus('clean'), 2500)
  }

  return (
    <div className="group border border-zinc-100 rounded-xl p-3 space-y-2 hover:border-zinc-200 transition-colors">
      <div className="flex items-center gap-2">
        <input value={local.title} onChange={e => { setLocal(p => ({ ...p, title: e.target.value })); setStatus('dirty') }}
          placeholder={t('dashboard.month.goalPlaceholder')} className="flex-1 input-inline text-[14px]" />
        <button onClick={() => onDelete(goal.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
      </div>
      <div>
        <label className="field-label">{t('dashboard.month.why')}</label>
        <textarea ref={whyRef} value={local.why} onChange={e => { setLocal(p => ({ ...p, why: e.target.value })); setStatus('dirty') }}
          placeholder={t('dashboard.month.whyPlaceholder')} rows={1} className="auto-textarea" />
      </div>
      <div className="flex justify-end"><SaveButton status={status} onClick={save} /></div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────

export default function MonthTab() {
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState(() => getCurrentMonthPeriod())
  const {
    profile, saveProfileField,
    goals, addGoal, updateGoal, deleteGoal,
    tasks, addTask, updateTask, deleteTask,
    events, addEvent, updateEvent, deleteEvent,
    birthdays, addBirthday, updateBirthday, deleteBirthday,
    reading, addReading, updateReading, deleteReading,
    loading,
  } = useMonth(period)

  const locale = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[i18n.language] || 'pt-BR'

  return (
    <div className="space-y-5">
      {/* Period navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-zinc-100 shadow-card px-5 py-3">
        <button onClick={() => setPeriod(p => navigateMonth(p, -1))} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-zinc-700 capitalize">{formatMonthLabel(period, locale)}</span>
        <button onClick={() => setPeriod(p => navigateMonth(p, 1))} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
      </div>

      {/* Calendar + Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MiniCalendar period={period} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
            <label className="field-label">{t('dashboard.month.howStart')}</label>
            <SaveableTextarea initialValue={profile.how_start} onSave={v => saveProfileField('how_start', v)} placeholder={t('dashboard.month.howStartPlaceholder')} />
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5 border-l-4 border-l-spirit">
            <label className="field-label">{t('dashboard.month.howEnd')}</label>
            <SaveableTextarea initialValue={profile.how_end} onSave={v => saveProfileField('how_end', v)} placeholder={t('dashboard.month.howEndPlaceholder')} />
          </div>
        </div>
      </div>

      {/* Goals */}
      <Section title={t('dashboard.month.goal')} onAdd={addGoal} addLabel={t('common.add')}>
        {loading ? <p className="text-sm text-zinc-400">{t('common.loading')}</p>
          : goals.length === 0 ? <p className="text-sm text-zinc-400">{t('dashboard.month.noGoals')}</p>
          : <div className="space-y-2">{goals.map(g => <MonthGoalItem key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} t={t} />)}</div>}
      </Section>

      {/* Tasks */}
      <Section title={t('dashboard.month.tasks')} onAdd={addTask} addLabel={t('common.add')}>
        {loading ? <p className="text-sm text-zinc-400">{t('common.loading')}</p>
          : tasks.length === 0 ? <p className="text-sm text-zinc-400">{t('dashboard.month.noItems')}</p>
          : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-1">
                <span className="field-label">{t('dashboard.month.taskWhat')}</span>
                <span className="field-label text-right">{t('dashboard.month.taskWhen')}</span>
                <span />
              </div>
              {tasks.map(task => (
                <div key={task.id} className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                  <button onClick={() => updateTask(task.id, 'completed', !task.completed)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-spirit border-spirit' : 'border-zinc-300 hover:border-[#3a6490]'}`}>
                    {task.completed && <Check size={9} className="text-white" />}
                  </button>
                  <input value={task.title} onChange={e => updateTask(task.id, 'title', e.target.value)}
                    placeholder={t('dashboard.month.taskWhatPlaceholder')}
                    className={`bg-transparent text-sm border-0 focus:ring-0 p-0 placeholder-zinc-400 w-full ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}`} />
                  <input type="date" value={task.due_date || ''} onChange={e => updateTask(task.id, 'due_date', e.target.value || null)} className="date-input flex-shrink-0" />
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
      </Section>

      {/* Events + Birthdays side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Events */}
        <Section title={t('dashboard.month.events')} icon={CalendarDays} color="text-spirit" onAdd={addEvent} addLabel={t('common.add')}>
          {events.length === 0 ? <p className="text-sm text-zinc-400">{t('dashboard.month.noItems')}</p>
            : (
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="group flex items-center gap-2">
                    <input value={ev.title} onChange={e => updateEvent(ev.id, 'title', e.target.value)}
                      placeholder={t('dashboard.month.eventPlaceholder')} className="flex-1 bg-transparent text-sm border-0 focus:ring-0 p-0 placeholder-zinc-400 text-zinc-800" />
                    <input type="date" value={ev.event_date || ''} onChange={e => updateEvent(ev.id, 'event_date', e.target.value || null)} className="date-input flex-shrink-0" />
                    <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
        </Section>

        {/* Birthdays */}
        <Section title={t('dashboard.month.birthdays')} icon={Cake} color="text-pink-500" onAdd={addBirthday} addLabel={t('common.add')}>
          {birthdays.length === 0 ? <p className="text-sm text-zinc-400">{t('dashboard.month.noItems')}</p>
            : (
              <div className="space-y-2">
                {birthdays.map(b => (
                  <div key={b.id} className="group flex items-center gap-2">
                    <input value={b.name} onChange={e => updateBirthday(b.id, 'name', e.target.value)}
                      placeholder={t('dashboard.month.birthdayPlaceholder')} className="flex-1 bg-transparent text-sm border-0 focus:ring-0 p-0 placeholder-zinc-400 text-zinc-800" />
                    <input type="date" value={b.birth_date || ''} onChange={e => updateBirthday(b.id, 'birth_date', e.target.value || null)} className="date-input flex-shrink-0" />
                    <button onClick={() => deleteBirthday(b.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
        </Section>
      </div>

      {/* Reading & Watching */}
      <Section title={t('dashboard.month.reading')} icon={BookOpen} color="text-amber-500"
        onAdd={null} addLabel={null}>
        <div className="flex gap-2 mb-4">
          <button onClick={() => addReading('read')} className="btn-ghost text-[12px]"><BookOpen size={12} />{t('dashboard.month.addRead')}</button>
          <button onClick={() => addReading('watch')} className="btn-ghost text-[12px]"><Tv size={12} />{t('dashboard.month.addWatch')}</button>
        </div>
        {reading.length === 0 ? <p className="text-sm text-zinc-400">{t('dashboard.month.noItems')}</p>
          : (
            <div className="space-y-2">
              {reading.map(item => (
                <div key={item.id} className="group flex items-center gap-2">
                  <button onClick={() => updateReading(item.id, 'completed', !item.completed)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-amber-500 border-amber-500' : 'border-zinc-300 hover:border-amber-400'}`}>
                    {item.completed && <Check size={9} className="text-white" />}
                  </button>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.type === 'read' ? 'bg-[#D4890A]/10 text-mind' : 'bg-spirit/10 text-spirit'}`}>
                    {item.type === 'read' ? t('dashboard.month.typeRead') : t('dashboard.month.typeWatch')}
                  </span>
                  <input value={item.title} onChange={e => updateReading(item.id, 'title', e.target.value)}
                    placeholder={t('dashboard.month.readingPlaceholder')}
                    className={`flex-1 bg-transparent text-sm border-0 focus:ring-0 p-0 placeholder-zinc-400 ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}`} />
                  <button onClick={() => deleteReading(item.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
      </Section>
    </div>
  )
}
