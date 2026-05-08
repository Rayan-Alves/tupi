import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Save } from 'lucide-react'
import { useWeek, getCurrentWeekPeriod, navigateWeek, formatWeekLabel } from '../../hooks/useWeek'

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

export default function WeekTab() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(() => getCurrentWeekPeriod())
  const { profile, saveProfileField, tasks, addTask, updateTask, deleteTask, loading } = useWeek(period)

  return (
    <div className="space-y-6">
      {/* Period nav */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-zinc-100 shadow-card px-5 py-3">
        <button onClick={() => setPeriod(p => navigateWeek(p, -1))} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-zinc-700">{formatWeekLabel(period)}</span>
        <button onClick={() => setPeriod(p => navigateWeek(p, 1))} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
      </div>

      {/* Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
          <label className="field-label">{t('dashboard.week.howStart')}</label>
          <SaveableTextarea initialValue={profile.how_start} onSave={v => saveProfileField('how_start', v)} placeholder={t('dashboard.week.howStartPlaceholder')} />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5 border-l-4 border-l-spirit">
          <label className="field-label">{t('dashboard.week.howEnd')}</label>
          <SaveableTextarea initialValue={profile.how_end} onSave={v => saveProfileField('how_end', v)} placeholder={t('dashboard.week.howEndPlaceholder')} />
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-700">{t('dashboard.week.tasks')}</h3>
          <button onClick={addTask} className="btn-ghost text-[12px]"><Plus size={13} />{t('common.add')}</button>
        </div>
        {loading ? <p className="text-sm text-zinc-400">{t('common.loading')}</p>
          : tasks.length === 0 ? <p className="text-sm text-zinc-400 py-2">{t('dashboard.week.noTasks')}</p>
          : (
            <ul className="space-y-2">
              {tasks.map(task => (
                <li key={task.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => updateTask(task.id, 'completed', !task.completed)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-spirit border-spirit' : 'border-zinc-300 hover:border-[#3a6490]'}`}
                  >
                    {task.completed && <Check size={9} className="text-white" />}
                  </button>
                  <input
                    value={task.title}
                    onChange={e => updateTask(task.id, 'title', e.target.value)}
                    placeholder={t('dashboard.week.taskPlaceholder')}
                    className={`flex-1 bg-transparent text-sm border-0 focus:ring-0 p-0 placeholder-zinc-400 ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}`}
                  />
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  )
}
