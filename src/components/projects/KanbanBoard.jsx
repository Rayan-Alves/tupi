import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { playProgress } from '../../lib/sounds'
import { hasRecurrence, totalOccurrences, computeCheckUpdate, computeProgress } from '../../lib/recurring'
import { isSmartComplete } from './SmartTab'

/* ─── New variant A tokens ─────────────────────────────────── */

export const STAGES = [
  { key: 'soil',    color: '#B5732A', dot: '#B5732A', deep: '#6E4317', tint: '#EAD9BE', tint2: '#F1E6CF', soft: '#F8EFDC', bg: '#F8EFDC', hdr: '#F1E6CF', text: '#6E4317' },
  { key: 'plant',   color: '#527B40', dot: '#527B40', deep: '#2D5016', tint: '#D6E1C5', tint2: '#E2EAD4', soft: '#ECF2DF', bg: '#ECF2DF', hdr: '#E2EAD4', text: '#2D5016' },
  { key: 'water',   color: '#2A5A85', dot: '#2A5A85', deep: '#1B3A5C', tint: '#CDDAE6', tint2: '#DCE6EE', soft: '#E8EEF4', bg: '#E8EEF4', hdr: '#DCE6EE', text: '#1B3A5C' },
  { key: 'harvest', color: '#B6800E', dot: '#B6800E', deep: '#7E5808', tint: '#ECD8A0', tint2: '#F2E1B3', soft: '#F8EDCC', bg: '#F8EDCC', hdr: '#F2E1B3', text: '#7E5808' },
]
const KEYS = STAGES.map(s => s.key)
export const stageLabel = (key, t) => t(`projects.stages.${key}`)

/* ─── CSS (variant A) ──────────────────────────────────────── */

const CSS = `
.kb-root {
  --bg-sand: #F5F0E8; --bg-paper: #FBF7EF; --bg-paper-soft: #F1EAD9;
  --ink: #2A2520; --ink-soft: #4A4138; --ink-mute: #8B7E6F; --ink-faint: #B6AC9D;
  --rule: #D9CFC0; --rule-soft: #E5DCCB; --rule-strong: #C7BBA6;
  --soil: #B5732A; --soil-deep: #6E4317; --soil-tint: #EAD9BE; --soil-tint-2: #F1E6CF; --soil-soft: #F8EFDC;
  --plant: #527B40; --plant-deep: #2D5016; --plant-tint: #D6E1C5; --plant-tint-2: #E2EAD4; --plant-soft: #ECF2DF;
  --water: #2A5A85; --water-deep: #1B3A5C; --water-tint: #CDDAE6; --water-tint-2: #DCE6EE; --water-soft: #E8EEF4;
  --harvest: #B6800E; --harvest-deep: #7E5808; --harvest-tint: #ECD8A0; --harvest-tint-2: #F2E1B3; --harvest-soft: #F8EDCC;
  background: var(--bg-sand);
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
.kb-root * { box-sizing: border-box; }
.kb-root button { font-family: inherit; cursor: pointer; }

.kb-mono {
  font-family: 'Courier Prime', 'Courier New', ui-monospace, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Header */
.kb-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 32px 40px 0; gap: 24px; flex-wrap: wrap;
}
.kb-title { font-size: 56px; line-height: 0.95; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 8px; color: var(--ink); }
.kb-title em { font-style: italic; font-weight: 500; color: var(--soil-deep); }
.kb-eyebrow { font-size: 10px; color: var(--ink-mute); display: flex; align-items: center; gap: 12px;
  font-family: 'Courier Prime', monospace; text-transform: uppercase; letter-spacing: 0.08em; }
.kb-eyebrow::before { content: ""; display: inline-block; width: 24px; height: 1px; background: var(--rule-strong); }
.kb-headerR { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.kb-viewtoggle { display: inline-flex; background: transparent; border: 1px solid var(--rule);
  border-radius: 999px; padding: 3px; font-size: 11px; }
.kb-viewtoggle button { background: transparent; border: 0; padding: 7px 14px; border-radius: 999px;
  color: var(--ink-mute); font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; font-size: 11px; }
.kb-viewtoggle button.is-active { background: var(--ink); color: var(--bg-sand); }
.kb-newbtn { background: var(--soil-deep); color: var(--soil-soft); border: 0;
  padding: 10px 20px 12px; border-radius: 999px;
  font-family: 'Cormorant Garamond', serif; font-size: 16px; font-style: italic;
  letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.kb-newbtn::before { content: "+"; font-style: normal; font-size: 15px; font-family: 'Courier Prime', monospace; }
.kb-newbtn:hover { opacity: 0.92; }

/* Chips */
.kb-chips { display: flex; gap: 10px; padding: 24px 40px 0; align-items: center; flex-wrap: wrap; }
.kb-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 10px;
  border-radius: 999px; border: 1px solid var(--c, var(--rule)); background: var(--bg, transparent);
  color: var(--c, var(--ink)); font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
.kb-chip__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, currentColor); }
.kb-chip__n { font-variant-numeric: tabular-nums; opacity: 0.6; margin-left: 2px; }

/* Board */
.kb-board { display: grid; grid-template-columns: repeat(4, 1fr); padding: 24px 40px 56px; position: relative; }
.kb-board--ruled > .kb-col + .kb-col { border-left: 1px solid var(--rule-soft); }
.kb-col { padding: 24px 16px 24px; display: flex; flex-direction: column; gap: 16px; position: relative; }

/* Column header */
.kb-colhead { display: flex; align-items: center; gap: 10px; padding: 0 6px 4px; position: relative; }
.kb-colhead__glyph { width: 18px; height: 18px; color: var(--stage, var(--ink)); flex: 0 0 auto; }
.kb-colhead__label { font-family: 'Courier Prime', monospace; font-size: 11px;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--stage-deep, var(--ink)); white-space: nowrap; }
.kb-colhead__count { margin-left: auto; font-family: 'Courier Prime', monospace; font-size: 11px;
  color: var(--ink-mute); font-variant-numeric: tabular-nums; }

/* Card */
.kbcardA { background: var(--bg-paper); border-radius: 4px; padding: 22px 20px 14px; position: relative;
  border: 1px solid var(--rule-soft); border-top: none; box-shadow: 0 1px 0 rgba(0,0,0,0.02);
  cursor: pointer; transition: box-shadow .2s, transform .15s; }
.kbcardA:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.06); transform: translateY(-1px); }
.kbcardA::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 2px;
  background: var(--stage, var(--ink)); }
.kbcardA__title { font-size: 22px; line-height: 1.1; font-weight: 500; margin: 0 0 14px;
  color: var(--ink); letter-spacing: -0.005em; word-break: break-word; }
.kbcardA__dates { font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-mute);
  margin: 0 0 14px; display: flex; gap: 8px; align-items: center; }
.kbcardA__dates svg { width: 11px; height: 11px; flex: 0 0 auto; }
.kbcardA__field { margin: 16px 0 0; }
.kbcardA__field-label { font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink-mute); margin-bottom: 5px; }
.kbcardA__field-value { font-size: 15.5px; line-height: 1.32; font-style: italic; color: var(--ink-soft);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.kbcardA__footer { display: flex; justify-content: space-between; align-items: center;
  margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--rule-soft); gap: 10px; }
.kbcardA__delete { font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.1em;
  text-transform: lowercase; color: var(--ink-faint); background: none; border: 0; padding: 4px 0;
  transition: color .15s; }
.kbcardA__delete:hover { color: #b14a4a; }
.kbcardA__advance { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15px;
  color: var(--stage-deep, var(--ink)); background: none; border: 0;
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 0; letter-spacing: 0.01em; white-space: nowrap;
  transition: opacity .15s; }
.kbcardA__advance:disabled { opacity: 0.35; cursor: not-allowed; }
.kbcardA__advance .arrow { font-family: 'Courier Prime', monospace; font-style: normal; font-size: 13px; }
.kbcardA__advance--done { font-style: normal; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; color: var(--harvest-deep); cursor: default; }

/* Checklist */
.kb-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.kb-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; line-height: 1.3; color: var(--ink-soft); }
.kb-list .mark { width: 13px; height: 13px; flex: 0 0 auto; border-radius: 50%;
  border: 1px solid var(--stage, var(--ink-faint)); position: relative; margin-top: 3px;
  cursor: pointer; transition: background .15s; }
.kb-list li.is-done .mark { background: var(--stage, var(--ink)); }
.kb-list li.is-done .mark::after { content: ""; position: absolute; inset: 3px;
  border-left: 1.5px solid var(--bg-paper); border-bottom: 1.5px solid var(--bg-paper);
  transform: rotate(-45deg) translate(0.5px, -1.5px); }
.kb-list li.is-done .txt { color: var(--ink-mute); text-decoration: line-through;
  text-decoration-color: var(--ink-faint); text-decoration-thickness: 1px; }
.kb-list .txt { flex: 1; word-break: break-word; }
.kb-list .due { font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.08em;
  color: var(--ink-faint); text-transform: uppercase; flex: 0 0 auto; margin-top: 4px; white-space: nowrap; }
.kb-list .more { font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-faint); margin-top: 4px; padding-left: 23px; }

/* per-task progress bar (recurring tasks) */
.kb-list .tprog {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  cursor: pointer; padding: 2px 0;
}
.kb-list .tprog__bar { width: 38px; height: 3px; background: var(--rule-soft); border-radius: 999px; overflow: hidden; }
.kb-list .tprog__fill { height: 100%; background: var(--stage); border-radius: 999px; transition: width .3s; }
.kb-list .tprog__label {
  font-family: 'Courier Prime', monospace; font-size: 9.5px;
  letter-spacing: 0.08em; color: var(--stage-deep); text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

/* Progress */
.kb-progress { display: flex; flex-direction: column; gap: 8px; margin: 6px 0 14px; }
.kb-progress__svg { display: block; width: 100%; height: auto; }
.kb-progress__meta { display: flex; justify-content: space-between; align-items: baseline;
  font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-mute); white-space: nowrap; }
.kb-progress__meta strong { color: var(--stage-deep, var(--ink)); font-weight: 700; }

/* Add card button (soil) */
.kb-addcard { background: transparent; border: 1px dashed var(--soil); color: var(--soil-deep);
  padding: 14px; border-radius: 4px; font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 16px; transition: background .15s, border-style .15s; text-align: center; }
.kb-addcard:hover { background: var(--soil-soft); border-style: solid; }

/* New project form (inline) */
.kb-newform { background: var(--bg-paper); border: 1px solid var(--soil); border-radius: 4px;
  padding: 18px 20px; box-shadow: 0 4px 16px rgba(110, 67, 23, 0.08); position: relative; }
.kb-newform__close { position: absolute; top: 10px; right: 10px;
  width: 22px; height: 22px; border-radius: 50%; background: var(--soil-tint); border: 0;
  color: var(--soil-deep); font-size: 13px; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center; }
.kb-newform__row { margin-bottom: 12px; }
.kb-newform__row:last-of-type { margin-bottom: 18px; }
.kb-newform__label { font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-mute); margin-bottom: 4px; }
.kb-newform__input { width: 100%; background: transparent; border: 0;
  border-bottom: 1px solid var(--soil); padding: 4px 0;
  font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--ink); outline: none;
  font-weight: 500; }
.kb-newform__textarea { width: 100%; background: transparent; border: 0;
  border-bottom: 1px solid var(--soil); padding: 4px 0;
  font-family: 'Cormorant Garamond', serif; font-size: 15px; font-style: italic; color: var(--ink-soft);
  outline: none; resize: none; min-height: 28px; }
.kb-newform__footer { display: flex; justify-content: flex-end; }
.kb-newform__save { background: var(--soil-deep); color: var(--soil-soft); border: 0;
  padding: 8px 18px; border-radius: 999px; font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 15px; }
.kb-newform__save:disabled { background: var(--rule); color: var(--ink-faint); cursor: not-allowed; }

@media (max-width: 1024px) {
  .kb-header { padding: 24px 24px 0; }
  .kb-title { font-size: 44px; }
  .kb-chips { padding: 20px 24px 0; }
  .kb-board { padding: 20px 24px 40px; grid-template-columns: repeat(4, minmax(220px, 1fr)); overflow-x: auto; }
}
@media (max-width: 720px) {
  .kb-board { grid-template-columns: 1fr; }
  .kb-board--ruled > .kb-col + .kb-col { border-left: 0; border-top: 1px solid var(--rule-soft); }
  .kb-title { font-size: 36px; }
}
`

function injectStyles() {
  const id = 'kb-revamp-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

/* ─── Helpers ──────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function stageVarsCSS(stage) {
  const s = STAGES.find(x => x.key === stage)
  if (!s) return {}
  return {
    '--stage':       s.color,
    '--stage-deep':  s.deep,
    '--stage-tint':  s.tint,
    '--stage-soft':  s.soft,
    '--stage-tint-2': s.tint2,
  }
}

function Glyph({ stage, size = 18 }) {
  const props = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (stage) {
    case 'soil':    return <svg {...props}><path d="M2 12 Q 9 7.5 16 12" /><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" /><path d="M9 10 V 13.5" /><path d="M5.5 13 H 12.5" opacity="0.5" strokeDasharray="1 2" /></svg>
    case 'plant':   return <svg {...props}><path d="M9 16 V 7" /><path d="M9 10.5 Q 4 10.5 3 7 Q 7 6 9 10.5 Z" fill="currentColor" fillOpacity="0.15" /><path d="M9 8.5 Q 14 8.5 15 5 Q 11 4 9 8.5 Z" fill="currentColor" fillOpacity="0.15" /></svg>
    case 'water':   return <svg {...props}><path d="M9 2.5 C 6 6, 4.5 9, 4.5 11.2 A 4.5 4.5 0 0 0 13.5 11.2 C 13.5 9, 12 6, 9 2.5 Z" fill="currentColor" fillOpacity="0.14" /><path d="M6.5 11 Q 8 12.5 9.5 11" opacity="0.7" /></svg>
    case 'harvest': return <svg {...props}><path d="M9 16 V 3" /><path d="M9 12 L 5.5 10 M 9 12 L 12.5 10" /><path d="M9 9 L 5.5 7 M 9 9 L 12.5 7" /><path d="M9 6 L 6.5 4 M 9 6 L 11.5 4" /></svg>
    default: return null
  }
}

function CalendarMini() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="1.5" y="3" width="11" height="9.5" rx="1.2" />
      <path d="M1.5 6 H 12.5" />
      <path d="M4.5 1.5 V 4 M 9.5 1.5 V 4" />
    </svg>
  )
}

/* Organic progress line (wavy SVG path with markers) */
function ProgressLine({ total, done, width = 240 }) {
  if (!total) return null
  const h = 22
  const padX = 8
  const spanX = width - padX * 2
  const ampl = 2.6
  const maxMarkers = 12
  const isDense = total > maxMarkers

  if (isDense) {
    const t = Math.max(0, Math.min(1, done / total))
    const ax = padX, bx = padX + spanX, midX = padX + spanX * t
    const ay = h / 2 - 1.5, by = h / 2 + 1.5
    const fullPath = `M ${ax} ${h/2} C ${ax + spanX*0.25} ${ay} ${ax + spanX*0.5} ${by} ${ax + spanX*0.5} ${h/2} C ${ax + spanX*0.75} ${ay} ${bx - spanX*0.05} ${by} ${bx} ${h/2}`
    return (
      <svg className="kb-progress__svg" viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none" style={{ color: 'var(--stage)' }}>
        <path d={fullPath} fill="none" stroke="var(--rule-strong)" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        <path d={fullPath} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray={spanX * t * 1.05} strokeDashoffset="0" />
        <circle cx={ax} cy={h/2} r="3.2" fill="currentColor" />
        <circle cx={bx} cy={h/2} r={done >= total ? 3.2 : 2.6} fill={done >= total ? 'currentColor' : 'var(--bg-paper)'} stroke="currentColor" strokeWidth="1.2" />
        {done > 0 && done < total && <circle cx={midX} cy={h/2} r="2.6" fill="var(--stage)" />}
      </svg>
    )
  }

  const nodes = Array.from({ length: total }, (_, i) => {
    const t = total === 1 ? 0.5 : i / (total - 1)
    const x = padX + t * spanX
    const y = h / 2 + Math.sin(t * Math.PI * 1.6 + 0.3) * ampl
    return { x, y, done: i < done }
  })

  const segs = []
  let prev = nodes[0]
  segs.push(`M ${prev.x.toFixed(2)} ${prev.y.toFixed(2)}`)
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i]
    const cx1 = (prev.x + n.x) / 2
    segs.push(`C ${cx1.toFixed(2)} ${prev.y.toFixed(2)} ${cx1.toFixed(2)} ${n.y.toFixed(2)} ${n.x.toFixed(2)} ${n.y.toFixed(2)}`)
    prev = n
  }
  const fullPath = segs.join(' ')

  const lastDoneIdx = done - 1
  let donePath = ''
  if (lastDoneIdx >= 0) {
    let p = nodes[0]
    const ds = [`M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`]
    const stopIdx = Math.min(lastDoneIdx + 1, nodes.length)
    for (let i = 1; i <= stopIdx; i++) {
      const n = nodes[i] || nodes[nodes.length - 1]
      const cx1 = (p.x + n.x) / 2
      if (i > lastDoneIdx + 1) break
      ds.push(`C ${cx1.toFixed(2)} ${p.y.toFixed(2)} ${cx1.toFixed(2)} ${n.y.toFixed(2)} ${n.x.toFixed(2)} ${n.y.toFixed(2)}`)
      p = n
    }
    donePath = ds.join(' ')
  }

  return (
    <svg className="kb-progress__svg" viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none" style={{ color: 'var(--stage)' }}>
      <path d={fullPath} fill="none" stroke="var(--rule-strong)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {donePath && <path d={donePath} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.done ? 3.2 : 2.6}
          fill={n.done ? 'currentColor' : 'var(--bg-paper)'}
          stroke="currentColor" strokeWidth={n.done ? 0 : 1.2} />
      ))}
    </svg>
  )
}

/* ─── New Project Form (inline in Soil column) ─────────────── */

export function NewProjectForm({ onSave, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', why: '', success: '' })
  const titleRef = useRef(null), whyRef = useRef(null), successRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function autoResize(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    if (!form.title.trim()) return
    onSave(form)
  }

  return (
    <div className="kb-newform">
      <button className="kb-newform__close" onClick={onCancel} aria-label={t('projects.form.cancel')}>×</button>
      <div className="kb-newform__row">
        <div className="kb-newform__label">{t('projects.form.name')}</div>
        <input ref={titleRef} className="kb-newform__input"
          value={form.title}
          onChange={e => upd('title', e.target.value)}
          placeholder="…"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); whyRef.current?.focus() } if (e.key === 'Escape') onCancel() }} />
      </div>
      <div className="kb-newform__row">
        <div className="kb-newform__label">{t('projects.soil.why')}</div>
        <textarea ref={whyRef} className="kb-newform__textarea"
          value={form.why} rows={1}
          onChange={e => { upd('why', e.target.value); autoResize(e.target) }}
          placeholder="…"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); successRef.current?.focus() } if (e.key === 'Escape') onCancel() }} />
      </div>
      <div className="kb-newform__row">
        <div className="kb-newform__label">{t('projects.soil.success')}</div>
        <textarea ref={successRef} className="kb-newform__textarea"
          value={form.success} rows={1}
          onChange={e => { upd('success', e.target.value); autoResize(e.target) }}
          placeholder="…"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } if (e.key === 'Escape') onCancel() }} />
      </div>
      <div className="kb-newform__footer">
        <button className="kb-newform__save" onClick={save} disabled={!form.title.trim()}>
          plant <span style={{ fontFamily: 'Courier Prime, monospace', fontStyle: 'normal' }}>→</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Card components ──────────────────────────────────────── */

function SoilCard({ project, t, onAdvance, onDelete, onClick }) {
  return (
    <article className="kbcardA" style={stageVarsCSS('soil')} onClick={onClick}>
      <h3 className="kbcardA__title">{project.title || t('projects.untitled')}</h3>
      {project.why && (
        <div className="kbcardA__field">
          <div className="kbcardA__field-label">{t('projects.soil.why')}</div>
          <div className="kbcardA__field-value">{project.why}</div>
        </div>
      )}
      {project.success && (
        <div className="kbcardA__field">
          <div className="kbcardA__field-label">{t('projects.soil.success')}</div>
          <div className="kbcardA__field-value">{project.success}</div>
        </div>
      )}
      {!project.why && !project.success && (
        <div className="kbcardA__field-value" style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
          {t('projects.soil.doubleClickHint')}
        </div>
      )}
      <div className="kbcardA__footer">
        <button className="kbcardA__delete"
          onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}>
          {t('projects.card.delete')}
        </button>
        <button className="kbcardA__advance" onClick={e => { e.stopPropagation(); onAdvance() }}>
          plant <span className="arrow">→</span>
        </button>
      </div>
    </article>
  )
}

function TasksCard({ project, pTasks, stage, t, onCheck, onAdvance, onDelete, onClick, canAdvance, nextStage, showPct, onTogglePct }) {
  const phTasks = pTasks.filter(x => x.phase === stage.key)
  const { done, total } = computeProgress(phTasks, project)
  const visible = phTasks.slice(0, 5)
  const hidden = phTasks.length - visible.length
  const dateRange = (project.start_date || project.end_date)
    ? `${fmtDate(project.start_date) || '?'} → ${fmtDate(project.end_date) || '?'}`
    : null

  return (
    <article className="kbcardA" style={stageVarsCSS(stage.key)} onClick={onClick}>
      <h3 className="kbcardA__title">{project.title || t('projects.untitled')}</h3>
      {dateRange && (
        <div className="kbcardA__dates">
          <CalendarMini /> {dateRange}
        </div>
      )}
      {phTasks.length > 0 && (
        <div className="kb-progress">
          <ProgressLine total={total} done={done} />
          <div className="kb-progress__meta">
            <span><strong>{done}</strong> de {total}</span>
            <span>{Math.round((done / Math.max(total, 1)) * 100)}%</span>
          </div>
        </div>
      )}
      <ul className="kb-list">
        {visible.map(task => {
          const recurring = hasRecurrence(task)
          const tTotal = recurring ? totalOccurrences(task, project) : null
          const tDone = task.completed_count || 0
          const tPct = tTotal ? Math.min(100, Math.round((tDone / tTotal) * 100)) : 0
          return (
            <li key={task.id} className={task.completed ? 'is-done' : ''}>
              <span className="mark" onClick={e => { e.stopPropagation(); onCheck(task) }} />
              <span className="txt">{task.title || '—'}</span>
              {recurring && tTotal != null ? (
                <span className="tprog" onClick={e => { e.stopPropagation(); onTogglePct() }} title="clique pra alternar barra ↔ %">
                  {showPct ? (
                    <span className="tprog__label">{tPct}%</span>
                  ) : (
                    <>
                      <span className="tprog__bar"><span className="tprog__fill" style={{ width: `${tPct}%` }} /></span>
                      <span className="tprog__label">{tDone}/{tTotal}</span>
                    </>
                  )}
                </span>
              ) : task.due_date ? (
                <span className="due">{fmtDate(task.due_date)}</span>
              ) : null}
            </li>
          )
        })}
      </ul>
      {hidden > 0 && <div className="kb-list"><div className="more">+ {hidden} {t('projects.tasks.more', { count: hidden }).replace(/^\+\s*\d+\s*/i, '').trim() || 'mais'}</div></div>}
      {phTasks.length === 0 && (
        <div className="kbcardA__field-value" style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
          {t('projects.tasks.addHint')}
        </div>
      )}
      <div className="kbcardA__footer">
        <button className="kbcardA__delete"
          onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}>
          {t('projects.card.delete')}
        </button>
        {nextStage && (
          <button
            className="kbcardA__advance"
            disabled={!canAdvance}
            onClick={e => { e.stopPropagation(); if (canAdvance) onAdvance() }}
            title={!canAdvance ? t('projects.card.blockedHint') : t('projects.card.advanceTo', { stage: t(`projects.stages.${nextStage.key}`) })}
          >
            {t(`projects.stages.${nextStage.key}`)} <span className="arrow">→</span>
          </button>
        )}
      </div>
    </article>
  )
}

function HarvestCard({ project, t, onDelete, onClick }) {
  const dateRange = (project.start_date || project.end_date)
    ? `${fmtDate(project.start_date) || '?'} → ${fmtDate(project.end_date) || '?'}`
    : null

  return (
    <article className="kbcardA" style={stageVarsCSS('harvest')} onClick={onClick}>
      <h3 className="kbcardA__title">{project.title || t('projects.untitled')}</h3>
      {dateRange && (
        <div className="kbcardA__dates">
          <CalendarMini /> {dateRange}
        </div>
      )}
      {project.harvest_notes && (
        <div className="kbcardA__field">
          <div className="kbcardA__field-label">{t('projects.harvest.notes') || 'notas de colheita'}</div>
          <div className="kbcardA__field-value">{project.harvest_notes}</div>
        </div>
      )}
      <div className="kbcardA__footer">
        <button className="kbcardA__delete"
          onClick={e => { e.stopPropagation(); if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}>
          {t('projects.card.delete')}
        </button>
        <span className="kbcardA__advance kbcardA__advance--done">✦ {t('projects.card.harvested')}</span>
      </div>
    </article>
  )
}

/* ─── Main board ───────────────────────────────────────────── */

export default function KanbanBoard({ projects, tasks, addProject, updateProject, deleteProject, updateTask, onOpenModal, triggerCreate }) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)
  const [showPct, setShowPct]   = useState(false)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { if (triggerCreate) setCreating(true) }, [triggerCreate])

  async function handleCreate(form) {
    const created = await addProject({ ...form, stage: 'soil' })
    setCreating(false)
    if (created) onOpenModal(created.id, 'soil')
  }

  function canAdvance(project) {
    const idx = KEYS.indexOf(project.stage)
    if (idx >= KEYS.length - 1) return false
    if (project.stage === 'plant') {
      const ts = tasks.filter(x => x.project_id === project.id && x.phase === 'plant')
      return ts.length > 0 && ts.every(x => x.completed)
    }
    if (project.stage === 'water') {
      const ts = tasks.filter(x => x.project_id === project.id && x.phase === 'water')
      return ts.length > 0 && ts.every(x => x.completed)
    }
    return true
  }

  async function handleAdvance(project) {
    const idx = KEYS.indexOf(project.stage)
    const next = STAGES[idx + 1]
    if (!next) return
    playProgress()
    await updateProject(project.id, { stage: next.key })
  }

  function renderCard(project) {
    const stage = STAGES.find(s => s.key === project.stage)
    const nextStage = STAGES[KEYS.indexOf(project.stage) + 1]
    const pTasks = tasks.filter(t => t.project_id === project.id)
    const handlers = {
      onClick: () => onOpenModal(project.id),
      onDelete: () => deleteProject(project.id),
      onAdvance: () => handleAdvance(project),
    }
    if (project.stage === 'soil')    return <SoilCard key={project.id} project={project} t={t} {...handlers} />
    if (project.stage === 'harvest') return <HarvestCard key={project.id} project={project} t={t} {...handlers} />
    return (
      <TasksCard
        key={project.id}
        project={project} pTasks={pTasks} stage={stage} t={t}
        canAdvance={canAdvance(project)} nextStage={nextStage}
        showPct={showPct}
        onTogglePct={() => setShowPct(v => !v)}
        onCheck={task => {
          const [changes] = computeCheckUpdate(task, project)
          updateTask(task.id, changes)
        }}
        {...handlers}
      />
    )
  }

  return (
    <div className="kb-root">
      <div className="kb-board kb-board--ruled">
        {STAGES.map(stage => {
          const col = projects.filter(p => p.stage === stage.key)
          return (
            <div key={stage.key} className="kb-col" style={stageVarsCSS(stage.key)}>
              <div className="kb-colhead">
                <span className="kb-colhead__glyph"><Glyph stage={stage.key} /></span>
                <span className="kb-colhead__label">{t(`projects.stages.${stage.key}`)}</span>
                <span className="kb-colhead__count">{String(col.length).padStart(2, '0')}</span>
              </div>
              {col.map(renderCard)}
              {stage.key === 'soil' && (
                creating
                  ? <NewProjectForm onSave={handleCreate} onCancel={() => setCreating(false)} />
                  : <button className="kb-addcard" onClick={() => setCreating(true)}>{t('projects.kanban.newSeed')}</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
