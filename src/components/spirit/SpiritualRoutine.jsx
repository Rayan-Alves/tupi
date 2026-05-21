import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/* ─────────────────────────────────────────────────────────────────────────
   SpiritualRoutine — Tupi · ritmo
   Paper-first revamp of the routine section inside the Spirit page.
   Adapted from the Claude Design handoff (Árvore da Vida → rotinas.jsx)
   to bind directly to the existing spirit_routines table via useSpirit.

   DB shape per routine:
     { id, title, days: ['mon'|'tue'|...], start_time: 'HH:MM' | null, end_time }
   Design shape (internal only):
     { id, title, days: [0|1]*7 starting Sunday, start, end }
   ─────────────────────────────────────────────────────────────────────── */

const DAYS_DB  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAYS_DB_FROM_MON = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const DAY_LETTERS_BY_LANG = {
  pt: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
}

const PERIOD_LABEL_BY_LANG = {
  pt: { madrugada: 'madrugada', morning: 'manhã',   afternoon: 'tarde',     night: 'noite'  },
  en: { madrugada: 'dawn',      morning: 'morning', afternoon: 'afternoon', night: 'night'  },
  es: { madrugada: 'madrugada', morning: 'mañana',  afternoon: 'tarde',     night: 'noche'  },
}

function dbDaysToArray(dbDays) {
  // Convert ['mon','wed'] (any order) to [0,1,0,1,0,0,0] indexed sun..sat
  const a = [0, 0, 0, 0, 0, 0, 0]
  if (!Array.isArray(dbDays)) return a
  dbDays.forEach(d => {
    const i = DAYS_DB.indexOf(d)
    if (i >= 0) a[i] = 1
  })
  return a
}
function arrayToDbDays(arr) {
  return arr.map((v, i) => (v ? DAYS_DB[i] : null)).filter(Boolean)
}

function toMinutes(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fmtDur(start, end) {
  const a = toMinutes(start), b = toMinutes(end)
  if (a == null || b == null) return ''
  let d = b - a; if (d < 0) d += 24 * 60
  const h = Math.floor(d / 60), m = d % 60
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`
  if (h) return `${h}h`
  return `${m} min`
}
function periodOf(start) {
  const m = toMinutes(start); if (m == null) return 'morning'
  if (m < 6 * 60)  return 'madrugada'
  if (m < 12 * 60) return 'morning'
  if (m < 18 * 60) return 'afternoon'
  return 'night'
}

// Sun-cycle color at a given minute of day.
const SUN_STOPS = [
  { t: 0,    c: [28, 38, 70]   },
  { t: 270,  c: [50, 60, 105]  },
  { t: 360,  c: [200, 150, 95] },
  { t: 450,  c: [242, 198, 108]},
  { t: 720,  c: [232, 178, 80] },
  { t: 1020, c: [212, 140, 70] },
  { t: 1110, c: [180, 95, 80]  },
  { t: 1200, c: [110, 80, 135] },
  { t: 1320, c: [50, 60, 105]  },
  { t: 1440, c: [28, 38, 70]   },
]
function sunColor(mins) {
  const m = ((mins % 1440) + 1440) % 1440
  for (let i = 0; i < SUN_STOPS.length - 1; i++) {
    const a = SUN_STOPS[i], b = SUN_STOPS[i + 1]
    if (m >= a.t && m <= b.t) {
      const f = (m - a.t) / (b.t - a.t)
      const c = a.c.map((v, idx) => Math.round(v + (b.c[idx] - v) * f))
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    }
  }
  return `rgb(${SUN_STOPS[0].c.join(',')})`
}

/* ─── Tokens (scoped to component) ─────────────────────────────────────── */
const TOKENS = {
  igapo:        '#1A3A1F',
  tabatinga:    '#C4A882',
  paper:        '#FDFAF3',
  neblina:      '#F5F0E8',
  neblinaCool:  '#F8F4ED',
  fontHead:     '"Cormorant Garamond", Georgia, serif',
  fontBody:     '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
}

/* ─── Day-of-week row ──────────────────────────────────────────────────── */
function DayRow({ days, onToggle, accent, letters }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, fontFamily: TOKENS.fontBody }}>
      {letters.map((L, i) => {
        const on = !!days[i]
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            style={{
              all: 'unset', cursor: 'pointer',
              position: 'relative',
              width: 14, height: 22,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, letterSpacing: '0.04em',
              color: on ? TOKENS.igapo : 'rgba(60,45,20,0.32)',
              fontWeight: on ? 600 : 400,
              transition: 'color .25s',
            }}
          >
            {L}
            <span style={{
              position: 'absolute',
              left: '50%', bottom: 1, transform: 'translateX(-50%)',
              width: on ? 16 : 0, height: 1.5,
              background: accent,
              borderRadius: 1,
              transition: 'width .3s cubic-bezier(.2,.7,.3,1)',
            }} />
          </button>
        )
      })}
    </div>
  )
}

/* ─── Inline time editor ───────────────────────────────────────────────── */
function InlineTime({ value, onChange, placeholder = '--:--' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  useEffect(() => setDraft(value || ''), [value])

  const commit = () => {
    setEditing(false)
    let v = draft.replace(/[^0-9]/g, '').slice(0, 4)
    if (!v) { if (value) onChange(''); return }
    if (v.length <= 2) v = v.padStart(2, '0') + '00'
    else v = v.padStart(4, '0')
    const h = Math.min(23, parseInt(v.slice(0, 2), 10))
    const m = Math.min(59, parseInt(v.slice(2), 10))
    const out = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    if (out !== value) onChange(out)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={editing ? draft : (value || '')}
      placeholder={placeholder}
      onPointerDown={e => e.stopPropagation()}
      onFocus={e => { setEditing(true); setDraft(value || ''); e.target.select() }}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
      style={{
        width: '4.4ch', border: 'none', outline: 'none',
        background: 'transparent',
        fontFamily: TOKENS.fontBody,
        fontSize: 14, letterSpacing: '0.02em',
        color: value ? TOKENS.igapo : 'rgba(60,45,20,0.35)',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'center',
        padding: '2px 0',
        cursor: 'text',
      }}
    />
  )
}

/* ─── Saved dot ────────────────────────────────────────────────────────── */
function SavedDot({ stamp, label }) {
  return (
    <span
      key={stamp}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontStyle: 'italic', letterSpacing: '0.04em',
        color: 'rgba(60,45,20,0.4)',
        fontFamily: TOKENS.fontBody,
        animation: 'sr-saved-fade 1.6s ease-out',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E5D2E', opacity: 0.7 }} />
      {label}
    </span>
  )
}

/* ─── Routine card ─────────────────────────────────────────────────────── */
function RotinaCard({ routine, onSaveField, onDelete, focused, onFocus, letters, periodLabel, savedLabel, titlePlaceholder }) {
  const daysArr = useMemo(() => dbDaysToArray(routine.days), [routine.days])
  const start = routine.start_time || ''
  const end   = routine.end_time   || ''
  const period = periodOf(start)
  const accent = start ? sunColor(toMinutes(start)) : TOKENS.tabatinga
  const dur = fmtDur(start, end)
  const [savedStamp, setSavedStamp] = useState(0)
  const stampSave = () => setSavedStamp(Date.now())
  const titleRef = useRef(null)
  const lastTitle = useRef(routine.title || '')

  // keep contentEditable in sync when row changes id
  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== (routine.title || '')) {
      titleRef.current.textContent = routine.title || ''
    }
    lastTitle.current = routine.title || ''
  }, [routine.id])

  const toggleDay = (i) => {
    const next = daysArr.slice()
    next[i] = next[i] ? 0 : 1
    onSaveField(routine.id, 'days', arrayToDbDays(next))
    stampSave()
  }

  const handleTitleBlur = (e) => {
    const v = e.currentTarget.textContent || ''
    if (v !== lastTitle.current) {
      lastTitle.current = v
      onSaveField(routine.id, 'title', v)
      stampSave()
    }
  }

  return (
    <div
      onClick={onFocus}
      style={{
        position: 'relative',
        padding: '14px 18px 13px',
        background: TOKENS.paper,
        borderRadius: 14,
        boxShadow: focused
          ? '0 1px 0 rgba(255,255,255,0.7) inset, 0 6px 18px rgba(60,45,20,0.07), 0 1px 3px rgba(60,45,20,0.04)'
          : '0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 8px rgba(60,45,20,0.04)',
        transition: 'box-shadow .25s',
      }}
    >
      {/* phase-accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 18, right: 18, height: 1.5,
        background: accent, opacity: 0.8, borderRadius: 2,
      }} />

      {/* row 1: title + meta + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            onPointerDown={e => e.stopPropagation()}
            onBlur={handleTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            data-placeholder={titlePlaceholder}
            className="sr-title"
            style={{
              outline: 'none',
              fontFamily: TOKENS.fontHead,
              fontSize: 22, lineHeight: 1.15,
              fontStyle: 'italic',
              color: TOKENS.igapo,
              minHeight: '1em',
              cursor: 'text',
              letterSpacing: '-0.005em',
            }}
          >
            {routine.title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2 }}>
          {!!savedStamp && <SavedDot stamp={savedStamp} label={savedLabel} />}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(routine.id) }}
            aria-label="delete"
            style={{
              all: 'unset', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(60,45,20,0.35)',
              transition: 'color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(60,45,20,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(60,45,20,0.35)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 7h14" />
              <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      {/* row 2: days + time range */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <DayRow days={daysArr} onToggle={toggleDay} accent={accent} letters={letters} />
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 6,
          padding: '3px 10px',
          background: TOKENS.neblinaCool,
          borderRadius: 8,
          fontFamily: TOKENS.fontBody,
        }}>
          <InlineTime value={start} onChange={v => { onSaveField(routine.id, 'start_time', v || null); stampSave() }} />
          <span style={{ color: TOKENS.tabatinga, fontFamily: TOKENS.fontHead, fontSize: 16, fontStyle: 'italic', transform: 'translateY(-1px)' }}>→</span>
          <InlineTime value={end}   onChange={v => { onSaveField(routine.id, 'end_time',   v || null); stampSave() }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Daily arc ────────────────────────────────────────────────────────── */
function DailyArc({ routines, centerTitle, centerSub }) {
  const W = 520, H = 220
  const cx = W / 2, cy = 188, r = 168
  const angleOf = (mins) => Math.PI + (mins / (24 * 60)) * Math.PI
  const ptOn = (mins, rr = r) => ({
    x: cx + Math.cos(angleOf(mins)) * rr,
    y: cy + Math.sin(angleOf(mins)) * rr,
  })

  const SEGS = 96
  const sunSegments = []
  for (let i = 0; i < SEGS; i++) {
    const t0 = (i / SEGS) * 1440
    const t1 = ((i + 1) / SEGS) * 1440
    const a = ptOn(t0, r), b = ptOn(t1, r)
    sunSegments.push({ d: `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`, c: sunColor((t0 + t1) / 2) })
  }
  const ticks = [
    { m: 0, label: '00' }, { m: 360, label: '06' }, { m: 720, label: '12' },
    { m: 1080, label: '18' }, { m: 1439, label: '24' },
  ]
  const sunStroke = 4.5
  const markerStroke = 4.5

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }}>
        <defs>
          <radialGradient id="sr-noon-glow" cx="50%" cy="100%" r="60%">
            <stop offset="0%"   stopColor="rgba(242,198,108,0.18)" />
            <stop offset="60%"  stopColor="rgba(242,198,108,0.05)" />
            <stop offset="100%" stopColor="rgba(242,198,108,0)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#sr-noon-glow)" />

        {sunSegments.map((seg, i) => (
          <path key={i} d={seg.d} fill="none" stroke={seg.c} strokeWidth={sunStroke} strokeLinecap="butt" opacity="0.85" />
        ))}

        <path
          d={`M ${ptOn(0, r - sunStroke - 4).x} ${ptOn(0, r - sunStroke - 4).y} A ${r - sunStroke - 4} ${r - sunStroke - 4} 0 0 1 ${ptOn(1439, r - sunStroke - 4).x} ${ptOn(1439, r - sunStroke - 4).y}`}
          fill="none" stroke="rgba(196,168,130,0.55)" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.7"
        />

        {ticks.map(t => {
          const inner = ptOn(t.m, r - sunStroke - 2)
          const outer = ptOn(t.m, r + sunStroke - 1)
          const isTop = t.m === 720
          const lblR = isTop ? r - sunStroke - 18 : r + sunStroke + 16
          const lbl = ptOn(t.m, lblR)
          return (
            <g key={t.m}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(60,45,20,0.35)" strokeWidth="0.7" />
              <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
                fontFamily={TOKENS.fontBody} fontSize="11" fill="rgba(60,45,20,0.45)"
                style={{ letterSpacing: '0.06em' }}>{t.label}</text>
            </g>
          )
        })}

        {routines.filter(rt => rt.start_time).map(rt => {
          const m = toMinutes(rt.start_time)
          const mEnd = toMinutes(rt.end_time) ?? (m + 30)
          const innerR = r - sunStroke - 10
          const a = ptOn(m, innerR), b = ptOn(Math.max(m + 8, mEnd), innerR)
          const accent = sunColor(m)
          return (
            <g key={rt.id}>
              <path d={`M ${a.x} ${a.y} A ${innerR} ${innerR} 0 0 1 ${b.x} ${b.y}`} fill="none"
                stroke={accent} strokeWidth={markerStroke} strokeLinecap="round" opacity="0.92" />
              <circle cx={a.x} cy={a.y} r="3.2" fill={TOKENS.paper} stroke={accent} strokeWidth="1.4" />
            </g>
          )
        })}

        <text x={cx} y={cy - 18} textAnchor="middle" fontFamily={TOKENS.fontHead} fontStyle="italic" fontSize="18" fill="rgba(60,45,20,0.5)">
          {centerTitle}
        </text>
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily={TOKENS.fontBody} fontSize="10" fill={TOKENS.tabatinga} style={{ letterSpacing: '0.18em' }}>
          {centerSub}
        </text>
      </svg>
    </div>
  )
}

/* ─── Main section ─────────────────────────────────────────────────────── */
/**
 * Reusable routine section. Used in Spirit, Mind and Body pages.
 * Props:
 *   routines, addRoutine, saveRoutineField, deleteRoutine  ← from the domain hook
 *   titleKey                                               ← e.g. 'spirit.routine.title'
 *   subtitleKey                                            ← e.g. 'spirit.routine.subtitle'
 *
 * All other labels (eyebrow, rituals count, "salvo", placeholders, arc center)
 * are shared and read from `routineCommon.*` i18n namespace.
 */
export default function SpiritualRoutine({
  routines, addRoutine, saveRoutineField, deleteRoutine,
  titleKey = 'spirit.routine.title',
  subtitleKey = 'spirit.routine.subtitle',
}) {
  const { t, i18n } = useTranslation()
  const [focusedId, setFocusedId] = useState(null)

  const lang = (i18n.language || 'pt').slice(0, 2)
  const letters     = DAY_LETTERS_BY_LANG[lang]      || DAY_LETTERS_BY_LANG.pt
  const periodLabel = PERIOD_LABEL_BY_LANG[lang]     || PERIOD_LABEL_BY_LANG.pt

  const sorted = useMemo(() => {
    return routines.slice().sort((a, b) => {
      const am = toMinutes(a.start_time) ?? 9999
      const bm = toMinutes(b.start_time) ?? 9999
      return am - bm
    })
  }, [routines])

  return (
    <section className="pb-16">
      <style>{`
        @keyframes sr-saved-fade {
          0% { opacity: 0; transform: translateY(2px); }
          15% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .sr-title[contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgba(196,168,130,0.55);
          font-style: italic;
          pointer-events: none;
        }
      `}</style>

      <div
        style={{
          background: 'transparent',
          padding: '24px 0 12px',
          marginTop: 0,
        }}
      >
        {/* header — matches "My Personal Values" / "Deep Desires" pattern */}
        <div className="mb-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="type-h2 mb-1" style={{ color: '#6B6258' }}>
                {t(titleKey)}
              </h2>
              <p className="text-[#8B8378] text-xs">
                {t(subtitleKey)}
              </p>
            </div>
          </div>
        </div>

        {/* daily arc */}
        <div style={{ marginTop: 36, marginBottom: 36 }}>
          <DailyArc
            routines={routines}
            centerTitle={t('routineCommon.arcCenter')}
            centerSub={t('routineCommon.arcCenterSub')}
          />
        </div>

        {/* routines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(r => (
            <RotinaCard
              key={r.id}
              routine={r}
              focused={focusedId === r.id}
              onFocus={() => setFocusedId(r.id)}
              onSaveField={saveRoutineField}
              onDelete={deleteRoutine}
              letters={letters}
              periodLabel={periodLabel}
              savedLabel={t('routineCommon.saved')}
              titlePlaceholder={t('routineCommon.titlePlaceholder')}
            />
          ))}

          <button
            onClick={addRoutine}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '14px',
              border: `1.3px dashed ${TOKENS.tabatinga}`,
              borderRadius: 14,
              color: TOKENS.tabatinga,
              textAlign: 'center',
              fontFamily: TOKENS.fontBody,
              fontStyle: 'italic',
              fontSize: 14,
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: 0.85,
              transition: 'opacity .2s, background .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(253,250,243,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            {t('routineCommon.addLabel')}
          </button>
        </div>
      </div>
    </section>
  )
}
