import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGES } from './KanbanBoard'
import { playProgress } from '../../lib/sounds'
import { hasRecurrence, totalOccurrences, computeCheckUpdate } from '../../lib/recurring'

/* ─── Tokens & SMART meta ──────────────────────────────────── */

const DAYS = [
  { key: 'sun', label: 'D' }, { key: 'mon', label: 'S' }, { key: 'tue', label: 'T' },
  { key: 'wed', label: 'Q' }, { key: 'thu', label: 'Q' }, { key: 'fri', label: 'S' }, { key: 'sat', label: 'S' },
]

const NEXT_TAB = { soil: 'plant', plant: 'water', water: 'harvest' }

const TABS_KEYS = [
  { id: 'soil',    stageKey: 'soil' },
  { id: 'plant',   stageKey: 'plant' },
  { id: 'water',   stageKey: 'water' },
  { id: 'harvest', stageKey: 'harvest' },
]
// Label resolved at render via t('projects.modal.tabs.*')

export function isSmartComplete(p) {
  return !!(p.title && p.why && p.success && p.start_date && p.end_date)
}

function stageVarsCSS(stage) {
  const s = STAGES.find(x => x.key === stage)
  if (!s) return {}
  return { '--stage': s.color, '--stage-deep': s.deep, '--stage-tint': s.tint, '--stage-soft': s.soft, '--stage-tint-2': s.tint2 }
}

function Glyph({ stage, size = 13 }) {
  const props = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (stage) {
    case 'soil':    return <svg {...props}><path d="M2 12 Q 9 7.5 16 12" /><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" /><path d="M9 10 V 13.5" /></svg>
    case 'plant':   return <svg {...props}><path d="M9 16 V 7" /><path d="M9 10.5 Q 4 10.5 3 7 Q 7 6 9 10.5 Z" fill="currentColor" fillOpacity="0.15" /><path d="M9 8.5 Q 14 8.5 15 5 Q 11 4 9 8.5 Z" fill="currentColor" fillOpacity="0.15" /></svg>
    case 'water':   return <svg {...props}><path d="M9 2.5 C 6 6, 4.5 9, 4.5 11.2 A 4.5 4.5 0 0 0 13.5 11.2 C 13.5 9, 12 6, 9 2.5 Z" fill="currentColor" fillOpacity="0.14" /></svg>
    case 'harvest': return <svg {...props}><path d="M9 16 V 3" /><path d="M9 12 L 5.5 10 M 9 12 L 12.5 10" /><path d="M9 9 L 5.5 7 M 9 9 L 12.5 7" /></svg>
    default: return null
  }
}

/* ─── CSS ──────────────────────────────────────────────────── */

const CSS = `
.pm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(27, 24, 20, 0.42);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 4vh 16px 16px;
  overflow-y: auto;
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: var(--ink, #2A2520);
  animation: pm-fade .2s ease;
}
.pm-overlay * { box-sizing: border-box; }
.pm-overlay button { font-family: inherit; cursor: pointer; }
@keyframes pm-fade { from { opacity: 0; } to { opacity: 1; } }

.pm-dialog {
  --bg-sand: #F5F0E8; --bg-paper: #FBF7EF; --bg-paper-soft: #F1EAD9;
  --ink: #2A2520; --ink-soft: #4A4138; --ink-mute: #8B7E6F; --ink-faint: #B6AC9D;
  --rule: #D9CFC0; --rule-soft: #E5DCCB; --rule-strong: #C7BBA6;
  --soil: #B5732A; --soil-deep: #6E4317; --soil-tint: #EAD9BE; --soil-soft: #F8EFDC;
  --plant: #527B40; --plant-deep: #2D5016; --plant-tint: #D6E1C5; --plant-soft: #ECF2DF;
  --water: #2A5A85; --water-deep: #1B3A5C; --water-tint: #CDDAE6; --water-soft: #E8EEF4;
  --harvest: #B6800E; --harvest-deep: #7E5808; --harvest-tint: #ECD8A0; --harvest-soft: #F8EDCC;
  width: 100%; max-width: 720px;
  background: var(--bg-paper);
  border-radius: 14px;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(46, 37, 32, 0.22), 0 0 0 1px var(--rule);
  animation: pm-slide .25s cubic-bezier(.22,1,.36,1);
  /* No max-height/overflow here — let pm-overlay scroll instead */
  margin-bottom: 32px;
}
@keyframes pm-slide { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.pm-mono {
  font-family: 'Courier Prime', 'Courier New', monospace;
  letter-spacing: 0.08em; text-transform: uppercase;
}

/* Header */
.pm-header {
  padding: 24px 28px 14px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  border-bottom: 1px solid var(--rule-soft);
}
.pm-eyebrow { font-size: 10px; color: var(--ink-mute); margin-bottom: 8px; }
.pm-title-input {
  width: 100%; background: transparent; border: 0; outline: none;
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 500; color: var(--ink);
  letter-spacing: -0.01em; line-height: 1.1;
  padding: 0;
}
.pm-title-input::placeholder { color: var(--ink-faint); font-style: italic; font-weight: 400; }
.pm-close {
  width: 32px; height: 32px; border-radius: 50%;
  background: transparent; border: 1px solid var(--rule);
  color: var(--ink-mute); font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: color .15s, border-color .15s, background .15s;
}
.pm-close:hover { color: var(--ink); border-color: var(--ink); background: var(--bg-paper-soft); }

/* Tabs */
.pm-tabs {
  display: flex; align-items: center; gap: 4px;
  padding: 16px 28px 14px;
  border-bottom: 1px solid var(--rule-soft);
  overflow-x: auto; scrollbar-width: none;
}
.pm-tabs::-webkit-scrollbar { display: none; }
.pm-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 13px;
  border-radius: 999px; border: 1px solid var(--rule);
  background: transparent; color: var(--ink-mute);
  font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em;
  white-space: nowrap; transition: all .15s; flex-shrink: 0;
}
.pm-tab__glyph { color: var(--stage, var(--ink-mute)); display: inline-flex; }
.pm-tab.is-active {
  background: var(--stage, var(--ink));
  color: var(--stage-soft, var(--bg-sand));
  border-color: var(--stage, var(--ink));
}
.pm-tab.is-active .pm-tab__glyph { color: var(--stage-soft, var(--bg-sand)); }
.pm-tab.is-done { color: var(--stage-deep); border-color: var(--stage-tint); }
.pm-tab__check { color: var(--stage-deep); }
.pm-tabs__connector {
  width: 14px; height: 1px; background: var(--rule); flex-shrink: 0;
}
.pm-sub {
  padding: 8px 28px 14px;
  font-size: 13px; font-style: italic; color: var(--ink-mute); line-height: 1.4;
  border-bottom: 1px solid var(--rule-soft);
}

/* Body */
.pm-body {
  flex: 1;
  padding: 22px 28px;
  background: var(--bg-paper);
  /* overflow-y removed: outer .pm-overlay handles all scrolling */
}

/* SMART soil tab */
.pm-period {
  display: flex; align-items: flex-end; gap: 14px;
  padding: 14px 16px 14px 56px;
  background: var(--soil-soft); border: 1px solid var(--soil-tint);
  border-radius: 8px; margin-bottom: 26px; position: relative;
  flex-wrap: wrap;
}
.pm-period__marginalia {
  position: absolute; left: 16px; top: 14px;
  display: flex; flex-direction: column; align-items: center; gap: 2px; width: 28px;
}
.pm-period__date { display: flex; flex-direction: column; gap: 4px; min-width: 130px; flex: 1; }
.pm-period__label { font-size: 9.5px; font-family: 'Courier Prime', monospace; text-transform: uppercase; letter-spacing: 0.12em; color: var(--soil-deep); }
.pm-period__input {
  background: transparent; border: 0; border-bottom: 1px solid var(--soil);
  font-family: 'Courier Prime', monospace; font-size: 13px;
  color: var(--ink); padding: 4px 0; outline: none; width: 100%;
}
.pm-period__readout {
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px;
  color: var(--soil-deep); white-space: nowrap;
}

.pm-fieldgroup { display: flex; flex-direction: column; gap: 22px; }
.pm-field {
  display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: start;
}
.pm-field__marginalia {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding-top: 4px;
}
.pm-field__letter {
  font-family: 'Cormorant Garamond', serif; font-size: 26px; font-style: italic;
  color: var(--stage, var(--soil-deep)); line-height: 1; font-weight: 400;
}
.pm-field__word {
  font-family: 'Cormorant Garamond', serif; font-size: 10px; font-style: italic;
  color: var(--ink-mute); text-align: center; line-height: 1;
}
.pm-field__opt {
  font-family: 'Courier Prime', monospace; font-size: 8.5px;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-top: 2px;
}
.pm-field__main { min-width: 0; }
.pm-field__labelrow { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.pm-field__label {
  font-family: 'Courier Prime', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-mute);
}
.pm-field__hint { font-style: italic; font-size: 12px; color: var(--ink-faint); }
.pm-input {
  width: 100%; background: transparent; border: 0;
  border-bottom: 1px solid var(--rule-strong);
  padding: 6px 0; outline: none;
  font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--ink);
  font-weight: 500; letter-spacing: -0.005em;
  transition: border-color .15s;
}
.pm-input:focus { border-bottom-color: var(--stage, var(--soil)); }
.pm-input::placeholder { color: var(--ink-faint); font-style: italic; font-weight: 400; }
textarea.pm-input { resize: none; min-height: 50px; line-height: 1.4; font-style: italic; font-size: 16px; }
.pm-input--big { font-size: 22px; font-weight: 500; font-style: normal; }

/* Tasks */
.pm-tasks-section { margin-top: 6px; }
.pm-tasksHead {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 10px; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-mute);
  padding-bottom: 12px; border-bottom: 1px solid var(--rule-soft); margin-bottom: 8px;
}
.pm-tasksHead__count { color: var(--stage-deep); }
.pm-task {
  position: relative;
  padding: 12px 0; border-bottom: 1px solid var(--rule-soft);
  transition: background .25s;
}
.pm-task.is-flash { background: color-mix(in oklab, var(--stage) 10%, transparent); }
.pm-task__top {
  display: flex; align-items: center; gap: 10px;
}
.pm-check {
  width: 18px; height: 18px; border-radius: 50%;
  border: 1.5px solid var(--stage, var(--ink-faint));
  background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; cursor: pointer; transition: all .15s;
}
.pm-check.is-checked { background: var(--stage, var(--ink)); color: var(--bg-paper); }
.pm-task__name {
  flex: 1; background: transparent; border: 0; outline: none;
  font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--ink);
  min-width: 0; padding: 0;
}
.pm-task__name.is-done { color: var(--ink-mute); text-decoration: line-through; text-decoration-color: var(--ink-faint); }
.pm-task__name::placeholder { color: var(--ink-faint); font-style: italic; }
.pm-task__count {
  font-size: 10px; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.08em;
  background: var(--stage-soft); color: var(--stage-deep);
  padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0;
}
.pm-task__count strong { font-weight: 700; }
.pm-task__due {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10px; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--stage-deep);
  background: var(--stage-soft); padding: 3px 9px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0;
}
.pm-iconbtn {
  width: 28px; height: 28px; border-radius: 50%;
  background: transparent; border: 1px solid var(--rule);
  color: var(--ink-faint);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: color .15s, border-color .15s, background .15s;
}
.pm-iconbtn:hover { color: var(--ink); border-color: var(--ink); }
.pm-iconbtn.is-danger:hover { color: #b14a4a; border-color: #b14a4a; background: #fbeae8; }

.pm-task__bottom {
  display: flex; align-items: center; gap: 14px;
  margin-top: 10px; padding-left: 28px; flex-wrap: wrap;
}
.pm-task__recur {
  font-size: 9.5px; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-mute);
}
.pm-days { display: flex; gap: 4px; flex-wrap: wrap; }
.pm-day {
  width: 28px; height: 28px; border-radius: 50%;
  background: transparent; border: 1px solid var(--rule);
  color: var(--ink-mute);
  font-family: 'Courier Prime', monospace; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.pm-day.is-on { background: var(--stage); border-color: var(--stage); color: var(--bg-paper); }

.pm-task__datepicker {
  display: flex; align-items: center; gap: 12px;
  margin-top: 10px; padding-left: 28px; flex-wrap: wrap;
}
.pm-datefield {
  display: inline-flex; align-items: center; gap: 8px;
}
.pm-datefield__label {
  font-size: 10px; font-family: 'Courier Prime', monospace;
  text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-mute);
  white-space: nowrap;
}
.pm-datefield__input {
  background: var(--bg-paper-soft);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: 'Courier Prime', monospace; font-size: 12px;
  color: var(--ink); outline: none;
  cursor: pointer;
  min-width: 130px;
  transition: border-color .15s, background .15s;
}
.pm-datefield__input:hover { border-color: var(--stage); }
.pm-datefield__input:focus { border-color: var(--stage); background: white; }
.pm-datefield__hint {
  font-size: 10.5px; font-style: italic; color: var(--ink-faint);
  font-family: 'Cormorant Garamond', serif;
}

.pm-addtask {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 0; background: transparent; border: 0;
  color: var(--stage-deep);
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px;
}
.pm-addtask__plus {
  width: 22px; height: 22px; border-radius: 50%;
  border: 1px dashed var(--stage);
  display: inline-flex; align-items: center; justify-content: center;
  font-style: normal; font-family: 'Courier Prime', monospace; font-size: 13px;
  color: var(--stage);
}

.pm-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: var(--harvest-soft);
  border: 1px solid var(--harvest-tint); border-radius: 8px;
  margin-bottom: 16px; font-size: 13px; color: var(--harvest-deep);
}
.pm-banner__glyph {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--harvest); color: var(--harvest-soft);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: 'Courier Prime', monospace; font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.pm-banner__txt { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; flex: 1; }
.pm-banner__txt strong { font-style: normal; font-weight: 600; }

.pm-harvest-notes {
  width: 100%; min-height: 140px; resize: vertical;
  background: var(--harvest-soft); border: 1px solid var(--harvest-tint);
  border-radius: 8px; padding: 14px 16px;
  font-family: 'Cormorant Garamond', serif; font-size: 16px;
  font-style: italic; color: var(--ink); line-height: 1.5; outline: none;
}
.pm-harvest-notes::placeholder { color: var(--harvest); }

/* Footer */
.pm-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 28px; border-top: 1px solid var(--rule-soft);
  background: var(--bg-paper-soft); border-radius: 0 0 14px 14px; flex-shrink: 0;
}
.pm-delete {
  background: transparent; border: 1px solid var(--rule);
  color: var(--ink-faint);
  font-family: 'Courier Prime', monospace; font-size: 10px;
  padding: 6px 12px; border-radius: 999px;
  text-transform: lowercase; letter-spacing: 0.1em;
  transition: color .15s, border-color .15s, background .15s;
}
.pm-delete:hover { color: #b14a4a; border-color: #b14a4a; background: #fbeae8; }
.pm-footer__right { display: flex; align-items: center; gap: 12px; }
.pm-save-draft {
  background: transparent; border: 0;
  font-family: 'Cormorant Garamond', serif; font-size: 13px;
  font-style: italic; color: var(--ink-mute);
}
.pm-save-draft:hover { color: var(--ink); }
.pm-advance {
  background: var(--stage, var(--soil));
  color: var(--stage-soft, var(--bg-sand));
  border: 0; padding: 10px 18px 11px; border-radius: 999px;
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15px;
  display: inline-flex; align-items: center; gap: 8px;
  transition: opacity .15s, transform .15s;
}
.pm-advance:hover { opacity: 0.9; transform: translateY(-1px); }
.pm-advance__arrow { font-family: 'Courier Prime', monospace; font-style: normal; font-size: 13px; }
.pm-advance--save { background: var(--ink); color: var(--bg-sand); }
.pm-advance.is-saved { background: #4A8A3F; }

@media (max-width: 640px) {
  .pm-overlay { padding: 0; align-items: stretch; }
  .pm-dialog { max-height: 100vh; border-radius: 14px 14px 0 0; margin-top: 5vh; }
  .pm-header { padding: 18px 18px 12px; }
  .pm-tabs { padding: 12px 18px; }
  .pm-sub { padding: 8px 18px 12px; }
  .pm-body { padding: 18px; }
  .pm-footer { padding: 12px 18px; }
  .pm-title-input { font-size: 26px; }
  .pm-field { grid-template-columns: 32px 1fr; gap: 10px; }
  .pm-field__letter { font-size: 22px; }
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

/* ─── Soil tab (SMART merged) ──────────────────────────────── */

function SoilTab({ form, onUpdate, t }) {
  const days = (() => {
    if (!form.start_date || !form.end_date) return null
    const s = new Date(form.start_date), e = new Date(form.end_date)
    const d = Math.round((e - s) / 86400000) + 1
    return d > 0 ? d : null
  })()

  return (
    <div style={stageVarsCSS('soil')}>
      <div className="pm-fieldgroup">
        <SmartField letter="S" word={t('projects.modal.smart.specificWord')} label={t('projects.modal.smart.specificLabel')} hint={t('projects.modal.smart.specificHint')}>
          <input className="pm-input pm-input--big"
            value={form.title || ''} onChange={e => onUpdate('title', e.target.value)}
            placeholder={t('projects.modal.smart.specificPh')} />
        </SmartField>

        <SmartField letter="R" word={t('projects.modal.smart.relevantWord')} label={t('projects.modal.smart.relevantLabel')} hint={t('projects.modal.smart.relevantHint')}>
          <textarea className="pm-input" rows={2}
            value={form.why || ''} onChange={e => onUpdate('why', e.target.value)}
            placeholder={t('projects.modal.smart.relevantPh')} />
        </SmartField>

        <SmartField letter="M" word={t('projects.modal.smart.measurableWord')} label={t('projects.modal.smart.measurableLabel')} hint={t('projects.modal.smart.measurableHint')}>
          <textarea className="pm-input" rows={2}
            value={form.success || ''} onChange={e => onUpdate('success', e.target.value)}
            placeholder={t('projects.modal.smart.measurablePh')} />
        </SmartField>

        <SmartField letter="A" word={t('projects.modal.smart.achievableWord')} label={t('projects.modal.smart.achievableLabel')} hint={t('projects.modal.smart.achievableHint')} optional>
          <textarea className="pm-input" rows={2}
            value={form.how || ''} onChange={e => onUpdate('how', e.target.value)}
            placeholder={t('projects.modal.smart.achievablePh')} />
        </SmartField>
      </div>

      <div className="pm-period" style={{ marginTop: 26, marginBottom: 0 }}>
        <div className="pm-period__marginalia">
          <span className="pm-field__letter" style={{ color: 'var(--soil-deep)' }}>T</span>
          <span className="pm-field__word">{t('projects.modal.smart.timeWord')}</span>
        </div>
        <div className="pm-period__date">
          <span className="pm-period__label">{t('projects.modal.smart.startsAt')}</span>
          <input type="date" className="pm-period__input"
            value={form.start_date || ''} onChange={e => onUpdate('start_date', e.target.value || null)} />
        </div>
        <div className="pm-period__date">
          <span className="pm-period__label">{t('projects.modal.smart.endsAt')}</span>
          <input type="date" className="pm-period__input"
            value={form.end_date || ''} onChange={e => onUpdate('end_date', e.target.value || null)} />
        </div>
        {days != null && (
          <div className="pm-period__readout">
            {days} dia{days > 1 ? 's' : ''}{days >= 7 ? ` · ≈${Math.round(days / 7)} sem` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function SmartField({ letter, word, label, hint, optional, children }) {
  return (
    <div className="pm-field">
      <div className="pm-field__marginalia">
        <span className="pm-field__letter">{letter}</span>
        <span className="pm-field__word">{word}</span>
        {optional && <span className="pm-field__opt">{t('projects.modal.smart.optional')}</span>}
      </div>
      <div className="pm-field__main">
        <div className="pm-field__labelrow">
          <span className="pm-field__label">{label}</span>
          {hint && <span className="pm-field__hint">{hint}</span>}
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Task row (plant/water/harvest) ───────────────────────── */

function TaskRow({ task, project, stage, onUpdate, onDelete, onEnter, inputRef, isWaterPhase, t }) {
  const [title, setTitle] = useState(task.title || '')
  const [showDate, setShowDate] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const dirty = useRef(false)
  const prevCount = useRef(task.completed_count || 0)

  useEffect(() => { setTitle(task.title || '') }, [task.id])
  useEffect(() => {
    const c = task.completed_count || 0
    if (c > prevCount.current) {
      setFlashing(true)
      const tm = setTimeout(() => setFlashing(false), 650)
      prevCount.current = c
      return () => clearTimeout(tm)
    }
    prevCount.current = c
  }, [task.completed_count])

  const hasDays = hasRecurrence(task)
  const total = hasDays ? totalOccurrences(task, project) : null
  const count = task.completed_count || 0

  function handleCheck() {
    const [changes] = computeCheckUpdate(task, project)
    onUpdate(task.id, changes)
  }

  function flush() { if (dirty.current) { onUpdate(task.id, { title: title.trim() }); dirty.current = false } }
  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); flush(); onEnter() }
    if (e.key === 'Backspace' && !title) onDelete(task.id)
  }
  function toggleDay(day) {
    const days = task.repeat_days || []
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    onUpdate(task.id, { repeat_days: next, recurring: next.length > 0 })
  }

  function fmt(d) {
    if (!d) return ''
    const [, m, day] = d.split('-')
    return `${day}/${m}`
  }

  return (
    <div className={'pm-task' + (flashing ? ' is-flash' : '')} style={stageVarsCSS(stage)}>
      <div className="pm-task__top">
        <span className={'pm-check' + (task.completed ? ' is-checked' : '')} onClick={handleCheck}>
          {task.completed && (
            <svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5L6 11L11.5 3.5" />
            </svg>
          )}
        </span>
        <input ref={inputRef} value={title} onChange={e => { setTitle(e.target.value); dirty.current = true }}
          onBlur={flush} onKeyDown={handleKeyDown}
          placeholder={t('projects.tasks.placeholder')}
          className={'pm-task__name' + (task.completed ? ' is-done' : '')} />
        {hasDays ? (
          <span className="pm-task__count"><strong>{count}</strong>/{total === null ? '?' : total}</span>
        ) : task.due_date && (
          <span className="pm-task__due">{fmt(task.due_date)}</span>
        )}
        <button className="pm-iconbtn" onClick={() => setShowDate(s => !s)} title={t('projects.tasks.deadline')}>
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <rect x="1.5" y="3" width="11" height="9.5" rx="1.2" />
            <path d="M1.5 6 H 12.5" />
            <path d="M4.5 1.5 V 4 M 9.5 1.5 V 4" />
          </svg>
        </button>
        <button className="pm-iconbtn is-danger" onClick={() => onDelete(task.id)} title={t('projects.card.delete')}>
          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 3l8 8M11 3L3 11" /></svg>
        </button>
      </div>
      {!isWaterPhase && showDate && (
        <div className="pm-task__datepicker">
          <div className="pm-datefield">
            <span className="pm-datefield__label">{t('projects.tasks.start')}</span>
            <input type="date" className="pm-datefield__input"
              value={task.start_date || ''}
              onChange={e => onUpdate(task.id, { start_date: e.target.value || null })} />
          </div>
          <div className="pm-datefield">
            <span className="pm-datefield__label">{t('projects.tasks.deadline')}</span>
            <input type="date" className="pm-datefield__input"
              value={task.due_date || ''}
              onChange={e => onUpdate(task.id, { due_date: e.target.value || null })} />
          </div>
        </div>
      )}
      {isWaterPhase && (
        <>
          <div className="pm-task__datepicker">
            <div className="pm-datefield">
              <span className="pm-datefield__label">{t('projects.tasks.start')}</span>
              <input type="date" className="pm-datefield__input"
                value={task.start_date || ''}
                onChange={e => onUpdate(task.id, { start_date: e.target.value || null })} />
            </div>
            <div className="pm-datefield">
              <span className="pm-datefield__label">{t('projects.tasks.end')}</span>
              <input type="date" className="pm-datefield__input"
                value={task.due_date || ''}
                onChange={e => onUpdate(task.id, { due_date: e.target.value || null })} />
            </div>
            <span className="pm-datefield__hint">
              {(task.start_date || task.due_date) ? t('projects.modal.water.usingTaskDates') : t('projects.modal.water.usingProjectDates')}
            </span>
          </div>
          <div className="pm-task__bottom">
            <span className="pm-task__recur">{t('projects.modal.water.repeat')}</span>
            <div className="pm-days">
              {DAYS.map(d => (
                <button key={d.key} className={'pm-day' + ((task.repeat_days || []).includes(d.key) ? ' is-on' : '')}
                  onClick={() => toggleDay(d.key)}>{d.label}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TaskList({ tasks, project, stage, onAdd, onUpdate, onDelete, isWaterPhase, addLabel, t, banner }) {
  const inputRefs = useRef({})
  async function addNew() {
    const x = await onAdd({})
    if (x) setTimeout(() => inputRefs.current[x.id]?.focus(), 80)
  }
  const total = tasks.length
  const done = tasks.filter(x => x.completed).length

  return (
    <div style={stageVarsCSS(stage)}>
      {banner}
      <div className="pm-tasks-section">
        <div className="pm-tasksHead">
          <span>{isWaterPhase ? t('projects.modal.water.routinesAndActivities') : t('projects.modal.plant.tasks')}</span>
          {total > 0 && <span className="pm-tasksHead__count">{done}/{total} {t('projects.modal.done')}</span>}
        </div>
        {tasks.map(x => (
          <TaskRow key={x.id} task={x} project={project} stage={stage} t={t}
            onUpdate={onUpdate} onDelete={onDelete} onEnter={addNew}
            inputRef={el => { inputRefs.current[x.id] = el }}
            isWaterPhase={isWaterPhase} />
        ))}
        <button className="pm-addtask" onClick={addNew}>
          <span className="pm-addtask__plus">+</span> {addLabel}
        </button>
      </div>
    </div>
  )
}

/* ─── Main modal ───────────────────────────────────────────── */

export default function ProjectModal({ project, tasks, initialTab, onClose, onUpdate, onDelete, onAddTask, onUpdateTask, onDeleteTask }) {
  const { t } = useTranslation()
  const TABS = TABS_KEYS.map(tk => ({ ...tk, label: t(`projects.modal.tabs.${tk.id}`), stage: tk.stageKey }))
  const [tab, setTab] = useState(() => {
    // Map old 'smart' tab to 'soil' (merged)
    const t = initialTab || project.stage || 'soil'
    return t === 'smart' ? 'soil' : t
  })
  const [form, setForm] = useState({
    title: project.title || '',
    why: project.why || '',
    success: project.success || '',
    how: project.how || '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    harvest_notes: project.harvest_notes || '',
  })
  const [savedFlash, setSavedFlash] = useState(false)
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])
  useEffect(() => { injectStyles() }, [])

  const activeTab = TABS.find(x => x.id === tab) || TABS[0]
  const stage = activeTab.stage
  const completedTabs = []
  if (isSmartComplete(form)) completedTabs.push('soil')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function upd(field, val) { setForm(f => ({ ...f, [field]: val })) }
  async function persist() { await onUpdate(formRef.current) }

  async function handleClose() { await persist(); onClose() }
  async function handleAdvance() {
    await persist()
    const next = NEXT_TAB[tab]
    if (next) { playProgress(); setTab(next); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200) }
  }
  async function handleSave() {
    await persist()
    setSavedFlash(true)
    setTimeout(() => onClose(), 600)
  }

  const plantTasks = tasks.filter(x => x.phase === 'plant')
  const waterTasks = tasks.filter(x => x.phase === 'water')
  const harvestTasks = tasks.filter(x => x.phase === 'harvest')

  const missingPeriod = !form.start_date || !form.end_date

  return (
    <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="pm-dialog">
        {/* Header */}
        <div className="pm-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pm-eyebrow pm-mono">{project.id ? t('projects.modal.editProject') : t('projects.modal.newProject')}</div>
            <input className="pm-title-input"
              value={form.title} onChange={e => upd('title', e.target.value)}
              placeholder={t('projects.modal.titlePlaceholder')} />
          </div>
          <button className="pm-close" onClick={handleClose} aria-label={t('projects.modal.close')}>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <nav className="pm-tabs">
          {TABS.map((tabDef, i) => {
            const isActive = tabDef.id === tab
            const isDone = completedTabs.includes(tabDef.id)
            return (
              <div key={tabDef.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {i > 0 && <span className="pm-tabs__connector" />}
                <button
                  className={'pm-tab' + (isActive ? ' is-active' : '') + (isDone ? ' is-done' : '')}
                  style={stageVarsCSS(tabDef.stage)}
                  onClick={async () => { await persist(); setTab(tabDef.id) }}
                >
                  <span className="pm-tab__glyph"><Glyph stage={tabDef.stage} /></span>
                  <span>{tabDef.label}</span>
                  {isDone && (
                    <svg className="pm-tab__check" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6.5 L 5 9 L 10 3" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Body */}
        <div className="pm-body">
          {tab === 'soil' && <SoilTab form={form} onUpdate={upd} t={t} />}
          {tab === 'plant' && (
            <TaskList tasks={plantTasks} project={project} stage="plant" t={t}
              onAdd={d => onAddTask('plant', d)} onUpdate={onUpdateTask} onDelete={onDeleteTask}
              isWaterPhase={false} addLabel={t('projects.modal.addTask')} />
          )}
          {tab === 'water' && (
            <TaskList tasks={waterTasks} project={project} stage="water" t={t}
              onAdd={d => onAddTask('water', d)} onUpdate={onUpdateTask} onDelete={onDeleteTask}
              isWaterPhase={true} addLabel={t('projects.modal.addRoutine')}
              banner={missingPeriod && (
                <div className="pm-banner">
                  <span className="pm-banner__glyph">!</span>
                  <span className="pm-banner__txt">
                    <strong>{t('projects.modal.banner.title')}</strong>{' '}
                    <em>{t('projects.modal.tabs.soil')}</em>{' '}
                    {t('projects.modal.banner.text')}
                  </span>
                  <button className="pm-banner__link pm-mono" onClick={async () => { await persist(); setTab('soil') }}
                    style={{ background: 'transparent', border: 0, color: 'var(--harvest-deep)', fontFamily: 'Courier Prime, monospace', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t('projects.modal.banner.goTo')}
                  </button>
                </div>
              )} />
          )}
          {tab === 'harvest' && (
            <div style={stageVarsCSS('harvest')}>
              <TaskList tasks={harvestTasks} project={project} stage="harvest" t={t}
                onAdd={d => onAddTask('harvest', d)} onUpdate={onUpdateTask} onDelete={onDeleteTask}
                isWaterPhase={false} addLabel={t('projects.modal.addFinalActivity')} />
              <div style={{ marginTop: 22 }}>
                <div className="pm-field__labelrow" style={{ marginBottom: 8 }}>
                  <span className="pm-field__label">{t('projects.modal.harvest.reflection')}</span>
                </div>
                <textarea className="pm-harvest-notes"
                  value={form.harvest_notes} onChange={e => upd('harvest_notes', e.target.value)}
                  placeholder={t('projects.modal.harvest.placeholder')} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pm-footer" style={stageVarsCSS(stage)}>
          <button className="pm-delete" onClick={() => { if (window.confirm(t('projects.modal.deleteConfirm'))) onDelete() }}>
            {t('projects.modal.delete')}
          </button>
          <div className="pm-footer__right">
            <button className="pm-save-draft" onClick={persist}>{t('projects.modal.saveDraft')}</button>
            {tab !== 'harvest' ? (
              <button className={'pm-advance' + (savedFlash ? ' is-saved' : '')} onClick={handleAdvance}>
                {savedFlash ? t('projects.modal.savedFlash') : (
                  <>
                    {t(`projects.modal.tabs.${NEXT_TAB[tab]}`)}
                    <span className="pm-advance__arrow">→</span>
                  </>
                )}
              </button>
            ) : (
              <button className={'pm-advance pm-advance--save' + (savedFlash ? ' is-saved' : '')} onClick={handleSave}>
                {savedFlash ? t('projects.modal.savedFlash') : t('projects.modal.saveProject')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
