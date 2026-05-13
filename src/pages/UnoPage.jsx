import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnoProject } from '../hooks/useUno'
import { ArrowLeft, Check, Save, ChevronDown, ChevronRight } from 'lucide-react'
import BodyStage from '../components/uno/BodyStage'

/* ─── CONSTANTS ──────────────────────────────────────────── */
const UNO_PURPLE = '#4A0E8F'
const STAGE_ORDER = ['spirit', 'mind', 'body']

const STAGES = [
  { id: 'spirit', label: 'ESPÍRITO', color: '#1B3A5C' },
  { id: 'mind',   label: 'MENTE',    color: '#D4890A' },
  { id: 'body',   label: 'CORPO',    color: '#2D5016' },
]

const SPIRIT_QUESTIONS = [
  { field: 'spirit_internal',    label: 'O que eu preciso trabalhar internamente?', ph: 'Reflita sobre seus bloqueios, medos, padrões...' },
  { field: 'spirit_generates',   label: 'O que isso gera em mim?',                  ph: 'Quais emoções, sensações, energia...' },
  { field: 'spirit_destination', label: 'Onde eu quero chegar?',                    ph: 'Visualize o ponto de chegada...' },
  { field: 'spirit_feeling',     label: 'Qual sentimento isso gera em mim?',        ph: 'Gratidão, leveza, poder, paz...' },
  { field: 'spirit_start',       label: 'Quando eu pretendo iniciar?',              ph: 'Uma data, uma estação, um momento...' },
]

const MIND_QUESTIONS = [
  { field: 'mind_beliefs',      label: 'Quais crenças trazer para realizar esse desejo?', ph: 'Eu acredito que posso... Eu mereço... Eu sou capaz de...' },
  { field: 'mind_affirmations', label: 'Firmamentos e afirmações mentais',                ph: 'Escreva suas afirmações no presente, como se já fossem verdade...' },
]

/* ─── STYLES ─────────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById('uno-styles')) return
  const el = document.createElement('style')
  el.id = 'uno-styles'
  el.textContent = `
    .uno-page { min-height:100vh; background:#fff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .uno-bar { position:sticky;top:0;z-index:30;background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);border-bottom:1px solid #f0f0f0;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px; }
    .uno-back { background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;color:#71717a;font-size:13px;font-weight:500;padding:6px 8px;border-radius:8px;transition:all .15s; }
    .uno-back:hover { background:#f4f4f5;color:#1a1a1a; }
    .uno-content { max-width:680px;margin:0 auto;padding:60px 40px 120px; }
    .uno-label { font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${UNO_PURPLE};margin-bottom:14px; }
    .uno-title { font-family:Georgia,serif;font-size:38px;font-weight:700;color:#0a0a0a;line-height:1.2;margin:0 0 20px; }
    .uno-divider { width:48px;height:3px;background:${UNO_PURPLE};border-radius:2px;margin:0 0 52px; }
    .uno-q-label { font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#71717a;margin-bottom:10px; }
    .uno-q-block { margin-bottom:36px; }
    .uno-textarea { width:100%;resize:none;border:none;border-bottom:1px solid #e4e4e7;background:transparent;font-size:16px;color:#1a1a1a;line-height:1.7;padding:10px 0;outline:none;transition:border-color .2s;font-family:Georgia,serif;overflow:hidden;box-sizing:border-box; }
    .uno-textarea:focus { border-color:${UNO_PURPLE}; }
    .uno-textarea::placeholder { color:#c4c4c7;font-style:italic; }
    .uno-save-btn { display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .2s; }
    .uno-cta { width:100%;padding:18px;border-radius:16px;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:52px; }
    .uno-cta:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.12); }
    .uno-accordion-btn { width:100%;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:12px;border:1px solid #f0f0f0;margin-bottom:8px;transition:all .15s; }
    .uno-accordion-btn:hover { background:#fafafa; }
    .uno-task-row { display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1px solid #f0f0f0;margin-bottom:8px;transition:all .15s; }
    .uno-task-row:hover { border-color:#e4e4e7;background:#fafafa; }
    .uno-check { width:18px;height:18px;border-radius:50%;border:2px solid #d4d4d8;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s; }
    .uno-date-input { font-size:12px;border:1px solid #e4e4e7;border-radius:8px;padding:4px 8px;color:#71717a;background:white;outline:none;cursor:pointer; }
    .uno-progress-bar { height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;margin-bottom:24px; }
    .uno-progress-fill { height:100%;border-radius:2px;transition:width .4s ease; }
    @media(max-width:640px){.uno-content{padding:40px 20px 100px;}.uno-title{font-size:28px;}}
  `
  document.head.appendChild(el)
}

/* ─── SMALL COMPONENTS ───────────────────────────────────── */
function StageProgress({ stage }) {
  const currentIdx = STAGES.findIndex(s => s.id === stage)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGES.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const color = done ? '#10B981' : active ? s.color : '#d4d4d8'
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: done || active ? color : 'transparent', border: `2px solid ${color}`, transition: 'all .3s' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color, transition: 'color .3s' }}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ width: 32, height: 1, background: done ? '#10B981' : '#e4e4e7', margin: '0 6px 10px', transition: 'background .3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SaveStatus({ status }) {
  if (status === 'saved') return <span style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}><Check size={12} />Salvo</span>
  if (status === 'saving') return <span style={{ fontSize: 12, color: '#D4890A', fontWeight: 500 }}>Salvando…</span>
  return <span style={{ width: 60 }} />
}

function UnoTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.height = '1px'; el.style.height = el.scrollHeight + 'px'
  }, [])
  useLayoutEffect(() => { resize() })
  return <textarea ref={ref} className="uno-textarea" value={value} onChange={e => { onChange(e.target.value); resize() }} rows={1} placeholder={placeholder} />
}

function QuestionBlock({ label, placeholder, value, onSave }) {
  const [local, setLocal] = useState(value || '')
  const [status, setStatus] = useState('clean')
  useEffect(() => { setLocal(value || ''); setStatus('clean') }, [value])

  async function handleSave() {
    setStatus('saving')
    await onSave(local)
    setStatus('saved')
    setTimeout(() => setStatus('clean'), 2500)
  }

  const btnStyle = {
    clean:  { background: '#f4f4f5', color: '#a1a1aa', cursor: 'default' },
    dirty:  { background: UNO_PURPLE, color: '#fff', cursor: 'pointer' },
    saving: { background: '#6d28d9', color: '#fff', cursor: 'wait' },
    saved:  { background: '#10B981', color: '#fff', cursor: 'default' },
  }

  return (
    <div className="uno-q-block">
      <div className="uno-q-label">{label}</div>
      <UnoTextarea value={local} onChange={v => { setLocal(v); setStatus('dirty') }} placeholder={placeholder} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="uno-save-btn" style={btnStyle[status]} onClick={status === 'dirty' ? handleSave : undefined}>
          {status === 'saved' ? <Check size={11} /> : <Save size={11} />}
          {status === 'clean' ? 'Salvo' : status === 'dirty' ? 'Salvar' : status === 'saving' ? 'Salvando…' : 'Salvo ✓'}
        </button>
      </div>
    </div>
  )
}

function Accordion({ label, children, accentColor = UNO_PURPLE }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 24 }}>
      <button className="uno-accordion-btn" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, fontWeight: 600, color: accentColor }}>{label}</span>
        {open ? <ChevronDown size={14} style={{ color: '#a1a1aa' }} /> : <ChevronRight size={14} style={{ color: '#a1a1aa' }} />}
      </button>
      {open && <div style={{ padding: '8px 18px 18px', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 12px 12px', marginTop: -8 }}>{children}</div>}
    </div>
  )
}

function ReadonlyField({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 6 }}>{label}</div>
      <p style={{ fontSize: 15, color: '#3f3f46', lineHeight: 1.7, fontFamily: 'Georgia,serif', margin: 0 }}>{value}</p>
    </div>
  )
}

/* ─── STAGE SECTIONS ─────────────────────────────────────── */
function SpiritStage({ project, saveField, advanceStage }) {
  const allFilled = SPIRIT_QUESTIONS.every(q => project[q.field]?.trim())
  return (
    <>
      {SPIRIT_QUESTIONS.map(q => (
        <QuestionBlock key={q.field} label={q.label} placeholder={q.ph} value={project[q.field]} onSave={v => saveField(q.field, v)} />
      ))}
      <button className="uno-cta" style={{ background: allFilled ? '#1B3A5C' : '#f4f4f5', color: allFilled ? '#fff' : '#a1a1aa', cursor: allFilled ? 'pointer' : 'not-allowed' }}
        onClick={allFilled ? () => advanceStage('mind') : undefined}>
        {allFilled ? '→ Enviar para Mente' : 'Preencha todas as respostas para continuar'}
      </button>
    </>
  )
}

function MindStage({ project, saveField, advanceStage }) {
  const allFilled = MIND_QUESTIONS.every(q => project[q.field]?.trim())
  return (
    <>
      <Accordion label="Ver respostas do Espírito →" accentColor="#1B3A5C">
        {SPIRIT_QUESTIONS.map(q => <ReadonlyField key={q.field} label={q.label} value={project[q.field]} />)}
      </Accordion>

      {MIND_QUESTIONS.map(q => (
        <QuestionBlock key={q.field} label={q.label} placeholder={q.ph} value={project[q.field]} onSave={v => saveField(q.field, v)} />
      ))}
      <button className="uno-cta" style={{ background: allFilled ? '#D4890A' : '#f4f4f5', color: allFilled ? '#fff' : '#a1a1aa', cursor: allFilled ? 'pointer' : 'not-allowed' }}
        onClick={allFilled ? () => advanceStage('body') : undefined}>
        {allFilled ? '→ Enviar para Corpo' : 'Preencha as respostas para continuar'}
      </button>
    </>
  )
}



/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function UnoPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, tasks, loading, saveField, advanceStage, addTask, updateTask, deleteTask } = useUnoProject(projectId)

  useEffect(() => { injectStyles() }, [])

  if (loading) return (
    <div className="uno-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${UNO_PURPLE}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!project) return (
    <div className="uno-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#a1a1aa', fontSize: 14 }}>Projeto não encontrado.</p>
      <button className="uno-back" onClick={() => navigate(-1)}>← Voltar</button>
    </div>
  )

  return (
    <div className="uno-page">
      {/* Top bar */}
      <div className="uno-bar">
        <button className="uno-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <StageProgress stage={project.stage} />
        <div style={{ width: 80, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>UNO</span>
        </div>
      </div>

      {/* Content */}
      <div className="uno-content">
        <div className="uno-label">Desejo de Alma</div>
        <h1 className="uno-title">{project.title || 'Sem título'}</h1>
        <div className="uno-divider" />

        {project.stage === 'spirit' && (
          <SpiritStage project={project} saveField={saveField} advanceStage={advanceStage} />
        )}
        {project.stage === 'mind' && (
          <MindStage project={project} saveField={saveField} advanceStage={advanceStage} />
        )}
        {project.stage === 'body' && (
          <BodyStage project={project} tasks={tasks} saveField={saveField} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
        )}
      </div>
    </div>
  )
}
