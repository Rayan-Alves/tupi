import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { useSkills } from '../../hooks/useSkills'

/* ── Responsive CSS ─────────────────────────────────────────────────────── */
const JOURNEY_CSS = `
.lj-detail-grid {
  display: grid;
  grid-template-columns: 1fr 276px;
  gap: 20px;
  align-items: start;
}
.lj-filter-row {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .lj-detail-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .lj-filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .lj-filter-row button { flex-shrink: 0; }
  .lj-card-name { font-size: 14px !important; }
  .lj-page-title { font-size: 22px !important; }
}
`
function injectCSS() {
  const id = 'learning-journey-css'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = JOURNEY_CSS
    document.head.appendChild(el)
  }
}

/* ── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  green:   '#1A3A1F',
  amber:   '#C8841A',
  clay:    '#C4A882',
  mist:    '#F5F0E8',
  g08:     'rgba(26,58,31,0.06)',
  g15:     'rgba(26,58,31,0.12)',
  g30:     'rgba(26,58,31,0.25)',
  g40:     'rgba(26,58,31,0.38)',
  g60:     'rgba(26,58,31,0.60)',
  a10:     'rgba(200,132,26,0.10)',
  a25:     'rgba(200,132,26,0.22)',
  serif:   "'Libre Baskerville', Georgia, serif",
  sans:    "'Inter', system-ui, sans-serif",
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(iso, lang) {
  if (!iso) return '—'
  const d = new Date(iso)
  try {
    return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

const RESOURCE_ICON = {
  link:  { bg: T.g08,                        emoji: '🔗' },
  livro: { bg: 'rgba(196,168,130,0.15)',      emoji: '📖' },
  curso: { bg: T.a10,                         emoji: '🎓' },
  outro: { bg: T.g08,                         emoji: '📎' },
}

/* ── TypeTag ────────────────────────────────────────────────────────────── */
function TypeTag({ type }) {
  const { t } = useTranslation()
  const learn = type === 'quero-aprender'
  const label = learn ? t('mind.lj.wantToLearn') : t('mind.lj.developing')
  return (
    <span style={{
      background: learn ? T.a10 : 'rgba(196,168,130,0.2)',
      color:      learn ? T.amber : T.clay,
      fontFamily: T.sans, fontWeight: 500, fontSize: 10,
      borderRadius: 20, padding: '2px 8px',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

/* ── ProgressBar ────────────────────────────────────────────────────────── */
function ProgressBar({ value, height = 2, width = 72 }) {
  return (
    <div style={{ width, height, background: T.g08, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: `${value}%`, height: '100%', background: T.amber, borderRadius: 1 }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   LIST VIEW
═══════════════════════════════════════════════════════════════════════════ */
function ListView({ skills, onSelectSkill, onAddSkill }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'pt').slice(0, 2)
  const [filter, setFilter] = useState('todas')

  const visible = filter === 'todas' ? skills : skills.filter(s => s.type === filter)
  const chips = [
    { key: 'todas',          label: t('mind.lj.filterAll') },
    { key: 'quero-aprender', label: t('mind.lj.wantToLearn') },
    { key: 'desenvolvendo',  label: t('mind.lj.developing') },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h2
            className="type-h1 lj-page-title"
            style={{ marginBottom: 0 }}
          >
            {t('mind.lj.title')}
          </h2>
        </div>
        <button
          onClick={onAddSkill}
          aria-label={t('mind.lj.addSkill')}
          className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 rounded-full text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="lj-filter-row">
        {chips.map(c => {
          const active = filter === c.key
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              style={{
                background: active ? T.green : 'transparent',
                color:      active ? T.mist : T.g40,
                border:     `0.5px solid ${active ? T.green : T.g15}`,
                borderRadius: 20, padding: '5px 14px',
                fontFamily: T.sans, fontSize: 12,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '52px 24px',
          border: `0.5px solid ${T.g15}`, borderRadius: 14, background: 'white',
        }}>
          <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.g40 }}>
            {t('mind.lj.noSkills')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(s => <SkillCard key={s.id} skill={s} onClick={() => onSelectSkill(s.id)} lang={lang} />)}
        </div>
      )}
    </div>
  )
}

function SkillCard({ skill, onClick, lang }) {
  const { t } = useTranslation()
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        border: `0.5px solid ${hov ? T.g15 : T.g08}`,
        borderRadius: 14, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer',
        transform: hov ? 'translateY(-1px)' : 'none',
        transition: 'all .2s',
      }}
    >
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="lj-card-name"
          style={{
            fontFamily: T.serif, fontStyle: 'italic',
            fontWeight: 400, fontSize: 16, color: T.green,
            marginBottom: 8, lineHeight: 1.3,
          }}
        >
          {skill.name || <span style={{ color: T.g40 }}>{t('mind.lj.clickToName')}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <TypeTag type={skill.type ?? 'quero-aprender'} />
          <span style={{ fontFamily: T.sans, fontSize: 11, color: T.g40 }}>
            {t('mind.lj.since')} {fmtDate(skill.started_at ?? skill.created_at, lang)}
          </span>
        </div>
      </div>
      {/* Right */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: T.sans, fontSize: 10, color: T.g40, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('mind.lj.progress')}
        </span>
        <span style={{ fontFamily: T.serif, fontSize: 20, color: T.green, lineHeight: 1 }}>
          {skill.progress ?? 0}%
        </span>
        <ProgressBar value={skill.progress ?? 0} />
      </div>
      <ChevronRight size={14} style={{ color: T.g15, flexShrink: 0 }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAIL VIEW
═══════════════════════════════════════════════════════════════════════════ */
function DetailView({
  skill, detail, detailLoading,
  onBack, onUpdateSkill, onDeleteSkill,
  onAddMilestone, onUpdateMilestone, onDeleteMilestone,
  onAddNote, onAddResource, onDeleteResource,
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'pt').slice(0, 2)
  const [tab, setTab] = useState('progress')
  const [localProgress, setLocalProgress] = useState(skill.progress ?? 0)
  const saveTimer = useRef(null)

  useEffect(() => { setLocalProgress(skill.progress ?? 0) }, [skill.id])

  const milestones = detail?.milestones ?? []
  const notes      = detail?.notes      ?? []
  const resources  = detail?.resources  ?? []
  const doneCount  = milestones.filter(m => m.done).length

  function handleProgress(val) {
    setLocalProgress(val)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onUpdateSkill(skill.id, { progress: val }), 400)
  }

  const [editingName, setEditingName] = useState(false)
  const [localName, setLocalName]     = useState(skill.name ?? '')
  const nameRef = useRef(null)

  function commitName() {
    setEditingName(false)
    if (localName !== skill.name) onUpdateSkill(skill.id, { name: localName })
  }

  const nextMilestone = milestones.find(m => !m.done)

  const tabs = [
    { key: 'progress', label: t('mind.lj.tabProgress') },
    { key: 'notes',    label: t('mind.lj.tabNotes') },
    { key: 'resources',label: t('mind.lj.tabResources') },
  ]

  if (detailLoading) return (
    <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: T.sans, fontSize: 13, color: T.g40 }}>
      {t('mind.lj.loading')}
    </div>
  )

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: T.sans, fontSize: 13, color: T.g40,
          marginBottom: 22, padding: 0, transition: 'color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = T.green }}
        onMouseLeave={e => { e.currentTarget.style.color = T.g40 }}
      >
        <ChevronLeft size={14} /> {t('mind.lj.back')}
      </button>

      {/* Skill header */}
      <div style={{ marginBottom: 24 }}>
        {/* Type chips + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['quero-aprender', 'desenvolvendo'].map(tp => (
            <button
              key={tp}
              onClick={() => onUpdateSkill(skill.id, { type: tp })}
              style={{
                background:   skill.type === tp ? T.a10 : 'transparent',
                color:        skill.type === tp ? T.amber : T.g40,
                border:       `0.5px solid ${skill.type === tp ? T.a25 : T.g15}`,
                borderRadius: 20, padding: '3px 12px',
                fontFamily: T.sans, fontWeight: skill.type === tp ? 500 : 400,
                fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {tp === 'quero-aprender' ? t('mind.lj.wantToLearn') : t('mind.lj.developing')}
            </button>
          ))}
          <button
            onClick={() => { if (window.confirm(t('mind.lj.deleteConfirm'))) onDeleteSkill(skill.id) }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: T.g30, padding: 4, transition: 'color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#b14a4a' }}
            onMouseLeave={e => { e.currentTarget.style.color = T.g30 }}
            title={t('mind.lj.deleteConfirm')}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Name — editable */}
        {editingName ? (
          <input
            ref={nameRef}
            autoFocus
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') { setEditingName(false); setLocalName(skill.name ?? '') }
            }}
            placeholder={t('mind.lj.skillNamePlaceholder')}
            style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 26, fontWeight: 400, color: T.amber,
              background: 'transparent', border: 'none',
              borderBottom: `1px solid ${T.a25}`, outline: 'none',
              width: '100%', padding: '4px 0', marginBottom: 6,
            }}
          />
        ) : (
          <h2
            onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10) }}
            title={t('mind.lj.clickToName')}
            style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 26, fontWeight: 400, lineHeight: 1.2,
              color: skill.name ? T.amber : T.g40,
              cursor: 'text', marginBottom: 6,
            }}
          >
            {skill.name || t('mind.lj.clickToName')}
          </h2>
        )}

        <p style={{ fontFamily: T.sans, fontSize: 12, color: T.g40 }}>
          {t('mind.lj.since2')} {fmtDate(skill.started_at ?? skill.created_at, lang)}
          {' · '}{milestones.length} {t('mind.lj.milestones')}
          {' · '}{resources.length} {t('mind.lj.resources')}
          {' · '}{notes.length} {t('mind.lj.notes')}
        </p>
      </div>

      {/* Grid */}
      <div className="lj-detail-grid">
        {/* ── Left: tab panel ── */}
        <div style={{ background: 'white', border: `0.5px solid ${T.g08}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `0.5px solid ${T.g08}`, padding: '0 22px' }}>
            {tabs.map(tb => {
              const active = tab === tb.key
              return (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: T.sans, fontWeight: active ? 500 : 400,
                    fontSize: 13, color: active ? T.green : T.g40,
                    padding: '14px 16px 14px 0', marginRight: 4,
                    borderBottom: active ? `1.5px solid ${T.amber}` : '1.5px solid transparent',
                    marginBottom: -1, transition: 'all .15s',
                  }}
                >
                  {tb.label}
                </button>
              )
            })}
          </div>

          <div style={{ padding: 22 }}>
            {tab === 'progress' && (
              <ProgressTab
                progress={localProgress}
                onProgressChange={handleProgress}
                milestones={milestones}
                onAddMilestone={() => onAddMilestone(skill.id)}
                onUpdateMilestone={onUpdateMilestone}
                onDeleteMilestone={onDeleteMilestone}
              />
            )}
            {tab === 'notes' && (
              <NotesTab
                notes={notes}
                lang={lang}
                onAddNote={text => onAddNote(skill.id, text)}
              />
            )}
            {tab === 'resources' && (
              <ResourcesTab
                resources={resources}
                onAddResource={(name, type, url) => onAddResource(skill.id, name, type, url)}
                onDeleteResource={onDeleteResource}
              />
            )}
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Overview card */}
          <div style={{ background: 'white', border: `0.5px solid ${T.g08}`, borderRadius: 14, padding: '18px' }}>
            <p style={{
              fontFamily: T.sans, fontWeight: 500, fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: T.g40, marginBottom: 14,
            }}>
              {t('mind.lj.overview')}
            </p>

            {/* Stats 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: t('mind.lj.progress'),   value: `${localProgress}%`,          color: T.amber },
                { label: t('mind.lj.milestones'), value: `${doneCount}/${milestones.length}`, color: T.green },
                { label: t('mind.lj.notes'),      value: notes.length,                  color: T.green },
                { label: t('mind.lj.resources'),  value: resources.length,              color: T.green },
              ].map(s => (
                <div key={s.label} style={{ background: T.mist, borderRadius: 9, padding: '11px 13px' }}>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.g40, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Next milestone */}
            <div style={{ borderTop: `0.5px solid ${T.g08}`, paddingTop: 14 }}>
              <p style={{ fontFamily: T.sans, fontSize: 11, color: T.g40, marginBottom: 4 }}>{t('mind.lj.nextMilestone')}</p>
              {nextMilestone ? (
                <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.green, lineHeight: 1.4 }}>
                  {nextMilestone.text || '—'}
                </p>
              ) : (
                <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.g40 }}>
                  {milestones.length === 0 ? t('mind.lj.noMilestones') : t('mind.lj.allDone')}
                </p>
              )}
            </div>
          </div>

          {/* Locked "vincular a projeto" */}
          <div style={{
            background: 'white', border: `0.5px solid ${T.g08}`,
            borderRadius: 14, position: 'relative', overflow: 'hidden', minHeight: 112,
          }}>
            {/* Ghost */}
            <div style={{ padding: '18px', opacity: 0.3, pointerEvents: 'none' }}>
              <p style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 11, color: T.green, marginBottom: 12 }}>
                {t('mind.lj.linkProject')}
              </p>
              <div style={{ height: 28, background: T.g08, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ height: 28, background: T.g08, borderRadius: 8 }} />
            </div>
            {/* Overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(245,240,232,0.82)',
              backdropFilter: 'blur(2px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{
                background: T.g08, color: T.g40,
                fontFamily: T.sans, fontWeight: 500, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                borderRadius: 20, padding: '4px 10px',
              }}>{t('mind.lj.comingSoon')}</span>
              <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.g40 }}>
                {t('mind.lj.linkProject')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── ProgressTab ──────────────────────────────────────────────────────────── */
function ProgressTab({ progress, onProgressChange, milestones, onAddMilestone, onUpdateMilestone, onDeleteMilestone }) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Slider section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 13, color: T.green }}>{t('mind.lj.progressLabel')}</span>
          <span style={{ fontFamily: T.serif, fontSize: 20, color: T.amber }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: T.g08, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: T.amber, borderRadius: 2, transition: 'width .08s' }} />
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 11, color: T.g40, marginBottom: 12 }}>
          {t('mind.lj.progressHint')}
        </p>
        <input
          type="range" min={0} max={100} value={progress}
          onChange={e => onProgressChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: T.amber, cursor: 'pointer' }}
        />
      </div>

      {/* Milestones */}
      <div>
        <p style={{
          fontFamily: T.sans, fontWeight: 500, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: T.g40, marginBottom: 14,
        }}>{t('mind.lj.milestonesLabel')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {milestones.map(m => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              onUpdate={onUpdateMilestone}
              onDelete={onDeleteMilestone}
            />
          ))}
        </div>

        <button
          onClick={onAddMilestone}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: T.sans, fontSize: 12, color: T.g30,
            marginTop: 14, padding: 0, transition: 'color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.amber }}
          onMouseLeave={e => { e.currentTarget.style.color = T.g30 }}
        >
          <Plus size={12} strokeWidth={2} /> {t('mind.lj.addMilestone')}
        </button>
      </div>
    </div>
  )
}

function MilestoneRow({ milestone, onUpdate, onDelete }) {
  const { t } = useTranslation()
  const [text, setText]       = useState(milestone.text ?? '')
  const [editing, setEditing] = useState(!milestone.text)
  const timer = useRef(null)

  useEffect(() => { setText(milestone.text ?? '') }, [milestone.id])

  function handleChange(v) {
    setText(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate(milestone.id, { text: v }), 600)
  }

  function toggle() { onUpdate(milestone.id, { done: !milestone.done }) }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {/* Circle toggle */}
      <button
        onClick={toggle}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${milestone.done ? T.green : T.g15}`,
          background: milestone.done ? T.green : 'transparent',
          cursor: 'pointer', transition: 'all .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {milestone.done && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />}
      </button>

      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={e => handleChange(e.target.value)}
          onBlur={() => { if (text.trim()) setEditing(false) }}
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) setEditing(false)
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder={t('mind.lj.milestonePlaceholder')}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: `0.5px solid ${T.g15}`, outline: 'none',
            fontFamily: T.sans, fontSize: 13, color: T.green, padding: '0 0 2px',
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            flex: 1, fontFamily: T.sans, fontSize: 13, lineHeight: 1.4,
            color: milestone.done ? T.g40 : T.green,
            textDecoration: milestone.done ? 'line-through' : 'none',
            cursor: 'text',
          }}
        >
          {text || '—'}
        </span>
      )}

      <button
        onClick={() => onDelete(milestone.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.g15, padding: 2, flexShrink: 0, transition: 'color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = T.g40 }}
        onMouseLeave={e => { e.currentTarget.style.color = T.g15 }}
      >
        <X size={11} />
      </button>
    </div>
  )
}

/* ── NotesTab ─────────────────────────────────────────────────────────────── */
function NotesTab({ notes, lang, onAddNote }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')

  function save() {
    if (!text.trim()) return
    onAddNote(text.trim())
    setText('')
  }

  function fmtNoteDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    try {
      return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      }).toUpperCase()
    } catch { return iso.slice(0, 10) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('mind.lj.notePlaceholder')}
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: T.mist, border: `0.5px solid ${T.g15}`,
            borderRadius: 10, padding: '12px 14px',
            fontFamily: T.serif, fontStyle: 'italic',
            fontSize: 13, lineHeight: 1.75, color: T.green,
            outline: 'none', resize: 'vertical', minHeight: 120,
          }}
        />
        <button
          onClick={save}
          disabled={!text.trim()}
          style={{
            marginTop: 10,
            background: text.trim() ? T.green : T.g08,
            color:      text.trim() ? T.mist  : T.g30,
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontFamily: T.sans, fontSize: 12,
            cursor: text.trim() ? 'pointer' : 'default',
            transition: 'all .15s',
          }}
        >
          {t('mind.lj.saveNote')}
        </button>
      </div>

      {notes.length > 0 && (
        <div>
          {notes.map((note, i) => (
            <div key={note.id} style={{
              paddingTop: 14, paddingBottom: 14,
              borderBottom: i < notes.length - 1 ? `0.5px solid ${T.g08}` : 'none',
            }}>
              <p style={{
                fontFamily: T.sans, fontWeight: 500, fontSize: 10,
                color: T.clay, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                {fmtNoteDate(note.created_at)}
              </p>
              <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.g60, lineHeight: 1.7 }}>
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── ResourcesTab ─────────────────────────────────────────────────────────── */
function ResourcesTab({ resources, onAddResource, onDeleteResource }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState('outro')

  function handleAdd() {
    if (!name.trim()) return
    const isUrl = name.trim().startsWith('http')
    const finalType = isUrl ? 'link' : type
    const finalUrl  = isUrl ? name.trim() : ''
    const finalName = isUrl
      ? name.trim().replace(/^https?:\/\//, '').split('/')[0]
      : name.trim()
    onAddResource(finalName, finalType, finalUrl)
    setName('')
  }

  const inputStyle = {
    background: T.mist, border: `0.5px solid ${T.g15}`,
    borderRadius: 8, padding: '8px 12px',
    fontFamily: T.sans, fontSize: 13, color: T.green, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {resources.map(r => {
        const icon = RESOURCE_ICON[r.type] ?? RESOURCE_ICON.outro
        return (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: `0.5px solid ${T.g08}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: icon.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              {icon.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: T.sans, fontSize: 13, color: T.green,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{r.name}</p>
              <p style={{
                fontFamily: T.sans, fontSize: 10, color: T.g40,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{r.type}</p>
            </div>
            <button
              onClick={() => onDeleteResource(r.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.g15, fontFamily: T.sans, fontSize: 18,
                padding: 4, flexShrink: 0, lineHeight: 1,
                transition: 'color .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.g40 }}
              onMouseLeave={e => { e.currentTarget.style.color = T.g15 }}
            >×</button>
          </div>
        )
      })}

      {/* Add form */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder={t('mind.lj.resourcePlaceholder')}
          style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="link">link</option>
          <option value="livro">{t('mind.lj.book')}</option>
          <option value="curso">{t('mind.lj.course')}</option>
          <option value="outro">{t('mind.lj.other')}</option>
        </select>
        <button
          onClick={handleAdd}
          style={{
            background: T.green, color: T.mist,
            border: 'none', borderRadius: 8, padding: '8px 14px',
            fontFamily: T.sans, fontSize: 12, cursor: 'pointer',
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {t('mind.lj.addResource')}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LearningJourney() {
  const { t } = useTranslation()
  const {
    skills, loading,
    addSkill, updateSkill, deleteSkill,
    detail, detailLoading, loadDetail, clearDetail,
    addMilestone, updateMilestone, deleteMilestone,
    addNote, addResource, deleteResource,
  } = useSkills()

  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => { injectCSS() }, [])

  const selected = skills.find(s => s.id === selectedId)

  async function handleAddSkill() {
    const skill = await addSkill()
    if (skill) {
      setSelectedId(skill.id)
      await loadDetail(skill.id)
    }
  }

  async function handleSelect(id) {
    setSelectedId(id)
    await loadDetail(id)
  }

  async function handleDelete(id) {
    await deleteSkill(id)
    setSelectedId(null)
    clearDetail()
  }

  function handleBack() {
    setSelectedId(null)
    clearDetail()
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: T.sans, fontSize: 13, color: T.g40 }}>
      {t('mind.lj.loading')}
    </div>
  )

  if (selectedId && selected) {
    return (
      <DetailView
        skill={selected}
        detail={detail}
        detailLoading={detailLoading}
        onBack={handleBack}
        onUpdateSkill={updateSkill}
        onDeleteSkill={handleDelete}
        onAddMilestone={addMilestone}
        onUpdateMilestone={updateMilestone}
        onDeleteMilestone={deleteMilestone}
        onAddNote={addNote}
        onAddResource={addResource}
        onDeleteResource={deleteResource}
      />
    )
  }

  return (
    <ListView
      skills={skills}
      onSelectSkill={handleSelect}
      onAddSkill={handleAddSkill}
    />
  )
}
