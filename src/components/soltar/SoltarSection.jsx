import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Leaf, ChevronLeft, Check, Trash2, Pencil, X as XIcon } from 'lucide-react'
import {
  useHabits, daysBetweenInclusive, todayIndexInStage,
  markedCount, missedCount, addressedCount, consistency,
  activeStage, todayISO, addDaysISO, normalizeDayValue,
} from '../../hooks/useHabits'

/* ─── Tokens ─────────────────────────────────────────────────────────── */
const T = {
  green:  '#1A3A1F',
  greenSoft: 'rgba(26,58,31,0.10)',
  amber:  '#C8841A',
  amberSoft: 'rgba(200,132,26,0.12)',
  clay:   '#C4A882',
  claySoft: 'rgba(196,168,130,0.18)',
  mist:   '#F5F0E8',
  paper:  '#FDFAF3',
  ink:    '#2D2A26',
  inkMute: '#5C5C5C',
  inkFaint: '#8B7E6F',
  fontHead: '"Cormorant Garamond", Georgia, serif',
  fontBody: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
}

/* ─── Main orchestrator ──────────────────────────────────────────────── */

export default function SoltarSection() {
  const { t } = useTranslation()
  const data = useHabits()
  // view state machine
  const [view, setView] = useState({ name: 'list' })
  /*  view ∈
      { name: 'list' }
      { name: 'create' }
      { name: 'tracker',    habitId }
      { name: 'reflection', habitId, stageId }
      { name: 'newStage',   habitId }
  */

  // detect last-day click → reflection (handled inside tracker)
  const goList     = () => setView({ name: 'list' })
  const goCreate   = () => setView({ name: 'create' })
  const goTracker  = (habitId) => setView({ name: 'tracker', habitId })
  const goReflect  = (habitId, stageId) => setView({ name: 'reflection', habitId, stageId })
  const goNewStage = (habitId) => setView({ name: 'newStage', habitId })

  if (data.loading) return null

  return (
    <section className="space-y-4">
      <Header t={t} view={view} onBack={goList} onCreate={goCreate} />

      {view.name === 'list' && (
        <HabitList
          t={t}
          habits={data.habits}
          stages={data.stages}
          onOpenHabit={goTracker}
          onCreate={goCreate}
          onDelete={data.deleteHabit}
        />
      )}

      {view.name === 'create' && (
        <HabitForm
          t={t}
          onCancel={goList}
          onSubmit={async (payload) => {
            const result = await data.addHabit(payload.habit, payload.firstStage)
            if (result) goTracker(result.habit.id)
          }}
        />
      )}

      {view.name === 'tracker' && (
        <HabitTracker
          t={t}
          habit={data.habits.find(h => h.id === view.habitId)}
          stages={data.stagesByHabit(view.habitId)}
          onCycleDay={data.cycleDay}
          onFinishStage={(stageId) => goReflect(view.habitId, stageId)}
          onDelete={async () => { await data.deleteHabit(view.habitId); goList() }}
          onSaveEdit={async ({ habitPatch, stagePatch, extendEnd }) => {
            const habit = data.habits.find(h => h.id === view.habitId)
            if (habit && habitPatch) await data.updateHabit(habit.id, habitPatch)
            const stages = data.stagesByHabit(view.habitId)
            const cur = activeStage(stages)
            if (cur && stagePatch) await data.updateStage(cur.id, stagePatch)
            if (cur && extendEnd) await data.extendStage(cur.id, extendEnd)
          }}
        />
      )}

      {view.name === 'reflection' && (
        <HabitReflection
          t={t}
          habit={data.habits.find(h => h.id === view.habitId)}
          stage={data.stages.find(s => s.id === view.stageId)}
          stages={data.stagesByHabit(view.habitId)}
          onSaveReflection={(text) => data.saveReflection(view.stageId, text)}
          onAdvance={async () => {
            await data.completeStage(view.stageId)
            goNewStage(view.habitId)
          }}
          onRelease={async () => {
            await data.completeStage(view.stageId)
            await data.completeHabit(view.habitId)
            goList()
          }}
        />
      )}

      {view.name === 'newStage' && (
        <NewStageForm
          t={t}
          habit={data.habits.find(h => h.id === view.habitId)}
          stages={data.stagesByHabit(view.habitId)}
          onCancel={() => goTracker(view.habitId)}
          onSubmit={async ({ step, start_date, end_date, total_days }) => {
            await data.addStage(view.habitId, { step, start_date, end_date, total_days })
            goTracker(view.habitId)
          }}
        />
      )}
    </section>
  )
}

/* ─── Section header (title + actions) ───────────────────────────────── */

function Header({ t, view, onBack, onCreate }) {
  const showBack = view.name !== 'list'
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="type-h1 mb-1">
            {t('soltar.title')}
          </h2>
          <p className="text-[#5C5C5C] text-sm">{t('soltar.subtitle')}</p>
        </div>
        {!showBack && (
          <button
            onClick={onCreate}
            aria-label={t('soltar.newHabit')}
            className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 rounded-full text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={18} />
          </button>
        )}
        {showBack && (
          <button onClick={onBack}
            className="flex items-center gap-1 text-[12px] text-[#8B7E6F] hover:text-[#2D2A26] transition-colors"
          >
            <ChevronLeft size={14} /> {t('soltar.back')}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Tela 1: List ───────────────────────────────────────────────────── */

function HabitList({ t, habits, stages, onOpenHabit, onCreate, onDelete }) {
  const [tab, setTab] = useState('active')
  const filtered = habits.filter(h => h.status === (tab === 'active' ? 'active' : 'completed'))

  return (
    <div>
      {/* Tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full mb-6"
        style={{ background: 'rgba(196,168,130,0.18)' }}>
        {[
          { key: 'active',    label: t('soltar.tabActive') },
          { key: 'completed', label: t('soltar.tabCompleted') },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setTab(opt.key)}
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all"
            style={{
              background: tab === opt.key ? T.paper : 'transparent',
              color:      tab === opt.key ? T.ink : T.inkFaint,
              boxShadow:  tab === opt.key ? '0 1px 3px rgba(60,45,20,0.08)' : 'none',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(habit => {
          const habitStages = stages.filter(s => s.habit_id === habit.id)
            .sort((a, b) => a.stage_order - b.stage_order)
          const cur = activeStage(habitStages) || habitStages[0]
          const pct = cur ? consistency(cur) : 0
          const marked = cur ? markedCount(cur) : 0
          return (
            <button
              key={habit.id}
              onClick={() => onOpenHabit(habit.id)}
              className="text-left p-5 rounded-2xl transition-all group relative"
              style={{
                background: T.paper,
                border: '1px solid rgba(196,168,130,0.3)',
                fontFamily: T.fontBody,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.clay; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,168,130,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="font-display text-[22px] leading-tight text-[#2D2A26] flex-1 italic">
                  {habit.name || t('soltar.unnamed')}
                </div>
                <span
                  className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: T.greenSoft, color: T.green }}
                >
                  {t('soltar.stageN', { n: cur?.stage_order || 1 })}
                </span>
              </div>

              {/* Mini-tracker dots */}
              {cur && cur.total_days > 0 && (
                <div className="flex items-center gap-[3px] mb-3 flex-wrap">
                  {Array.from({ length: Math.min(cur.total_days, 30) }).map((_, i) => {
                    const state = normalizeDayValue(Array.isArray(cur.marked_days) ? cur.marked_days[i] : 0)
                    return (
                      <span key={i}
                        className="rounded-full inline-block"
                        style={{
                          width: 7, height: 7,
                          background: state === 1 ? T.green : 'transparent',
                          border: state === 1 ? 'none'
                            : state === 2 ? `1px solid ${T.amber}`
                            : `1px solid ${T.clay}`,
                          opacity: state === 2 ? 0.5 : 1,
                        }}
                      />
                    )
                  })}
                  {cur.total_days > 30 && (
                    <span className="text-[10px] text-[#8B7E6F] ml-1">+{cur.total_days - 30}</span>
                  )}
                </div>
              )}

              {/* Progress bar + % */}
              {cur && (
                <>
                  <div className="h-1 rounded-full overflow-hidden mb-2"
                    style={{ background: 'rgba(196,168,130,0.2)' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: T.amber, transition: 'width .3s' }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8B7E6F]">
                    <span>{t('soltar.daysOfTotal', { x: marked, y: cur.total_days })}</span>
                    <span style={{ color: T.amber, fontWeight: 700 }}>{pct}%</span>
                  </div>
                </>
              )}

              {/* Delete on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(t('soltar.deleteConfirm', { name: habit.name || '' }))) onDelete(habit.id)
                }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#8B7E6F] hover:text-red-500 p-1"
                aria-label={t('common.delete')}
              >
                <Trash2 size={12} />
              </button>
            </button>
          )
        })}

        {tab === 'active' && (
          <button
            onClick={onCreate}
            style={{
              padding: 24, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px dashed ${T.clay}`,
              background: 'transparent',
              color: T.clay,
              fontFamily: T.fontHead, fontStyle: 'italic',
              fontSize: 14, minHeight: 140,
              cursor: 'pointer', transition: 'all .2s',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,168,130,0.06)'; e.currentTarget.style.color = T.green }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.clay }}
          >
            <Plus size={16} style={{ marginRight: 8 }} />
            {t('soltar.newHabit')}
          </button>
        )}

        {filtered.length === 0 && tab === 'completed' && (
          <div className="col-span-full text-center py-12 text-[#8B7E6F] text-sm italic font-display">
            {t('soltar.noneCompleted')}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Tela 2: Create habit ───────────────────────────────────────────── */

function HabitForm({ t, onCancel, onSubmit }) {
  const [name, setName]   = useState('')
  const [why, setWhy]     = useState('')
  const [how, setHow]     = useState('')
  const [pulse, setPulse] = useState('always')
  const [step, setStep]   = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate]     = useState(addDaysISO(todayISO(), 20))

  const totalDays = daysBetweenInclusive(startDate, endDate)
  const valid = name.trim() && why.trim() && how.trim() && step.trim() && totalDays > 0

  async function submit() {
    if (!valid) return
    await onSubmit({
      habit:      { name: name.trim(), why: why.trim(), how: how.trim(), pulse },
      firstStage: { step: step.trim(), start_date: startDate, end_date: endDate, total_days: totalDays },
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 mt-4">
      <div className="space-y-6">
        <Field t={t} label={t('soltar.f.name')} value={name} onChange={setName} placeholder={t('soltar.f.namePh')} />
        <FieldTA t={t} label={t('soltar.f.why')} value={why} onChange={setWhy} placeholder={t('soltar.f.whyPh')} />
        <FieldTA t={t} label={t('soltar.f.how')} value={how} onChange={setHow} placeholder={t('soltar.f.howPh')} />

        <div>
          <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
            {t('soltar.f.pulse')}
          </label>
          <div className="flex flex-wrap gap-2">
            {['morning', 'afternoon', 'night', 'always'].map(p => (
              <button
                key={p}
                onClick={() => setPulse(p)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                style={{
                  background: pulse === p ? T.green : 'transparent',
                  color:      pulse === p ? T.paper : T.inkMute,
                  border:     `1px solid ${pulse === p ? T.green : T.clay}`,
                }}
              >
                {t(`soltar.pulse.${p}`)}
              </button>
            ))}
          </div>
        </div>

        <Field t={t} label={t('soltar.f.step')} value={step} onChange={setStep} placeholder={t('soltar.f.stepPh')} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.start')}
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.end')}
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
          </div>
        </div>
        <div className="text-[12px] text-[#8B7E6F] italic" style={{ fontFamily: T.fontHead }}>
          {t('soltar.totalDays', { n: totalDays })}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-full text-[13px] text-[#8B7E6F] border transition-all"
            style={{ borderColor: T.clay, fontFamily: T.fontHead, fontStyle: 'italic' }}>
            {t('common.cancel')}
          </button>
          <button onClick={submit} disabled={!valid}
            className="px-5 py-2 rounded-full text-[13px] text-white font-semibold transition-all"
            style={{
              background: valid ? T.green : 'rgba(26,58,31,0.3)',
              cursor: valid ? 'pointer' : 'default',
              fontFamily: T.fontHead, fontStyle: 'italic',
            }}>
            {t('soltar.startHabit')}
          </button>
        </div>
      </div>

      {/* Right panel */}
      <aside className="space-y-6">
        <StageTimeline t={t} stages={[{ stage_order: 1, step: step || t('soltar.f.stepPh') }]} currentOrder={1} />
        <div className="p-4 rounded-xl text-[12px] leading-relaxed"
          style={{ background: T.amberSoft, color: T.ink, fontFamily: T.fontHead, fontStyle: 'italic' }}>
          {t('soltar.info21to66')}
        </div>
      </aside>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
        style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
    </div>
  )
}
function FieldTA({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
        style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
    </div>
  )
}

/* ─── Tela 3: Tracker ────────────────────────────────────────────────── */

function HabitTracker({ t, habit, stages, onCycleDay, onFinishStage, onSaveEdit }) {
  const current = activeStage(stages)
  const [editing, setEditing] = useState(false)
  if (!habit || !current) return null
  const todayIdx = todayIndexInStage(current)
  const marked  = markedCount(current)
  const missed  = missedCount(current)
  const addressed = addressedCount(current)
  const pct     = consistency(current)
  const allAddressed = addressed >= current.total_days && current.total_days > 0
  const [showReflect, setShowReflect] = useState(false)

  async function handleClickDay(i) {
    await onCycleDay(current.id, i)
  }

  // Grid sizing
  const cols = current.total_days <= 14 ? 7 : current.total_days <= 30 ? 7 : 10
  const cellSize = current.total_days <= 30 ? 28 : 22

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 mt-4">
      <div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="font-display text-[28px] italic text-[#2D2A26] flex-1">{habit.name}</div>
          <button onClick={() => setEditing(true)}
            title={t('soltar.editHabit')}
            className="p-2 rounded-full transition-colors"
            style={{ color: T.inkFaint }}
            onMouseEnter={e => { e.currentTarget.style.color = T.green; e.currentTarget.style.background = 'rgba(26,58,31,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = T.inkFaint; e.currentTarget.style.background = 'transparent' }}
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="text-[13px] text-[#8B7E6F] mb-6" style={{ fontFamily: T.fontHead, fontStyle: 'italic' }}>
          {t('soltar.stageN', { n: current.stage_order })} · {current.step}
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8B7E6F] mb-3">{t('soltar.markEachDay')}</p>

        <div className="grid gap-2 mb-4"
          style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}>
          {Array.from({ length: current.total_days }).map((_, i) => {
            const state = normalizeDayValue(Array.isArray(current.marked_days) ? current.marked_days[i] : 0)
            const isToday  = i === todayIdx
            const borderColor =
              isToday   ? T.amber :
              state===1 ? T.green :
              state===2 ? T.amber :
                          T.clay
            return (
              <button key={i}
                onClick={() => handleClickDay(i)}
                aria-label={t('soltar.dayN', { n: i + 1 })}
                className="rounded-full transition-all relative"
                style={{
                  width: cellSize, height: cellSize,
                  background: state === 1 ? T.green : 'transparent',
                  border: `${isToday ? '2px' : '1px'} solid ${borderColor}`,
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {state === 1 && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.amber }} />
                )}
                {state === 2 && (
                  <XIcon size={Math.round(cellSize * 0.45)} strokeWidth={2} style={{ color: T.amber, opacity: 0.85 }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-5 text-[10px] uppercase tracking-[0.14em] text-[#8B7E6F]">
          <Legend swatchBg={T.green} swatchDot={T.amber} label={t('soltar.legendDone')} />
          <Legend swatchBg="transparent" swatchBorder={T.amber} swatchX={true} label={t('soltar.legendMissed')} />
          <Legend swatchBg="transparent" swatchBorder={T.clay} label={t('soltar.legendEmpty')} />
        </div>

        <div className="h-1.5 rounded-full overflow-hidden mb-2"
          style={{ background: 'rgba(196,168,130,0.2)' }}>
          <div className="h-full" style={{ width: `${pct}%`, background: T.green, transition: 'width .3s' }} />
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#8B7E6F]">
            {t('soltar.daysOfTotal', { x: marked, y: current.total_days })}
            {missed > 0 && <span className="ml-2 italic">· {t('soltar.missedN', { n: missed })}</span>}
          </span>
          <span style={{ color: T.amber, fontWeight: 700 }}>{pct}%</span>
        </div>

        {/* Reflect button — only when all days addressed */}
        {allAddressed && !showReflect && (
          <button
            onClick={() => { setShowReflect(true); setTimeout(() => onFinishStage(current.id), 200) }}
            className="mt-6 w-full py-3 rounded-2xl text-sm font-medium tracking-wide transition-all"
            style={{
              background: T.green,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {t('soltar.reflectBtn')}
          </button>
        )}
      </div>

      {/* Right column */}
      <aside className="space-y-5">
        <StatsBlock t={t} stage={current} />
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">{t('soltar.whyLabel')}</p>
          <p className="text-[13px] text-[#2D2A26] leading-relaxed italic" style={{ fontFamily: T.fontHead }}>
            "{habit.why}"
          </p>
        </div>
        <PulseChip t={t} pulse={habit.pulse} />
        <StageTimeline t={t} stages={stages} currentOrder={current.stage_order} />
      </aside>

      {editing && (
        <HabitEditModal
          t={t}
          habit={habit}
          stage={current}
          onClose={() => setEditing(false)}
          onSave={async (payload) => {
            await onSaveEdit(payload)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

function Legend({ swatchBg, swatchBorder, swatchDot, swatchX, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded-full inline-flex items-center justify-center"
        style={{
          width: 12, height: 12,
          background: swatchBg,
          border: swatchBorder ? `1px solid ${swatchBorder}` : 'none',
        }}>
        {swatchDot && <span style={{ width: 4, height: 4, borderRadius: '50%', background: swatchDot }} />}
        {swatchX && <XIcon size={8} strokeWidth={2.4} style={{ color: T.amber, opacity: 0.85 }} />}
      </span>
      {label}
    </span>
  )
}

/* ─── Edit habit modal ───────────────────────────────────────────────── */

function HabitEditModal({ t, habit, stage, onClose, onSave }) {
  const [name, setName]   = useState(habit.name || '')
  const [why, setWhy]     = useState(habit.why || '')
  const [how, setHow]     = useState(habit.how || '')
  const [pulse, setPulse] = useState(habit.pulse || 'always')
  const [step, setStep]   = useState(stage.step || '')
  const [endDate, setEndDate] = useState(stage.end_date || todayISO())

  const totalDays = daysBetweenInclusive(stage.start_date, endDate)
  const isExtension = endDate !== stage.end_date
  const valid = name.trim() && totalDays > 0

  async function submit() {
    if (!valid) return
    const habitPatch = {
      name:  name.trim(),
      why:   why.trim(),
      how:   how.trim(),
      pulse,
    }
    const stagePatch = step.trim() !== (stage.step || '') ? { step: step.trim() } : null
    const extendEnd = isExtension ? endDate : null
    await onSave({ habitPatch, stagePatch, extendEnd })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40, 32, 22, 0.32)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg p-7 rounded-2xl"
        style={{
          background: T.paper, fontFamily: T.fontBody,
          boxShadow: '0 20px 50px rgba(60,45,20,0.2)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display italic text-[24px] text-[#2D2A26]">{t('soltar.editHabit')}</h3>
          <button onClick={onClose} className="text-[#8B7E6F] hover:text-[#2D2A26] p-1">
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-5">
          <Field t={t} label={t('soltar.f.name')} value={name} onChange={setName} placeholder={t('soltar.f.namePh')} />
          <FieldTA t={t} label={t('soltar.f.why')} value={why} onChange={setWhy} placeholder={t('soltar.f.whyPh')} />
          <FieldTA t={t} label={t('soltar.f.how')} value={how} onChange={setHow} placeholder={t('soltar.f.howPh')} />

          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.pulse')}
            </label>
            <div className="flex flex-wrap gap-2">
              {['morning', 'afternoon', 'night', 'always'].map(p => (
                <button
                  key={p}
                  onClick={() => setPulse(p)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                  style={{
                    background: pulse === p ? T.green : 'transparent',
                    color:      pulse === p ? T.paper : T.inkMute,
                    border:     `1px solid ${pulse === p ? T.green : T.clay}`,
                  }}
                >
                  {t(`soltar.pulse.${p}`)}
                </button>
              ))}
            </div>
          </div>

          <Field t={t} label={t('soltar.f.currentStep')} value={step} onChange={setStep} placeholder={t('soltar.f.stepPh')} />

          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.extendEnd')}
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={stage.start_date}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: T.mist, border: `1px solid ${T.claySoft}` }} />
            <div className="text-[12px] text-[#8B7E6F] mt-2 italic" style={{ fontFamily: T.fontHead }}>
              {t('soltar.totalDays', { n: totalDays })}
              {isExtension && totalDays > (stage.total_days || 0) && (
                <span className="ml-2" style={{ color: T.amber }}>
                  · +{totalDays - (stage.total_days || 0)} {t('soltar.daysAdded')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 justify-end">
            <button onClick={onClose}
              className="px-5 py-2 rounded-full text-[13px] text-[#8B7E6F] border transition-all"
              style={{ borderColor: T.clay, fontFamily: T.fontHead, fontStyle: 'italic' }}>
              {t('common.cancel')}
            </button>
            <button onClick={submit} disabled={!valid}
              className="px-5 py-2 rounded-full text-[13px] text-white font-semibold transition-all"
              style={{
                background: valid ? T.green : 'rgba(26,58,31,0.3)',
                cursor: valid ? 'pointer' : 'default',
                fontFamily: T.fontHead, fontStyle: 'italic',
              }}>
              {t('soltar.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Tela 4: Reflection ─────────────────────────────────────────────── */

function HabitReflection({ t, habit, stage, stages, onSaveReflection, onAdvance, onRelease }) {
  const [text, setText] = useState(stage?.reflection || '')
  const [showModal, setShowModal] = useState(false)
  if (!habit || !stage) return null
  const pct = consistency(stage)

  async function handleSave() {
    await onSaveReflection(text)
    setShowModal(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 mt-4">
      <div>
        <div className="font-display text-[28px] italic text-[#2D2A26] mb-1">{habit.name}</div>
        <div className="text-[13px] text-[#8B7E6F] mb-6" style={{ fontFamily: T.fontHead, fontStyle: 'italic' }}>
          {t('soltar.stageN', { n: stage.stage_order })} · {t('soltar.stageEnded')}
        </div>

        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8B7E6F] mb-3">{t('soltar.reflectionPrompt')}</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('soltar.reflectionPh')}
          rows={10}
          className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-vertical leading-relaxed"
          style={{
            background: T.paper, border: `1px solid ${T.claySoft}`,
            fontFamily: T.fontBody, color: T.ink, minHeight: 240,
          }}
        />
        <div className="flex justify-end mt-4">
          <button onClick={handleSave}
            disabled={!text.trim()}
            className="px-5 py-2 rounded-full text-[13px] text-white font-semibold transition-all"
            style={{
              background: text.trim() ? T.green : 'rgba(26,58,31,0.3)',
              fontFamily: T.fontHead, fontStyle: 'italic',
              cursor: text.trim() ? 'pointer' : 'default',
            }}>
            {t('soltar.saveReflection')}
          </button>
        </div>
      </div>

      <aside className="space-y-5">
        <StatsBlock t={t} stage={stage} />
        <div className="p-4 rounded-xl text-[12px] leading-relaxed italic"
          style={{ background: T.amberSoft, color: T.ink, fontFamily: T.fontHead }}>
          {t('soltar.reflectionRight')}
        </div>
        <StageTimeline t={t} stages={stages} currentOrder={stage.stage_order} highlightCompletedOrder={stage.stage_order} />
      </aside>

      {showModal && (
        <StageEndModal
          t={t}
          pct={pct}
          onAdvance={onAdvance}
          onRelease={onRelease}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

/* ─── Tela 5: New stage ──────────────────────────────────────────────── */

function NewStageForm({ t, habit, stages, onCancel, onSubmit }) {
  const nextOrder = (stages?.length || 0) + 1
  const lastStage = stages[stages.length - 1]
  const lastPct   = lastStage ? consistency(lastStage) : 0

  const [step, setStep] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate]     = useState(addDaysISO(todayISO(), 20))
  const totalDays = daysBetweenInclusive(startDate, endDate)
  const valid = step.trim() && totalDays > 0

  // Pre-populate the timeline with current stages + a pending one
  const previewStages = [
    ...stages.map(s => ({ stage_order: s.stage_order, step: s.step, completed_at: s.completed_at })),
    { stage_order: nextOrder, step: step || t('soltar.f.stepPh') },
  ]

  async function submit() {
    if (!valid) return
    await onSubmit({ step: step.trim(), start_date: startDate, end_date: endDate, total_days: totalDays })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 mt-4">
      <div className="space-y-6">
        <div>
          <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded-full inline-block"
            style={{ background: T.greenSoft, color: T.green }}>
            {t('soltar.stageN', { n: nextOrder })} · {habit?.name}
          </span>
          <div className="text-[13px] text-[#8B7E6F] mt-3 italic" style={{ fontFamily: T.fontHead }}>
            {t('soltar.prevConsistency', { pct: lastPct })}
          </div>
        </div>

        <Field t={t} label={t('soltar.f.nextStep')} value={step} onChange={setStep} placeholder={t('soltar.f.stepPh')} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.start')}
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">
              {t('soltar.f.end')}
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: T.paper, border: `1px solid ${T.claySoft}` }} />
          </div>
        </div>
        <div className="text-[12px] text-[#8B7E6F] italic" style={{ fontFamily: T.fontHead }}>
          {t('soltar.totalDays', { n: totalDays })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-full text-[13px] text-[#8B7E6F] border transition-all"
            style={{ borderColor: T.clay, fontFamily: T.fontHead, fontStyle: 'italic' }}>
            {t('common.cancel')}
          </button>
          <button onClick={submit} disabled={!valid}
            className="px-5 py-2 rounded-full text-[13px] text-white font-semibold transition-all"
            style={{
              background: valid ? T.green : 'rgba(26,58,31,0.3)',
              cursor: valid ? 'pointer' : 'default',
              fontFamily: T.fontHead, fontStyle: 'italic',
            }}>
            {t('soltar.startStage', { n: nextOrder })}
          </button>
        </div>
      </div>

      <aside>
        <StageTimeline t={t} stages={previewStages} currentOrder={nextOrder} />
      </aside>
    </div>
  )
}

/* ─── Shared: StatsBlock ─────────────────────────────────────────────── */

function StatsBlock({ t, stage }) {
  const marked = markedCount(stage)
  const pct = consistency(stage)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-xl text-center" style={{ background: T.paper, border: `1px solid ${T.claySoft}` }}>
        <div className="text-[10px] uppercase tracking-[0.16em] text-[#8B7E6F]">{t('soltar.daysMarked')}</div>
        <div className="font-display text-[28px] italic mt-1" style={{ color: T.green }}>
          {marked}<span className="text-[#8B7E6F] text-[18px]">/{stage.total_days}</span>
        </div>
      </div>
      <div className="p-3 rounded-xl text-center" style={{ background: T.paper, border: `1px solid ${T.claySoft}` }}>
        <div className="text-[10px] uppercase tracking-[0.16em] text-[#8B7E6F]">{t('soltar.consistency')}</div>
        <div className="font-display text-[28px] italic mt-1" style={{ color: T.amber }}>{pct}%</div>
      </div>
    </div>
  )
}

function PulseChip({ t, pulse }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-2">{t('soltar.f.pulse')}</p>
      <span className="inline-block px-3 py-1 rounded-full text-[12px] font-semibold"
        style={{ background: T.amberSoft, color: T.amber }}>
        {t(`soltar.pulse.${pulse}`)}
      </span>
    </div>
  )
}

function StageTimeline({ t, stages, currentOrder, highlightCompletedOrder }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#8B7E6F] mb-3">{t('soltar.stagesLabel')}</p>
      <ol className="space-y-2.5">
        {stages.map(s => {
          const done = s.completed_at || s.stage_order < currentOrder || s.stage_order === highlightCompletedOrder
          const active = s.stage_order === currentOrder && !s.completed_at
          return (
            <li key={s.stage_order} className="flex items-start gap-3 text-[12px]"
              style={{ color: done ? T.green : active ? T.green : T.inkFaint }}>
              <span className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: 22, height: 22,
                  background: done ? T.amberSoft : active ? T.greenSoft : 'transparent',
                  border: done ? 'none' : active ? `1px solid ${T.green}` : `1px solid ${T.claySoft}`,
                  color: done ? T.amber : active ? T.green : T.inkFaint,
                  fontSize: 10, fontWeight: 700,
                }}>
                {done ? <Check size={11} /> : s.stage_order}
              </span>
              <div className="flex-1 pt-0.5 leading-snug">
                <div className="font-semibold" style={{ color: T.ink, opacity: done || active ? 1 : 0.5 }}>
                  {t('soltar.stageN', { n: s.stage_order })}
                </div>
                <div className="italic text-[11px]" style={{ fontFamily: T.fontHead, color: T.inkFaint }}>
                  {s.step || t('soltar.tbd')}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ─── Modal: stage-end decision ──────────────────────────────────────── */

function StageEndModal({ t, pct, onAdvance, onRelease, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40, 32, 22, 0.32)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-7 rounded-t-2xl md:rounded-2xl md:mb-auto md:mt-auto"
        style={{
          background: T.paper, fontFamily: T.fontBody,
          boxShadow: '0 -8px 32px rgba(60,45,20,0.18)',
          alignSelf: 'center',
        }}
      >
        <div className="flex justify-center mb-3">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 48, height: 48, background: T.amberSoft, color: T.amber }}>
            <Leaf size={22} />
          </div>
        </div>
        <h3 className="font-display italic text-[26px] text-center text-[#2D2A26] mb-1">{t('soltar.modalTitle')}</h3>
        <p className="text-center text-[13px] text-[#8B7E6F] mb-6 italic" style={{ fontFamily: T.fontHead }}>
          {t('soltar.modalSubtitle', { pct })}
        </p>
        <div className="flex flex-col gap-2.5">
          <button onClick={onAdvance}
            className="w-full px-4 py-3 rounded-full text-[13px] text-white font-semibold transition-all"
            style={{ background: T.green, fontFamily: T.fontHead, fontStyle: 'italic' }}>
            {t('soltar.modalAdvance')}
          </button>
          <button onClick={onRelease}
            className="w-full px-4 py-3 rounded-full text-[13px] font-semibold transition-all"
            style={{
              background: 'transparent', border: `1px solid ${T.amber}`,
              color: T.amber, fontFamily: T.fontHead, fontStyle: 'italic',
            }}>
            {t('soltar.modalRelease')}
          </button>
        </div>
      </div>
    </div>
  )
}
