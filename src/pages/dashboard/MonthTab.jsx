import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Pencil } from 'lucide-react'
import { useMonth, getCurrentMonthPeriod, navigateMonth, formatMonthLabel } from '../../hooks/useMonth'

// ── Tokens ─────────────────────────────────────────────────────────
const T = {
  green:  '#1A3A1F',
  amber:  '#C8841A',
  sand:   '#C4A882',
  muted:  '#8a7e6e',
  bg:     '#F5F0E8',
}

// ── Auto-growing textarea ──────────────────────────────────────────
function GhostTextarea({ value, onChange, placeholder, minRows = 2, className = '' }) {
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = el.scrollHeight + 'px'
  }, [])
  useLayoutEffect(() => { resize() })
  useEffect(() => { resize() }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={minRows}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: T.green,
        border: 'none',
        background: 'transparent',
        outline: 'none',
        width: '100%',
        resize: 'none',
        lineHeight: 1.65,
        overflowY: 'hidden',
      }}
      className={`placeholder-[#8a7e6e] ${className}`}
    />
  )
}

// ── Saveable ghost textarea (debounced) ────────────────────────────
function SaveableGhost({ value: initial, onSave, placeholder, minRows = 2 }) {
  const [val, setVal] = useState(initial || '')
  const timer = useRef(null)

  useEffect(() => { setVal(initial || '') }, [initial])

  function handleChange(e) {
    setVal(e.target.value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { onSave(e.target.value) }, 900)
  }

  return (
    <GhostTextarea
      value={val}
      onChange={handleChange}
      placeholder={placeholder}
      minRows={minRows}
    />
  )
}

// ── Mini Calendar ──────────────────────────────────────────────────
function MiniCalendar({ period, events, birthdays, bills, locale, t }) {
  const [y, m] = period.split('-').map(Number)
  const today = new Date()
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const cells = Array(firstWeekday).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const isToday = d => d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear()

  // Locale-aware single-char weekday abbreviations (Sun…Sat)
  const dayAbbrs = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 7).toLocaleDateString(locale, { weekday: 'narrow' })
  )

  // Build sets of days with events/bills/birthdays
  const eventDays = new Set()
  const billDays  = new Set()
  const bdayDays  = new Set()

  events.forEach(ev => {
    if (ev.event_date) eventDays.add(parseInt(ev.event_date.split('-')[2], 10))
  })
  bills.forEach(b => {
    if (b.day_of_month) billDays.add(b.day_of_month)
  })
  birthdays.forEach(b => {
    if (b.birth_date) bdayDays.add(parseInt(b.birth_date.split('-')[2], 10))
  })

  const legend = [
    { color: T.amber, label: t('dashboard.month.calLegendEvents') },
    { color: T.sand,  label: t('dashboard.month.calLegendBills') },
    { color: T.green, label: t('dashboard.month.calLegendBirthdays') },
  ]

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {legend.map(({ color, label }) => (
          <span key={label} style={{ fontFamily: 'sans-serif', fontSize: 10, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 4 }}>
        {dayAbbrs.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: 10, color: T.muted, padding: '2px 0', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dots = []
          if (eventDays.has(day)) dots.push(T.amber)
          if (billDays.has(day))  dots.push(T.sand)
          if (bdayDays.has(day))  dots.push(T.green)
          return (
            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: dots.length ? 8 : 2 }}>
              <div style={{
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                fontFamily: 'sans-serif', fontSize: 11, fontWeight: 500,
                background: isToday(day) ? T.green : 'transparent',
                color: isToday(day) ? '#F5F0E8' : T.green,
              }}>
                {day}
              </div>
              {dots.length > 0 && (
                <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: 2 }}>
                  {dots.map((c, di) => (
                    <span key={di} style={{ width: 3, height: 3, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: `0.5px solid rgba(26,58,31,0.1)`,
      padding: '1.25rem 1.5rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────
function SectionTitle({ children, onAdd }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, color: T.green }}>
        {children}
      </span>
      {onAdd && (
        <button
          onClick={onAdd}
          style={{ fontSize: 18, color: T.sand, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
        >
          +
        </button>
      )}
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.08em', color: T.muted, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────
function Divider({ style = {} }) {
  return <div style={{ height: '0.5px', background: 'rgba(26,58,31,0.08)', margin: '0.75rem 0', ...style }} />
}

// ── Inline editable list item ─────────────────────────────────────
function EditableListItem({ value, onChange, onDelete, placeholder, bullet = T.sand }) {
  return (
    <div
      className="group"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: bullet, marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 13, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#d1d5db', border: 'none', background: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ── Add row link ──────────────────────────────────────────────────
function AddRow({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{ fontFamily: 'sans-serif', fontSize: 12, color: T.muted, paddingTop: 8, display: 'block', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      onMouseEnter={e => { e.currentTarget.style.color = T.green }}
      onMouseLeave={e => { e.currentTarget.style.color = T.muted }}
    >
      + {label}
    </button>
  )
}

// ── Stats bar chart ───────────────────────────────────────────────
function WeekBars({ weekBars }) {
  const maxCount = Math.max(...weekBars.map(w => w.count), 1)
  const MAX_H = 48

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
      {weekBars.map((w, i) => {
        const h = w.future ? 0 : Math.max(4, Math.round((w.count / maxCount) * MAX_H))
        const opacity = w.future ? 1 : 0.4 + 0.6 * (w.count / maxCount)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              height: w.future ? 16 : h,
              width: '100%',
              background: w.future ? 'rgba(26,58,31,0.06)' : T.green,
              borderRadius: '3px 3px 0 0',
              border: w.future ? `0.5px dashed rgba(26,58,31,0.15)` : 'none',
              opacity: w.future ? 1 : opacity,
              transition: 'height 0.3s ease',
            }} />
            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: T.muted, textAlign: 'center', marginTop: 4 }}>{w.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Palavra do mês editable ───────────────────────────────────────
function PalavraField({ value, onSave, t }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => { setLocal(value || '') }, [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  function commit() {
    setEditing(false)
    onSave(local)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          ref={inputRef}
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit() }}
          placeholder={t('dashboard.month.wordPlaceholder')}
          style={{
            fontFamily: 'Georgia, serif', fontSize: 28, color: T.green,
            border: 'none', borderBottom: `1px solid ${T.sand}`, background: 'transparent',
            outline: 'none', width: '100%',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer' }} onClick={() => setEditing(true)}>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: T.green, fontWeight: 'normal', letterSpacing: '0.02em' }}>
        {local || <span style={{ color: T.muted, fontSize: 18 }}>{t('dashboard.month.addWordOfMonth')}</span>}
      </span>
      {local && <Pencil size={13} style={{ color: T.sand, flexShrink: 0 }} />}
    </div>
  )
}

// ── Goal item ─────────────────────────────────────────────────────
function GoalItem({ goal, onUpdate, onDelete, t }) {
  const timer = useRef(null)

  function debounceSave(field, value) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate(goal.id, field, value), 900)
  }

  return (
    <div className="group" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
      <input
        defaultValue={goal.title}
        onChange={e => debounceSave('title', e.target.value)}
        placeholder={t('dashboard.month.goalInputPlaceholder')}
        style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 13, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
      />
      <button
        onClick={() => onDelete(goal.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0, flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ── Bill row ──────────────────────────────────────────────────────
function BillRow({ bill, onUpdate, onDelete, t }) {
  const timer = useRef(null)
  function debounceSave(field, value) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate(bill.id, field, value), 700)
  }

  return (
    <div className="group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}>
      <input
        defaultValue={bill.title}
        onChange={e => debounceSave('title', e.target.value)}
        placeholder={t('dashboard.month.billNamePlaceholder')}
        style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 13, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.muted }}>
          {t('dashboard.month.billDay')}&nbsp;
          <input
            defaultValue={bill.day_of_month || ''}
            onChange={e => debounceSave('day_of_month', parseInt(e.target.value) || null)}
            type="number"
            min="1" max="31"
            style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.muted, border: 'none', background: 'transparent', outline: 'none', width: 28, padding: 0 }}
            placeholder="—"
          />
        </span>
        <button
          onClick={() => onUpdate(bill.id, 'recurring', !bill.recurring)}
          style={{
            fontFamily: 'sans-serif', fontSize: 10,
            color: bill.recurring ? '#854F0B' : T.muted,
            background: bill.recurring ? 'rgba(200,132,26,0.1)' : 'rgba(26,58,31,0.05)',
            padding: '2px 7px', borderRadius: 10, border: 'none', cursor: 'pointer',
          }}
        >
          {t('dashboard.month.recurring')}
        </button>
        <button
          onClick={() => onDelete(bill.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Stat item ─────────────────────────────────────────────────────
function StatItem({ label, value, total, mode, rawValue }) {
  let display
  if (rawValue !== undefined) {
    display = rawValue
  } else if (total === 0) {
    display = mode === 'pct' ? '—' : '0/0'
  } else {
    display = mode === 'pct'
      ? `${Math.round((value / total) * 100)}%`
      : `${value}/${total}`
  }
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.green }}>{display}</div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.muted, marginTop: 2 }}>{label}</div>
      <div style={{ height: 4, background: 'rgba(26,58,31,0.08)', borderRadius: 2, marginTop: 6 }}>
        <div style={{ height: 4, borderRadius: 2, background: T.green, width: `${rawValue !== undefined ? 100 : pct}%`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// ── Explore categories (DB keys → translated labels) ───────────────
const EXPLORE_CAT_KEYS = [
  { key: 'Livros',   i18nKey: 'dashboard.month.catBooks' },
  { key: 'Filmes',   i18nKey: 'dashboard.month.catMovies' },
  { key: 'Podcasts', i18nKey: 'dashboard.month.catPodcasts' },
  { key: 'Lugares',  i18nKey: 'dashboard.month.catPlaces' },
  { key: 'Cursos',   i18nKey: 'dashboard.month.catCourses' },
  { key: 'Músicas',  i18nKey: 'dashboard.month.catMusic' },
  { key: 'Eventos',  i18nKey: 'dashboard.month.catEvents' },
]

// ── Main component ─────────────────────────────────────────────────
export default function MonthTab() {
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState(() => getCurrentMonthPeriod())
  const [statsMode, setStatsMode] = useState('pct') // 'pct' | 'frac'
  const [goalsExpanded, setGoalsExpanded] = useState(false)
  const GOALS_PREVIEW = 3

  const {
    profile, saveProfileField,
    goals, addGoal, updateGoal, deleteGoal,
    tasks,
    events, addEvent, updateEvent, deleteEvent,
    birthdays, addBirthday, updateBirthday, deleteBirthday,
    bills, addBill, updateBill, deleteBill,
    health, addHealth, updateHealth, deleteHealth,
    largar, addLargar, updateLargar, deleteLargar,
    explorar, addExplorar, updateExplorar, deleteExplorar,
    stats, loading,
  } = useMonth(period)

  // explorarCat stores the DB key (always Portuguese)
  const [explorarCat, setExplorarCat] = useState('Livros')

  const locale = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[i18n.language] || 'pt-BR'
  const [y, mo] = period.split('-').map(Number)
  const monthName = new Date(y, mo - 1, 1).toLocaleDateString(locale, { month: 'long' })
  const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Stats display
  const tasksDone  = tasks.filter(t => t.completed).length
  const tasksTotal = tasks.length
  const routinesDone = stats.routinesDone

  function statDisplay(done, total) {
    if (total === 0) return statsMode === 'pct' ? '—' : '0/0'
    return statsMode === 'pct'
      ? `${Math.round((done / total) * 100)}%`
      : `${done}/${total}`
  }

  const visibleGoals = goalsExpanded ? goals : goals.slice(0, GOALS_PREVIEW)

  // Current explore category label (translated)
  const currentCatLabel = t(EXPLORE_CAT_KEYS.find(c => c.key === explorarCat)?.i18nKey || 'dashboard.month.catBooks')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Period navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, border: '0.5px solid rgba(26,58,31,0.1)', padding: '10px 20px' }}>
        <button onClick={() => setPeriod(p => navigateMonth(p, -1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sand, display: 'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: T.green, fontWeight: 'normal' }}>
          {formatMonthLabel(period, locale)}
        </span>
        <button onClick={() => setPeriod(p => navigateMonth(p, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sand, display: 'flex' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* TOP: Abertura + Calendário */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>

        {/* Left: Palavra + reflexão + how_start + how_end + Eventos + Aniversários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <Label>{t('dashboard.month.wordOfMonth')}</Label>
            <PalavraField value={profile.palavra_do_mes} onSave={v => saveProfileField('palavra_do_mes', v)} t={t} />

            <Divider style={{ marginTop: 16 }} />

            <div style={{
              background: 'rgba(200,132,26,0.06)',
              borderLeft: `2px solid ${T.amber}`,
              padding: '10px 14px',
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: T.green,
              lineHeight: 1.6,
              marginBottom: 12,
            }}>
              {t('dashboard.month.whatBringsFromLastMonth')}
              <div style={{ marginTop: 6 }}>
                <SaveableGhost
                  value={profile.o_que_traz}
                  onSave={v => saveProfileField('o_que_traz', v)}
                  placeholder={t('dashboard.month.reflectionPlaceholder')}
                  minRows={2}
                />
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <Label>{t('dashboard.month.howStartMonth', { month: monthCapitalized })}</Label>
              <SaveableGhost
                value={profile.how_start}
                onSave={v => saveProfileField('how_start', v)}
                placeholder={t('dashboard.month.howStartPlaceholder')}
                minRows={2}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <Label>{t('dashboard.month.howEndMonth', { month: monthCapitalized })}</Label>
              <SaveableGhost
                value={profile.how_end}
                onSave={v => saveProfileField('how_end', v)}
                placeholder={t('dashboard.month.howEndPlaceholder')}
                minRows={2}
              />
            </div>
          </Card>

          {/* Eventos + Aniversários */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <SectionTitle onAdd={addEvent}>{t('dashboard.month.events')}</SectionTitle>
                {events.length === 0
                  ? <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: T.muted }}>{t('dashboard.month.noEvents')}</p>
                  : events.map(ev => (
                    <div key={ev.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}>
                      <input
                        value={ev.title}
                        onChange={e => updateEvent(ev.id, 'title', e.target.value)}
                        placeholder={t('dashboard.month.eventNamePlaceholder')}
                        style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 12, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
                      />
                      <input
                        type="date"
                        value={ev.event_date || ''}
                        onChange={e => updateEvent(ev.id, 'event_date', e.target.value || null)}
                        style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.muted, border: 'none', background: 'transparent', outline: 'none', width: 90 }}
                      />
                      <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                }
              </div>
              <div>
                <SectionTitle onAdd={addBirthday}>{t('dashboard.month.birthdays')}</SectionTitle>
                {birthdays.length === 0
                  ? <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: T.muted }}>{t('dashboard.month.noBirthdays')}</p>
                  : birthdays.map(b => (
                    <div key={b.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}>
                      <input
                        value={b.name}
                        onChange={e => updateBirthday(b.id, 'name', e.target.value)}
                        placeholder={t('dashboard.month.namePlaceholder')}
                        style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 12, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
                      />
                      <input
                        type="date"
                        value={b.birth_date || ''}
                        onChange={e => updateBirthday(b.id, 'birth_date', e.target.value || null)}
                        style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.muted, border: 'none', background: 'transparent', outline: 'none', width: 90 }}
                      />
                      <button onClick={() => deleteBirthday(b.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Calendar + Explorar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={() => setPeriod(p => navigateMonth(p, -1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sand, fontSize: 16, lineHeight: 1 }}>‹</button>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: T.green }}>{monthCapitalized} {y}</span>
              <button onClick={() => setPeriod(p => navigateMonth(p, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sand, fontSize: 16, lineHeight: 1 }}>›</button>
            </div>
            <MiniCalendar period={period} events={events} birthdays={birthdays} bills={bills} locale={locale} t={t} />
          </Card>

          {/* Explorar */}
          <Card>
            <SectionTitle>{t('dashboard.month.explore')}</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {EXPLORE_CAT_KEYS.map(({ key, i18nKey }) => {
                const active = explorarCat === key
                return (
                  <button
                    key={key}
                    onClick={() => setExplorarCat(key)}
                    style={{
                      fontFamily: 'sans-serif', fontSize: 11, padding: '3px 10px',
                      borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: active ? T.amber : 'rgba(200,132,26,0.1)',
                      color: active ? '#fff' : '#854F0B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t(i18nKey)}
                  </button>
                )
              })}
            </div>

            {/* Items da categoria selecionada */}
            {explorar.filter(e => e.category === explorarCat).map(item => (
              <div key={item.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `0.5px solid rgba(26,58,31,0.06)` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.amber, flexShrink: 0, display: 'inline-block' }} />
                <input
                  value={item.title}
                  onChange={e => updateExplorar(item.id, 'title', e.target.value)}
                  placeholder={t('dashboard.month.addCategory', { category: currentCatLabel.toLowerCase() })}
                  style={{ flex: 1, fontFamily: 'sans-serif', fontSize: 13, color: T.green, border: 'none', background: 'transparent', outline: 'none', padding: 0 }}
                />
                <button
                  onClick={() => deleteExplorar(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <AddRow onClick={() => addExplorar(explorarCat)} label={t('dashboard.month.addCategory', { category: currentCatLabel.toLowerCase() })} />
          </Card>
        </div>
      </div>

      {/* PILARES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {[
          { key: 'pilar_corpo',     labelKey: 'dashboard.month.pillars.body',   dot: T.green, phKey: 'dashboard.month.pillars.bodyPlaceholder' },
          { key: 'pilar_mente',    labelKey: 'dashboard.month.pillars.mind',   dot: T.amber, phKey: 'dashboard.month.pillars.mindPlaceholder' },
          { key: 'pilar_espirito', labelKey: 'dashboard.month.pillars.spirit', dot: T.sand,  phKey: 'dashboard.month.pillars.spiritPlaceholder' },
        ].map(({ key, labelKey, dot, phKey }) => (
          <Card key={key}>
            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block', marginRight: 6, flexShrink: 0 }} />
              {t(labelKey)}
            </div>
            <SaveableGhost
              value={profile[key]}
              onSave={v => saveProfileField(key, v)}
              placeholder={t(phKey)}
              minRows={3}
            />
          </Card>
        ))}
      </div>

      {/* METAS */}
      <Card>
        <SectionTitle onAdd={addGoal}>{t('dashboard.month.monthGoals')}</SectionTitle>
        {loading
          ? <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: T.muted }}>{t('dashboard.month.loading')}</p>
          : goals.length === 0
            ? <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: T.muted }}>{t('dashboard.month.noGoals')}</p>
            : (
              <>
                {visibleGoals.map(g => (
                  <GoalItem key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} t={t} />
                ))}
                {goals.length > GOALS_PREVIEW && (
                  <button
                    onClick={() => setGoalsExpanded(e => !e)}
                    style={{ fontFamily: 'sans-serif', fontSize: 11, color: T.amber, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0', display: 'block' }}
                  >
                    {goalsExpanded
                      ? t('dashboard.month.showLess')
                      : t('dashboard.month.showMore', { count: goals.length - GOALS_PREVIEW })
                    }
                  </button>
                )}
              </>
            )
        }
      </Card>

      {/* MAPA FINANCEIRO */}
      <Card>
        <SectionTitle onAdd={addBill}>{t('dashboard.month.financialMap')}</SectionTitle>
        {bills.length === 0 && (
          <AddRow onClick={addBill} label={t('dashboard.month.addBill')} />
        )}
        {bills.map(b => (
          <BillRow key={b.id} bill={b} onUpdate={updateBill} onDelete={deleteBill} t={t} />
        ))}
        {bills.length > 0 && (
          <AddRow onClick={addBill} label={t('dashboard.month.addBill')} />
        )}
      </Card>

      {/* SAÚDE + LARGAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card>
          <SectionTitle onAdd={addHealth}>{t('dashboard.month.healthBody')}</SectionTitle>
          {health.map(h => (
            <EditableListItem
              key={h.id}
              value={h.title}
              onChange={e => updateHealth(h.id, 'title', e.target.value)}
              onDelete={() => deleteHealth(h.id)}
              placeholder={t('dashboard.month.healthPlaceholder')}
              bullet={T.sand}
            />
          ))}
          <AddRow onClick={addHealth} label={t('dashboard.month.add')} />
        </Card>
        <Card>
          <SectionTitle onAdd={addLargar}>{t('dashboard.month.whatToRelease')}</SectionTitle>
          {largar.map(l => (
            <EditableListItem
              key={l.id}
              value={l.title}
              onChange={e => updateLargar(l.id, 'title', e.target.value)}
              onDelete={() => deleteLargar(l.id)}
              placeholder={t('dashboard.month.releasePlaceholder')}
              bullet={T.sand}
            />
          ))}
          <AddRow onClick={addLargar} label={t('dashboard.month.add')} />
        </Card>
      </div>

      {/* VISÃO GERAL */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, color: T.green }}>
            {t('dashboard.month.overview', { month: monthName })}
          </span>
          {/* % / x/x toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(26,58,31,0.06)', borderRadius: 20, padding: 3 }}>
            {['pct', 'frac'].map(m => (
              <button
                key={m}
                onClick={() => setStatsMode(m)}
                style={{
                  fontFamily: 'sans-serif', fontSize: 11,
                  color: statsMode === m ? T.green : T.muted,
                  background: statsMode === m ? '#fff' : 'transparent',
                  border: 'none', borderRadius: 16,
                  padding: '3px 10px', cursor: 'pointer',
                  fontWeight: statsMode === m ? 500 : 400,
                  boxShadow: statsMode === m ? '0 0 0 0.5px rgba(26,58,31,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'pct' ? '%' : 'x/x'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <StatItem label={t('dashboard.month.routinesDone')} value={routinesDone} total={routinesDone} mode={statsMode} rawValue={`${routinesDone}`} />
          <StatItem label={t('dashboard.month.tasksDone')} value={tasksDone} total={tasksTotal} mode={statsMode} />
          <StatItem label={t('dashboard.month.monthGoalsStat')} value={goals.length} total={goals.length} mode={statsMode} rawValue={`${goals.length}`} />
        </div>

        {/* Week bars */}
        {stats.weekBars.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Label>{t('dashboard.month.weeklyArc')}</Label>
            <div style={{ marginTop: 12 }}>
              <WeekBars weekBars={stats.weekBars} />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
