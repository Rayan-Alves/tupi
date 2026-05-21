import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Check, Flame, Moon, Sun, Sunset } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/* ─── Palette tokens ─────────────────────────── */
const C = {
  igapo:        '#1A3A1F',
  amber:        '#C8841A',
  tabatinga:    '#C4A882',
  neblina:      '#F5F0E8',
  neblinaHover: '#EDE7DC',
  mist:         '#E8E2D9',
  ink:          '#2C2A26',
  inkLight:     '#7A7065',
  inkXLight:    '#AFA89E',
}

/* ─── Time-of-day periods ────────────────────── */
const PERIODS = [
  {
    key:     'morning',
    labelPT: 'Manhã',
    labelEN: 'Morning',
    labelES: 'Mañana',
    icon:    Sun,
    hours:   [5, 6, 7, 8, 9, 10, 11],
    bg:      'rgba(200,132,26,0.025)',
    accent:  '#C8841A',
  },
  {
    key:     'afternoon',
    labelPT: 'Tarde',
    labelEN: 'Afternoon',
    labelES: 'Tarde',
    icon:    Sunset,
    hours:   [12, 13, 14, 15, 16, 17, 18],
    bg:      'rgba(196,168,130,0.055)',
    accent:  '#8E6A2A',
  },
  {
    key:     'night',
    labelPT: 'Noite',
    labelEN: 'Night',
    labelES: 'Noche',
    icon:    Moon,
    hours:   [19, 20, 21, 22, 23, 0, 1, 2, 3, 4],
    bg:      'rgba(26,58,31,0.04)',
    accent:  '#1A3A1F',
  },
]

const WEEK_DAYS  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'S', tue: 'T', wed: 'Q', thu: 'Q', fri: 'S', sat: 'S', sun: 'D' }

function getPeriodForRoutine(routine) {
  if (!routine.start_time) return 'morning'
  const hour = parseInt(routine.start_time.split(':')[0], 10)
  for (const p of PERIODS) {
    if (p.hours.includes(hour)) return p.key
  }
  return 'morning'
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getTodayDayKey() {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[new Date().getDay()]
}

/* ─── Radial breath ring ─────────────────────── */
function BreathRing({ pct = 0, size = 72, accent = C.amber, allDone = false, children }) {
  const sw = 2.5
  const r  = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 1)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={C.mist} strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={allDone ? C.igapo : accent}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1), stroke 0.7s ease' }}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Single routine row ─────────────────────── */
function RoutineRow({ routine, completed, onToggle, onDelete, onSaveField, accent }) {
  const [editing,     setEditing]     = useState(false)
  const [title,       setTitle]       = useState(routine.title || '')
  const [expanded,    setExpanded]    = useState(false)
  const [justChecked, setJustChecked] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setTitle(routine.title || '') }, [routine.id])

  function handleTitleBlur() {
    setEditing(false)
    if (title.trim() !== routine.title) {
      onSaveField(routine.id, 'title', title.trim())
    }
  }

  function handleToggle() {
    if (!completed) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 600)
    }
    onToggle(routine.id)
  }

  const days = routine.days || []

  return (
    <div
      className={`rotinas-row${completed ? ' rotinas-row--done' : ''}`}
      style={{ '--row-accent': accent }}
    >
      {/* Ceremony check */}
      <button
        id={`rotina-check-${routine.id}`}
        onClick={handleToggle}
        className={`rotinas-check${completed ? ' rotinas-check--done' : ''}${justChecked ? ' rotinas-check--bloom' : ''}`}
        aria-label={completed ? 'desmarcar' : 'completar'}
      >
        {completed && <Check size={10} strokeWidth={3} style={{ color: 'white' }} />}
      </button>

      {/* Content */}
      <div className="rotinas-row-content" onClick={() => !editing && setExpanded(e => !e)}>
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') inputRef.current?.blur()
              if (e.key === 'Escape') { setTitle(routine.title || ''); setEditing(false) }
            }}
            className="rotinas-title-input"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={`rotinas-title${completed ? ' rotinas-title--done' : ''}`}
            onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
          >
            {title || <span className="rotinas-placeholder">Nomeie este ritual…</span>}
          </span>
        )}

        {routine.start_time && (
          <span className="rotinas-time">
            {routine.start_time.slice(0, 5)}
            {routine.end_time && <> – {routine.end_time.slice(0, 5)}</>}
          </span>
        )}
      </div>

      {/* Delete — hover reveal */}
      <button
        onClick={() => onDelete(routine.id)}
        className="rotinas-delete"
        aria-label="remover"
      >
        <Trash2 size={11} />
      </button>

      {/* Expanded drawer */}
      {expanded && (
        <div className="rotinas-expanded" onClick={e => e.stopPropagation()}>
          <div className="rotinas-days">
            {WEEK_DAYS.map(day => {
              const on = days.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => {
                    const next = on ? days.filter(d => d !== day) : [...days, day]
                    onSaveField(routine.id, 'days', next)
                  }}
                  className={`rotinas-day-pill${on ? ' rotinas-day-pill--on' : ''}`}
                  style={on ? { backgroundColor: accent, borderColor: accent, color: 'white' } : {}}
                >
                  {DAY_LABELS[day]}
                </button>
              )
            })}
          </div>
          <div className="rotinas-times">
            <label className="rotinas-time-label">
              início
              <input
                type="time"
                value={routine.start_time || ''}
                onChange={e => onSaveField(routine.id, 'start_time', e.target.value || null)}
                className="rotinas-time-input"
              />
            </label>
            <span className="rotinas-time-sep">→</span>
            <label className="rotinas-time-label">
              fim
              <input
                type="time"
                value={routine.end_time || ''}
                onChange={e => onSaveField(routine.id, 'end_time', e.target.value || null)}
                className="rotinas-time-input"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Period section ─────────────────────────── */
function PeriodSection({ period, routines, completedToday, onToggle, onDelete, onSaveField, lang }) {
  const periodRoutines = routines.filter(r => getPeriodForRoutine(r) === period.key)
  if (periodRoutines.length === 0) return null

  const Icon    = period.icon
  const total   = periodRoutines.length
  const done    = periodRoutines.filter(r => completedToday[r.id]).length
  const allDone = total > 0 && done === total

  const label =
    lang === 'pt' ? period.labelPT :
    lang === 'es' ? period.labelES :
    period.labelEN

  return (
    <section className="rotinas-section">
      {/* Period divider */}
      <div className="rotinas-period-divider">
        <div className="rotinas-period-line" style={{ backgroundColor: period.accent }} />
        <div className="rotinas-period-chip" style={{ color: period.accent }}>
          <Icon size={11} />
          <span>{label}</span>
          {allDone && <span className="rotinas-period-mark">✦</span>}
        </div>
        <div className="rotinas-period-line" style={{ backgroundColor: period.accent }} />
      </div>

      {/* Routines */}
      <div className="rotinas-list" style={{ background: period.bg, borderRadius: 14 }}>
        {periodRoutines.map(r => (
          <RoutineRow
            key={r.id}
            routine={r}
            completed={!!completedToday[r.id]}
            onToggle={onToggle}
            onDelete={onDelete}
            onSaveField={onSaveField}
            accent={period.accent}
          />
        ))}
      </div>
    </section>
  )
}

/* ─── Empty state ────────────────────────────── */
function EmptyState({ onAdd }) {
  return (
    <div className="rotinas-empty">
      <div className="rotinas-empty-glyph" aria-hidden="true">◎</div>
      <p className="rotinas-empty-title">Ainda não há rituais</p>
      <p className="rotinas-empty-desc">
        Um ritual é simples.<br />Um momento que pertence só a você.
      </p>
      <button id="rotinas-add-first" onClick={onAdd} className="rotinas-add-first">
        Criar o primeiro ritual
      </button>
    </div>
  )
}

/* ─── Streak badge ───────────────────────────── */
function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null
  return (
    <div className="rotinas-streak">
      <Flame size={12} style={{ color: C.amber }} />
      <span>{streak}</span>
    </div>
  )
}

/* ─── Main page ──────────────────────────────── */
export default function Rotinas() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'pt'
  const { user } = useAuth()

  const [routines,       setRoutines]       = useState([])
  const [completedToday, setCompletedToday] = useState({})
  const [streak,         setStreak]         = useState(0)
  const [loading,        setLoading]        = useState(true)

  /* ── Fetch routines + today completions ── */
  useEffect(() => {
    if (!user) return
    const today = todayKey()
    Promise.all([
      supabase.from('body_routines').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('routine_completions')
        .select('routine_id')
        .eq('user_id', user.id)
        .eq('completed_date', today),
    ]).then(([rRes, cRes]) => {
      if (rRes.data) setRoutines(rRes.data)
      if (cRes.data && !cRes.error) {
        const map = {}
        cRes.data.forEach(c => { map[c.routine_id] = true })
        setCompletedToday(map)
      }
      setLoading(false)
    })
  }, [user?.id])

  /* ── Compute streak ── */
  useEffect(() => {
    if (!user || routines.length === 0) return
    async function computeStreak() {
      const { data } = await supabase
        .from('routine_completions')
        .select('completed_date')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false })
        .limit(60)
      if (!data) return
      const dates = [...new Set(data.map(d => d.completed_date))].sort().reverse()
      let s = 0, cur = new Date()
      cur.setHours(0, 0, 0, 0)
      for (const d of dates) {
        const dt   = new Date(d + 'T00:00:00')
        const diff = (cur - dt) / 86400000
        if (diff <= 1) { s++; cur = dt } else break
      }
      setStreak(s)
    }
    computeStreak()
  }, [user?.id, routines.length, completedToday])

  /* ── Toggle completion ── */
  async function toggleCompletion(routineId) {
    const today    = todayKey()
    const isNowDone = !completedToday[routineId]
    setCompletedToday(prev => {
      const next = { ...prev }
      if (isNowDone) next[routineId] = true
      else delete next[routineId]
      return next
    })
    if (isNowDone) {
      await supabase.from('routine_completions').upsert(
        { user_id: user.id, routine_id: routineId, completed_date: today },
        { onConflict: 'user_id,routine_id,completed_date' }
      )
    } else {
      await supabase.from('routine_completions').delete()
        .eq('user_id', user.id).eq('routine_id', routineId).eq('completed_date', today)
    }
  }

  /* ── CRUD ── */
  async function addRoutine() {
    const { data, error } = await supabase
      .from('body_routines')
      .insert({ user_id: user.id, title: '', days: [], start_time: null, end_time: null })
      .select().single()
    if (!error && data) setRoutines(prev => [...prev, data])
  }

  async function saveRoutineField(id, field, value) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    await supabase.from('body_routines').update({ [field]: value }).eq('id', id).eq('user_id', user.id)
  }

  async function deleteRoutine(id) {
    setRoutines(prev => prev.filter(r => r.id !== id))
    await supabase.from('body_routines').delete().eq('id', id).eq('user_id', user.id)
  }

  /* ── Day stats ── */
  const todayDay     = getTodayDayKey()
  const todayRoutines = routines.filter(r => {
    const days = r.days || []
    return days.length === 0 || days.includes(todayDay)
  })
  const total   = todayRoutines.length
  const done    = todayRoutines.filter(r => completedToday[r.id]).length
  const pct     = total > 0 ? done / total : 0
  const allDone = total > 0 && done === total

  const dateStr = new Date().toLocaleDateString(
    lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' }
  )

  if (loading) {
    return (
      <div className="rotinas-loading">
        <div className="rotinas-loading-ring" />
      </div>
    )
  }

  return (
    <div className="rotinas-page">

      {/* ── Header ── */}
      <header className="rotinas-header">
        <div className="rotinas-header-left">
          <p className="rotinas-date">{dateStr}</p>
          <h1 className="rotinas-heading">Rotinas</h1>
          {total > 0 && (
            <p className="rotinas-day-label">
              {allDone ? 'Dia completo ✦' : `${done} de ${total} hoje`}
            </p>
          )}
        </div>

        <div className="rotinas-header-right">
          {total > 0 && (
            <BreathRing pct={pct} size={72} allDone={allDone}>
              <div className="rotinas-ring-inner">
                {allDone
                  ? <span style={{ fontSize: 20, color: C.igapo, lineHeight: 1 }}>✦</span>
                  : <>
                      <span className="rotinas-ring-done">{done}</span>
                      <span className="rotinas-ring-sep">/</span>
                      <span className="rotinas-ring-total">{total}</span>
                    </>
                }
              </div>
            </BreathRing>
          )}
          <div className="rotinas-header-actions">
            <StreakBadge streak={streak} />
            <button
              id="rotinas-add-btn"
              onClick={addRoutine}
              className="rotinas-add-btn"
              aria-label="adicionar ritual"
            >
              <Plus size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-day completion banner ── */}
      {allDone && (
        <div className="rotinas-completion-banner">
          <p className="rotinas-completion-text">
            Todos os rituais do dia concluídos.
          </p>
        </div>
      )}

      {/* ── Content ── */}
      <div className="rotinas-content">
        {routines.length === 0
          ? <EmptyState onAdd={addRoutine} />
          : PERIODS.map(period => (
              <PeriodSection
                key={period.key}
                period={period}
                routines={routines}
                completedToday={completedToday}
                onToggle={toggleCompletion}
                onDelete={deleteRoutine}
                onSaveField={saveRoutineField}
                lang={lang}
              />
            ))
        }
      </div>

    </div>
  )
}
