import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CollapsibleSection from '../components/ui/CollapsibleSection'

/* ─── DB ⇄ UI mapping ───────────────────────── */

function rowToBelief(p) {
  return {
    id: p.id,
    createdAt: new Date(p.created_at || Date.now()).getTime(),
    neg: { belief: p.neg_belief || '', action: p.neg_causes || '',  feeling: p.neg_feeling || '', result: p.neg_result || '' },
    pos: { action: p.pos_action || '', feeling: p.pos_feeling || '', impact: p.pos_impact || '', belief: p.pos_belief || '' },
  }
}
function beliefToRow(b) {
  return {
    neg_belief:  b.neg.belief, neg_causes:  b.neg.action,
    neg_feeling: b.neg.feeling, neg_result: b.neg.result,
    pos_action:  b.pos.action, pos_feeling: b.pos.feeling,
    pos_impact:  b.pos.impact, pos_belief:  b.pos.belief,
  }
}

const EMPTY_DRAFT = {
  neg: { belief: '', action: '', feeling: '', result: '' },
  pos: { action: '', feeling: '', impact: '', belief: '' },
}

const NEG_META = [
  { key: 'belief',  step: 'I',   multiline: false },
  { key: 'action',  step: 'II',  multiline: false },
  { key: 'feeling', step: 'III', multiline: false },
  { key: 'result',  step: 'IV',  multiline: true  },
]
const POS_META = [
  { key: 'action',  step: 'I',   multiline: false },
  { key: 'feeling', step: 'II',  multiline: false },
  { key: 'impact',  step: 'III', multiline: false },
  { key: 'belief',  step: 'IV',  multiline: true  },
]
function negFieldsT(t) {
  return NEG_META.map(m => ({
    ...m,
    label:  t(`mentalPattern.negFields.${m.key}.label`),
    prompt: t(`mentalPattern.negFields.${m.key}.prompt`),
  }))
}
function posFieldsT(t) {
  return POS_META.map(m => ({
    ...m,
    label:  t(`mentalPattern.posFields.${m.key}.label`),
    prompt: t(`mentalPattern.posFields.${m.key}.prompt`),
  }))
}

/* ─── CSS ───────────────────────────────────── */

const CSS = `
.pm-root {
  --cream: #F5F0E8; --cream-deep: #EDE5D6; --cream-haze: #F9F5EE; --paper: #FBF8F1;
  --ink: #1B1814; --ink-soft: #2A2620; --ink-mute: #6B6258; --ink-faint: #9A9085; --ink-ghost: #C7BEB1;
  --hair: rgba(27, 24, 20, 0.10); --hair-strong: rgba(27, 24, 20, 0.18); --hair-soft: rgba(27, 24, 20, 0.05);
  --shadow-deep: #1F3110; --shadow: #2D5016; --shadow-mid: #4A6038; --shadow-soft: #748062; --shadow-tint: #E6E8DA;
  --light-deep: #6B3B07; --light: #D4890A; --light-mid: #B97A26; --light-soft: #C4A882; --light-tint: #F4E8D2;
  --pm-serif: "Cormorant Garamond", "EB Garamond", Garamond, serif;
  --pm-sans:  "Nunito Sans", "Inter", system-ui, sans-serif;
  background: var(--cream); color: var(--ink);
  font-family: var(--pm-sans); font-size: 15px; line-height: 1.5;
  min-height: 100vh; letter-spacing: 0.005em;
  -webkit-font-smoothing: antialiased;
}
.pm-root * { box-sizing: border-box; }
.pm-root button { font-family: inherit; cursor: pointer; }
.pm-root input, .pm-root textarea { font-family: inherit; color: inherit; }
.pm-root textarea { resize: none; }

/* Top bar */
.pm-bar { display:flex; align-items:center; justify-content:space-between; padding:18px 40px;
  border-bottom:0.5px solid var(--hair); background: var(--cream); position:sticky; top:0; z-index:30;
  backdrop-filter: blur(8px); }
.pm-back { background:none; border:0; color:var(--ink-mute); font-size:11px; letter-spacing:0.18em;
  text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; padding:0; }
.pm-back:hover { color: var(--ink); }
.pm-brand { display:flex; align-items:center; gap:14px; font-family:var(--pm-serif); font-size:18px; font-weight:500; letter-spacing:0.02em; }
.pm-brand .dot { width:7px; height:7px; border-radius:50%; background:var(--shadow); }
.pm-brand .crumb { font-family:var(--pm-sans); font-size:11px; letter-spacing:0.16em; text-transform:uppercase;
  color:var(--ink-faint); padding-left:14px; border-left:0.5px solid var(--hair); margin-left:4px; }

/* Page header — compact */
.pm-head { padding: 24px 40px 16px; display:flex; align-items:flex-end; justify-content:space-between; gap:40px; }
.pm-head-l { max-width: 720px; }
.pm-chapter-label { font-family:var(--pm-sans); font-size:11px; letter-spacing:0.22em; text-transform:uppercase;
  color:var(--ink-mute); display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.pm-chapter-label .rule { flex:0 0 36px; height:0.5px; background:var(--ink-faint); }
.pm-page-title { font-family:var(--pm-serif); font-size:clamp(32px, 4vw, 48px); font-weight:400; line-height:1;
  letter-spacing:-0.015em; margin:0 0 6px; color:var(--ink); }
.pm-page-title em { font-style:italic; color:var(--ink-soft); }
.pm-page-sub { font-family:var(--pm-serif); font-style:italic; font-size:15px; color:var(--ink-mute); margin:0;
  line-height:1.4; max-width:540px; font-weight:400; }
.pm-page-sub .quote-source { font-style:normal; font-size:11px; letter-spacing:0.14em; text-transform:uppercase;
  color:var(--ink-faint); display:inline-block; margin-left:8px; }
.pm-head-r { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; padding-bottom:4px; }
.pm-progress-line { display:flex; align-items:center; gap:10px; font-family:var(--pm-sans); font-size:11px;
  letter-spacing:0.18em; text-transform:uppercase; color:var(--ink-mute); }
.pm-progress-line b { font-family:var(--pm-serif); font-size:20px; font-weight:400; letter-spacing:0; color:var(--ink); }
.pm-progress-line .slash { color:var(--ink-faint); }

/* Poles — compact */
.pm-poles { padding:8px 40px 24px; }
.pm-poles-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border-top:0.5px solid var(--hair); }
.pm-poles-grid > .pm-pole-col + .pm-pole-col { border-left:0.5px solid var(--hair); }
.pm-pole-col { padding:20px 28px 24px; position:relative; min-height:0; }
.pm-pole-col.shadow-side { background: linear-gradient(180deg, transparent, rgba(45, 80, 22, 0.025)); }
.pm-pole-col.light-side  { background: linear-gradient(180deg, transparent, rgba(212, 137, 10, 0.03)); }

.pm-pole-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:18px; }
.pm-pole-head-text { display:flex; flex-direction:column; }
.pm-pole-chapter { font-family:var(--pm-sans); font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
  color:var(--ink-mute); margin-bottom:6px; display:flex; align-items:center; gap:8px; }
.pm-pole-chapter .num { font-family:var(--pm-serif); font-size:17px; font-weight:400; letter-spacing:0; color:var(--ink); text-transform:none; }
.pm-pole-title { font-family:var(--pm-serif); font-size:32px; font-weight:400; line-height:0.95;
  letter-spacing:-0.012em; margin:0 0 4px; color:var(--ink); }
.shadow-side .pm-pole-title { color: var(--shadow-deep); }
.light-side  .pm-pole-title { color: var(--light-deep); }
.pm-pole-caption { font-family:var(--pm-serif); font-style:italic; font-size:13px; color:var(--ink-mute);
  max-width:280px; line-height:1.4; }
.pm-pole-glyph { width:42px; height:42px; flex-shrink:0; position:relative; }
.pm-pole-glyph svg { width: 42px !important; height: 42px !important; }

/* Fields — compact */
.pm-fields { display:flex; flex-direction:column; gap:14px; }
.pm-field { display:flex; flex-direction:column; gap:4px; transition: opacity 0.4s; }
.pm-field[data-locked="1"] { opacity:0.32; pointer-events:none; }
.pm-field-label { display:flex; align-items:baseline; gap:10px; font-family:var(--pm-sans); font-size:10px;
  letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-mute); }
.pm-field-label .step { font-family:var(--pm-serif); font-size:15px; font-weight:400; letter-spacing:0;
  color:var(--ink); text-transform:none; min-width:18px; }
.pm-field-label .step-dot { width:5px; height:5px; border-radius:50%; background:var(--shadow-mid); display:inline-block; margin:0 1px; }
.light-side .pm-field-label .step-dot { background: var(--light-mid); }
.pm-field-prompt { font-family:var(--pm-serif); font-style:italic; font-size:12px; color:var(--ink-faint); margin:0; }
.pm-field-input { width:100%; background:transparent; border:0; border-bottom:0.5px solid var(--hair-strong);
  padding:4px 0 6px; font-family:var(--pm-serif); font-size:17px; line-height:1.3; letter-spacing:-0.005em;
  color:var(--ink); outline:none; transition:border-color .25s; min-height:30px; font-weight:400; }
.pm-field-input::placeholder { color:var(--ink-ghost); font-style:italic; }
.pm-field-input:focus { border-bottom-color: var(--shadow); }
.light-side .pm-field-input:focus { border-bottom-color: var(--light); }
textarea.pm-field-input { line-height:1.35; font-size:16px; min-height:44px; }

/* Eclipse overlay — compact */
.pm-eclipse-cover { position:absolute; inset:0; pointer-events:auto; display:flex; align-items:center;
  justify-content:center; flex-direction:column; gap:14px; z-index:2; transition: opacity 0.6s ease;
  background: linear-gradient(180deg, rgba(245,240,232,0.92), rgba(245,240,232,0.95)); }
.pm-eclipse-cover[data-revealed="1"] { opacity:0; pointer-events:none; }
.pm-eclipse-stage { position:relative; width:160px; height:160px; display:flex; align-items:center; justify-content:center; }
.pm-eclipse-sun { position:absolute; inset:0; border-radius:50%;
  background: radial-gradient(circle at 35% 35%, #F4D790, #D4890A 60%, #8B5A2B);
  box-shadow: 0 0 40px rgba(212, 137, 10, 0.18); }
.pm-eclipse-disc { position:absolute; width:100%; height:100%; border-radius:50%;
  background: radial-gradient(circle at 40% 40%, #2D3A1C, #131A0A 70%);
  box-shadow: 0 0 0 1px var(--shadow-deep);
  transition: transform 1s cubic-bezier(.4, 0, .2, 1); }
.pm-eclipse-corona { position:absolute; inset:-14px; border-radius:50%; border:0.5px solid var(--light-soft); opacity:0.5; }
.pm-eclipse-corona.outer { inset:-28px; opacity:0.25; }
.pm-eclipse-caption { text-align:center; max-width:300px; display:flex; flex-direction:column; gap:6px; font-family:var(--pm-serif); }
.pm-eclipse-caption .micro { font-family:var(--pm-sans); font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
  color:var(--ink-mute); display:flex; align-items:center; justify-content:center; gap:8px; }
.pm-eclipse-caption .micro .rule { width:18px; height:0.5px; background:var(--ink-faint); }
.pm-eclipse-caption .line { font-style:italic; font-size:16px; color:var(--ink-soft); line-height:1.3; font-weight:400; }
.pm-eclipse-caption .progress { margin-top:4px; display:flex; align-items:center; justify-content:center; gap:6px; }
.pm-eclipse-caption .pip { width:8px; height:8px; border-radius:50%; border:0.5px solid var(--shadow-mid); background:transparent; transition: background .4s; }
.pm-eclipse-caption .pip[data-filled="1"] { background: var(--shadow); border-color: var(--shadow); }

/* Save bar — compact */
.pm-save-bar { display:flex; align-items:center; justify-content:space-between; margin-top:18px;
  padding:14px 40px 0; border-top:0.5px solid var(--hair); }
.pm-save-bar .meta { font-family:var(--pm-serif); font-style:italic; color:var(--ink-mute); font-size:14px; }
.pm-save-bar .marker { display:inline-flex; align-items:center; gap:8px; margin-right:14px; }
.pm-save-bar .marker i { width:8px; height:8px; border-radius:50%; background:var(--shadow); display:inline-block; }

.pm-btn { appearance:none; border:0; font-family:var(--pm-sans); font-size:11px; letter-spacing:0.16em;
  text-transform:uppercase; padding:10px 22px; border-radius:999px; background:var(--ink); color:var(--cream);
  display:inline-flex; align-items:center; gap:8px; transition: transform .15s, background .2s, opacity .2s; }
.pm-btn:hover { background: var(--ink-soft); transform: translateY(-1px); }
.pm-btn[disabled] { opacity:0.32; pointer-events:none; }
.pm-btn.ghost { background:transparent; color:var(--ink-mute); border:0.5px solid var(--hair-strong); padding:9px 18px; }
.pm-btn.ghost:hover { color: var(--ink); background: var(--cream-haze); }
.pm-btn .arrow { font-size:13px; line-height:1; opacity:0.8; }

/* Detail header */
.pm-detail-head { padding:32px 40px 24px; display:flex; align-items:flex-start; justify-content:space-between; gap:40px; }
.pm-detail-meta { font-family:var(--pm-serif); font-style:italic; font-size:15px; color:var(--ink-mute);
  text-align:right; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:4px;
  white-space:nowrap; }
.pm-detail-actions { display:flex; gap:12px; margin-top:16px; justify-content:flex-end; }
.pm-icon-btn { appearance:none; border:0.5px solid var(--hair-strong); background:transparent; width:38px; height:38px;
  border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--ink-mute);
  transition: color .2s, background .2s, border-color .2s; }
.pm-icon-btn:hover { color: var(--ink); background: var(--cream-haze); border-color: var(--ink); }
.pm-icon-btn svg { width:14px; height:14px; }

/* Read-only field display */
.pm-field-value { font-family:var(--pm-serif); font-size:22px; line-height:1.4; letter-spacing:-0.005em;
  color:var(--ink); padding:8px 0 10px; border-bottom:0.5px solid var(--hair); }
.light-side .pm-field-value { font-style:italic; color: var(--light-deep); }

/* Saved list (garden) */
.pm-saved-page { padding: 0 40px 100px; }
.pm-saved-head { padding:56px 0 36px; display:flex; align-items:flex-end; justify-content:space-between; gap:40px; flex-wrap:wrap; }
.pm-saved-head h1 { font-family:var(--pm-serif); font-size:clamp(40px, 5vw, 68px); font-weight:400; line-height:0.98;
  letter-spacing:-0.012em; margin:0; color:var(--ink); max-width:720px; }
.pm-saved-head h1 em { font-style:italic; color: var(--ink-soft); }
.pm-saved-meta { font-family:var(--pm-serif); font-style:italic; color:var(--ink-mute); font-size:17px;
  text-align:right; display:flex; flex-direction:column; gap:4px; }
.pm-saved-meta b { font-family:var(--pm-serif); font-style:normal; font-size:32px; font-weight:400; color:var(--ink); }
.pm-saved-actions { display:flex; align-items:center; gap:14px; margin-top:8px; }

.pm-garden { display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:28px; margin-top:16px; }
.pm-card { position:relative; background:var(--paper); border:0.5px solid var(--hair); border-radius:22px;
  padding:28px 28px 24px; display:flex; flex-direction:column; gap:18px;
  transition: transform .2s, box-shadow .2s; cursor:pointer; overflow:hidden; }
.pm-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(27, 24, 20, 0.06); }
.pm-card .head { display:flex; justify-content:space-between; align-items:center;
  font-family:var(--pm-sans); font-size:10.5px; letter-spacing:0.18em; text-transform:uppercase; color:var(--ink-faint); }
.pm-card .head .when { font-family:var(--pm-serif); font-style:italic; text-transform:none; letter-spacing:0; font-size:13px; }
.pm-card .pair { display:grid; grid-template-columns: 1fr 14px 1fr; align-items:stretch; gap:0; }
.pm-card .half { display:flex; flex-direction:column; gap:10px; }
.pm-card .half .tag { font-family:var(--pm-sans); font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
  display:flex; align-items:center; gap:8px; }
.pm-card .half .tag i { width:5px; height:5px; border-radius:50%; display:inline-block; }
.pm-card .half.shadow .tag { color: var(--shadow); }
.pm-card .half.shadow .tag i { background: var(--shadow); }
.pm-card .half.light  .tag { color: var(--light-deep); }
.pm-card .half.light  .tag i { background: var(--light); }
.pm-card .half .text { font-family:var(--pm-serif); font-size:22px; line-height:1.2; font-weight:400; color:var(--ink); letter-spacing:-0.005em; }
.pm-card .half.shadow .text { color: var(--shadow-deep); }
.pm-card .half.light  .text { color: var(--light-deep); font-style:italic; }
.pm-card .pair .divider { width:0.5px; background: var(--hair-strong); margin:4px 6px; }
.pm-card .foot { display:flex; align-items:center; justify-content:space-between; border-top:0.5px solid var(--hair);
  padding-top:14px; font-family:var(--pm-sans); font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); }
.pm-card .foot .open { display:inline-flex; gap:8px; align-items:center; color: var(--ink); }
.pm-card .foot .open .arrow { font-size:13px; }
.pm-card .del-btn { position:absolute; top:14px; right:14px; opacity:0; transition: opacity .15s;
  background:transparent; border:0.5px solid var(--hair); color:var(--ink-faint); width:28px; height:28px;
  border-radius:50%; display:inline-flex; align-items:center; justify-content:center; }
.pm-card:hover .del-btn { opacity:1; }
.pm-card .del-btn:hover { color:#b14a4a; border-color:#b14a4a; }

/* Empty state */
.pm-empty { margin:80px auto; max-width:460px; text-align:center; display:flex; flex-direction:column;
  align-items:center; gap:22px; }
.pm-empty .glyph { width:64px; height:64px; border-radius:50%; border:0.5px solid var(--hair-strong);
  display:flex; align-items:center; justify-content:center; }
.pm-empty .line { font-family:var(--pm-serif); font-style:italic; font-size:22px; color:var(--ink-mute); line-height:1.4; }

@media (max-width: 860px) {
  .pm-saved-page { padding-left:22px; padding-right:22px; }
  .pm-saved-head { flex-direction:column; align-items:flex-start; gap:18px; padding-top:32px; }
  .pm-saved-meta { text-align:left; }
  .pm-garden { grid-template-columns: 1fr; gap:18px; }
  .pm-card { padding:22px; }
  .pm-card .pair { grid-template-columns: 1fr; }
  .pm-card .pair .divider { width:100%; height:0.5px; margin:6px 0; }
}

@media (max-width: 860px) {
  .pm-bar { padding: 14px 18px; }
  .pm-brand .crumb { display:none; }
  .pm-head, .pm-poles, .pm-save-bar, .pm-detail-head { padding-left:22px; padding-right:22px; }
  .pm-head { flex-direction:column; align-items:flex-start; gap:22px; padding-top:32px; padding-bottom:22px; }
  .pm-head-r { align-items:flex-start; }
  .pm-poles-grid { grid-template-columns: 1fr; }
  .pm-poles-grid > .pm-pole-col + .pm-pole-col { border-left:0; border-top:0.5px solid var(--hair); }
  .pm-pole-col { padding:32px 22px 40px; min-height:480px; }
  .pm-pole-title { font-size:44px; }
  .pm-field-input { font-size:19px; }
  textarea.pm-field-input { font-size:17px; }
  .pm-save-bar { flex-direction:column; align-items:flex-start; gap:18px; }
  .pm-detail-head { flex-direction:column; gap:20px; padding-top:24px; }
  .pm-eclipse-stage { width:200px; height:200px; }
}
`

function injectStyles() {
  const id = 'pm-revamp-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

/* ─── Glyphs ────────────────────────────────── */

function GlyphShadow({ size = 64, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="30.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <circle cx="32" cy="32" r="15" fill={color} />
    </svg>
  )
}
function GlyphLight({ size = 64, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="30.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <circle cx="32" cy="32" r="15" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="32" cy="32" r="2" fill={color} />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9.5h5L11 4M7 6.5v5M9 6.5v5" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 13.5h11M3 11l7-7 2 2-7 7H3v-2z" />
    </svg>
  )
}
function IconArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4 5.5 8l4 4M5.5 8h7" />
    </svg>
  )
}

/* ─── Editor pieces ─────────────────────────── */

function Field({ field, value, locked, onChange }) {
  const inputRef = useRef(null)

  function handleKey(e) {
    if (!field.multiline && e.key === 'Enter') {
      e.preventDefault()
      const col = e.target.closest('.pm-pole-col')
      if (!col) return
      const all = [...col.querySelectorAll('input.pm-field-input, textarea.pm-field-input')]
      const idx = all.indexOf(e.target)
      const next = all[idx + 1]
      if (next && !next.disabled) next.focus()
    }
  }

  return (
    <div className="pm-field" data-locked={locked ? '1' : '0'}>
      <div className="pm-field-label">
        <span className="step">{field.step}</span>
        <span className="step-dot" />
        <span>{field.label}</span>
      </div>
      <p className="pm-field-prompt">{field.prompt}</p>
      {field.multiline ? (
        <textarea
          ref={inputRef}
          className="pm-field-input"
          rows={2}
          value={value}
          disabled={locked}
          placeholder="…"
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          ref={inputRef}
          className="pm-field-input"
          type="text"
          value={value}
          disabled={locked}
          placeholder="…"
          onKeyDown={handleKey}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function PoleHead({ side, t }) {
  const isShadow = side === 'shadow'
  const accent = isShadow ? 'var(--shadow)' : 'var(--light-deep)'
  return (
    <div className="pm-pole-head">
      <div className="pm-pole-head-text">
        <div className="pm-pole-chapter">
          <span className="num">{isShadow ? 'I.' : 'II.'}</span>
          <span>{isShadow ? t('mentalPattern.shadow') : t('mentalPattern.light')}</span>
        </div>
        <h2 className="pm-pole-title">{isShadow ? t('mentalPattern.shadow') : t('mentalPattern.light')}</h2>
        <p className="pm-pole-caption">
          {isShadow ? t('mentalPattern.shadowCaption') : t('mentalPattern.lightCaption')}
        </p>
      </div>
      <div className="pm-pole-glyph">
        {isShadow ? <GlyphShadow color={accent} /> : <GlyphLight color={accent} />}
      </div>
    </div>
  )
}

function EclipseCover({ progress, t }) {
  const offset = progress * 110
  const revealed = progress >= 1
  const captionLine =
    progress === 0  ? t('mentalPattern.eclipseEmpty') :
    progress < 0.5  ? t('mentalPattern.eclipseSlow') :
    progress < 1    ? t('mentalPattern.eclipseAlmost') :
                      t('mentalPattern.eclipseDone')

  return (
    <div className="pm-eclipse-cover" data-revealed={revealed ? '1' : '0'}>
      <div className="pm-eclipse-stage" aria-hidden="true">
        <div className="pm-eclipse-corona outer" />
        <div className="pm-eclipse-corona" />
        <div className="pm-eclipse-sun" />
        <div className="pm-eclipse-disc" style={{ transform: `translateX(${offset}%)` }} />
      </div>
      <div className="pm-eclipse-caption">
        <div className="micro">
          <span className="rule" />
          <span>{t('mentalPattern.eclipseLabel')}</span>
          <span className="rule" />
        </div>
        <div className="line">{captionLine}</div>
        <div className="progress" aria-label={`${Math.round(progress * 4)} / 4`}>
          {[0,1,2,3].map(i => (
            <span key={i} className="pip" data-filled={i < progress * 4 ? '1' : '0'} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ──────────────────────────────────── */

export default function PadraoMental({ table = 'mental_patterns', onBack, initEditId, embedded = false, startSaved = false }) {
  const [params] = useSearchParams()
  const editId = initEditId !== undefined ? initEditId : params.get('id')
  const goBack = () => (onBack ? onBack() : (window.location.href = '/mind'))
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const NEG_FIELDS = useMemo(() => negFieldsT(t), [i18n.language])
  const POS_FIELDS = useMemo(() => posFieldsT(t), [i18n.language])

  // Default view: list when standalone & no editId, editor otherwise
  const defaultView = startSaved ? 'detail' : (editId || embedded ? 'editor' : 'list')
  const [view,      setView]      = useState(defaultView)
  const [draft,     setDraft]     = useState(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState(editId || null)
  const [saved,     setSaved]     = useState(null)
  const [allBeliefs, setAllBeliefs] = useState([])

  useEffect(() => { injectStyles() }, [])

  // Load all patterns (for list view)
  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAllBeliefs(data.map(rowToBelief)) })
  }, [user?.id, table, view])

  // Load pattern if editing or viewing
  useEffect(() => {
    if (!user || !editId) return
    supabase.from(table).select('*').eq('id', editId).eq('user_id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        const b = rowToBelief(data)
        setEditingId(b.id)
        setSaved(b)
        if (startSaved) setView('detail')
        else { setDraft({ neg: b.neg, pos: b.pos }); setView('editor') }
      })
  }, [user?.id, editId, startSaved, table])

  function openCard(b) {
    setSaved(b); setEditingId(b.id); setView('detail')
  }
  function newPattern() {
    setSaved(null); setEditingId(null); setDraft(EMPTY_DRAFT); setView('editor')
  }
  async function deleteFromList(e, id) {
    e.stopPropagation()
    if (!window.confirm(t('mentalPattern.deleteBelief'))) return
    setAllBeliefs(prev => prev.filter(b => b.id !== id))
    await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
  }

  const negFilled = NEG_FIELDS.filter(f => (draft.neg[f.key] || '').trim()).length
  const posFilled = POS_FIELDS.filter(f => (draft.pos[f.key] || '').trim()).length
  const negComplete = negFilled === NEG_FIELDS.length
  const negProgress = negFilled / NEG_FIELDS.length
  const allComplete = negComplete && posFilled === POS_FIELDS.length

  function updateField(side, key, val) {
    setDraft(d => ({ ...d, [side]: { ...d[side], [key]: val } }))
  }

  function isNegLocked(idx) {
    if (idx === 0) return false
    const prev = NEG_FIELDS[idx - 1]
    return !(draft.neg[prev.key] || '').trim()
  }
  function isPosLocked(idx) {
    if (!negComplete) return true
    if (idx === 0) return false
    const prev = POS_FIELDS[idx - 1]
    return !(draft.pos[prev.key] || '').trim()
  }

  async function save() {
    if (!allComplete) return
    const row = beliefToRow(draft)
    let b
    if (editingId) {
      const { data } = await supabase.from(table)
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', editingId).eq('user_id', user.id)
        .select().single()
      b = rowToBelief(data || { id: editingId, ...row, created_at: saved?.createdAt })
    } else {
      const { data } = await supabase.from(table)
        .insert({ user_id: user.id, ...row })
        .select().single()
      if (data) b = rowToBelief(data)
    }
    if (b) {
      setSaved(b); setEditingId(b.id); setView('detail')
    }
  }

  async function remove() {
    if (!editingId) return
    if (!window.confirm(t('mentalPattern.deleteBelief'))) return
    await supabase.from(table).delete().eq('id', editingId).eq('user_id', user.id)
    if (embedded) goBack()
    else { setView('list'); setSaved(null); setEditingId(null) }
  }

  function detailBack() {
    if (embedded) goBack()
    else setView('list')
  }
  function editorBack() {
    if (embedded) goBack()
    else if (saved) setView('detail')
    else setView('list')
  }

  function startEdit() {
    if (!saved) return
    setDraft({ neg: saved.neg, pos: saved.pos })
    setView('editor')
  }

  /* ─── Render ─────────────────────────────── */

  const isEditing = !!editingId

  const editorView = (
    <>
      <div className="pm-head">
        <div className="pm-head-l">
          <h1 className="pm-page-title">
            {isEditing
              ? <>{t('mentalPattern.editingBelief')} <em>{t('mentalPattern.beliefEm')}</em></>
              : <>{t('mentalPattern.newBelief')} <em>{t('mentalPattern.beliefEm')}</em></>}
          </h1>
          <p className="pm-page-sub">
            {t('mentalPattern.caibalionQuote')}
            <span className="quote-source">{t('mentalPattern.caibalionSource')}</span>
          </p>
        </div>
        <div className="pm-head-r">
          <div className="pm-progress-line">
            <span>{t('mentalPattern.filled')}</span>
            <b>{negFilled + posFilled}</b>
            <span className="slash">/</span>
            <b>{NEG_FIELDS.length + POS_FIELDS.length}</b>
          </div>
        </div>
      </div>

      <div className="pm-poles">
        <div className="pm-poles-grid">
          <div className="pm-pole-col shadow-side">
            <PoleHead side="shadow" t={t} />
            <div className="pm-fields">
              {NEG_FIELDS.map((f, i) => (
                <Field
                  key={f.key}
                  field={f}
                  value={draft.neg[f.key] || ''}
                  locked={isNegLocked(i)}
                  onChange={v => updateField('neg', f.key, v)}
                />
              ))}
            </div>
          </div>

          <div className="pm-pole-col light-side">
            <PoleHead side="light" t={t} />
            <div className="pm-fields" style={{ position: 'relative' }}>
              {POS_FIELDS.map((f, i) => (
                <Field
                  key={f.key}
                  field={f}
                  value={draft.pos[f.key] || ''}
                  locked={isPosLocked(i)}
                  onChange={v => updateField('pos', f.key, v)}
                />
              ))}
            </div>
            <EclipseCover progress={negProgress} t={t} />
          </div>
        </div>

        <div className="pm-save-bar">
          <div className="meta">
            <span className="marker"><i /> {t('mentalPattern.shadow')}</span>
            <span style={{ color: 'var(--ink-faint)' }}>↔</span>
            <span className="marker" style={{ marginLeft: 14 }}>
              <i style={{ background: 'var(--light)' }} /> {t('mentalPattern.light')}
            </span>
            &nbsp;&nbsp;&nbsp;
            {allComplete
              ? t('mentalPattern.footerComplete')
              : negComplete
              ? t('mentalPattern.footerRewrite')
              : t('mentalPattern.footerStart')}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="pm-btn ghost" onClick={editorBack}>{t('mentalPattern.cancel')}</button>
            <button className="pm-btn" disabled={!allComplete} onClick={save}>
              {isEditing ? t('mentalPattern.updateBelief') : t('mentalPattern.saveBelief')}
              <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )

  const detailView = saved ? (
    <>
      <div className="pm-detail-head">
        <div>
          <button className="pm-back" onClick={detailBack}><IconArrowLeft /> {embedded ? t('mentalPattern.back') : t('mentalPattern.backToPatterns')}</button>
          <div className="pm-chapter-label" style={{ marginTop: 24 }}>
            <span className="rule" />
            <span>{t('mentalPattern.savedBelief')}</span>
            <span>·</span>
            <span>{new Date(saved.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</span>
          </div>
          <h1 className="pm-page-title" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}>
            "{saved.neg.belief}"
            <br />
            <em style={{ color: 'var(--light-deep)' }}>"{saved.pos.belief}"</em>
          </h1>
        </div>
        <div className="pm-detail-meta">
          <div>{t('mentalPattern.investigationComplete')}</div>
          <div>{t('mentalPattern.desdobramentos8')}</div>
          <div className="pm-detail-actions">
            <button className="pm-icon-btn" onClick={startEdit} aria-label={t('mentalPattern.edit')}><IconEdit /></button>
            <button className="pm-icon-btn" onClick={remove} aria-label={t('mentalPattern.delete')}><IconTrash /></button>
          </div>
        </div>
      </div>

      <div className="pm-poles">
        <div className="pm-poles-grid">
          <div className="pm-pole-col shadow-side">
            <PoleHead side="shadow" t={t} />
            <div className="pm-fields">
              {NEG_FIELDS.map(f => (
                <div key={f.key} className="pm-field">
                  <div className="pm-field-label">
                    <span className="step">{f.step}</span>
                    <span className="step-dot" />
                    <span>{f.label}</span>
                  </div>
                  <div className="pm-field-value">{saved.neg[f.key]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pm-pole-col light-side">
            <PoleHead side="light" t={t} />
            <div className="pm-fields">
              {POS_FIELDS.map(f => (
                <div key={f.key} className="pm-field">
                  <div className="pm-field-label">
                    <span className="step">{f.step}</span>
                    <span className="step-dot" />
                    <span>{f.label}</span>
                  </div>
                  <div className="pm-field-value">{saved.pos[f.key]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null

  const months = t('mentalPattern.months', { returnObjects: true })
  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getDate()} ${months[d.getMonth()]}`
  }
  function timeAgo(ts) {
    const diff = Date.now() - ts
    const day = 24 * 60 * 60 * 1000
    if (diff < day)   return t('mentalPattern.today')
    if (diff < 2*day) return t('mentalPattern.yesterday')
    if (diff < 7*day) return t('mentalPattern.daysAgo', { n: Math.floor(diff/day) })
    return formatDate(ts)
  }

  const listView = (
    <div className="pm-saved-page">
      <div className="pm-saved-head">
        <h1>{t('mentalPattern.savedPatterns')} <em>{t('mentalPattern.savedPatternsEm')}</em></h1>
        {allBeliefs.length > 0 ? (
          <div className="pm-saved-meta">
            <b>{allBeliefs.length}</b>
            <span>{t('mentalPattern.investigation', { count: allBeliefs.length })}</span>
            <div className="pm-saved-actions">
              <button className="pm-btn" onClick={newPattern}>{t('mentalPattern.newPattern')} <span className="arrow">+</span></button>
            </div>
          </div>
        ) : null}
      </div>

      {allBeliefs.length === 0 ? (
        <div className="pm-empty">
          <div className="glyph"><GlyphShadow size={32} color="var(--ink-mute)" /></div>
          <p className="line">
            {t('mentalPattern.emptyTitle')}<br/>
            {t('mentalPattern.emptyDesc')}
          </p>
          <button className="pm-btn" onClick={newPattern}>{t('mentalPattern.startFirstPattern')} <span className="arrow">→</span></button>
        </div>
      ) : (
        <CollapsibleSection collapsedHeight={400}>
          <div className="pm-garden">
            {allBeliefs.map((b, i) => (
              <article key={b.id} className="pm-card" onClick={() => openCard(b)}>
                <button className="del-btn" onClick={e => deleteFromList(e, b.id)} aria-label={t('mentalPattern.delete')}>
                  <IconTrash />
                </button>
                <div className="head">
                  <span>nº {String(i + 1).padStart(2, '0')}</span>
                  <span className="when">{timeAgo(b.createdAt)}</span>
                </div>
                <div className="pair">
                  <div className="half shadow">
                    <div className="tag"><i /> {t('mentalPattern.shadow')}</div>
                    <div className="text">{b.neg.belief || '—'}</div>
                  </div>
                  <div className="divider" />
                  <div className="half light">
                    <div className="tag"><i /> {t('mentalPattern.light')}</div>
                    <div className="text">{b.pos.belief || '—'}</div>
                  </div>
                </div>
                <div className="foot">
                  <span>{t('mentalPattern.desdobramentos44')}</span>
                  <span className="open">{t('mentalPattern.open')} <span className="arrow">→</span></span>
                </div>
              </article>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )

  const content =
    view === 'list'   ? listView :
    view === 'detail' && saved ? detailView :
    editorView

  const wrapped = (
    <div className="pm-root">
      {!embedded && (
        <div className="pm-bar">
          <div className="pm-brand">
            <span className="dot" />
            Tupi
            <span className="crumb">{t('mentalPattern.title')}</span>
          </div>
          <button className="pm-back" onClick={goBack}><IconArrowLeft /> {t('mentalPattern.back')}</button>
        </div>
      )}
      {content}
    </div>
  )

  return wrapped
}
