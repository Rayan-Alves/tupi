import { useState } from 'react'

const WEEK_DAYS = [
  { id: 'dom', label: 'D' },
  { id: 'seg', label: 'S' },
  { id: 'ter', label: 'T' },
  { id: 'qua', label: 'Q' },
  { id: 'qui', label: 'Q' },
  { id: 'sex', label: 'S' },
  { id: 'sab', label: 'S' },
]

function parseRecurrence(raw) {
  if (!raw) return { interval: 1, unit: 'week', days: [], endType: 'never', endDate: '', count: 10 }
  try { return JSON.parse(raw) } catch {
    // Legacy strings: 'daily' → day, 'weekly' → week, 'monthly' → month
    const map = { daily: 'day', weekly: 'week', monthly: 'month' }
    return { interval: 1, unit: map[raw] || 'week', days: [], endType: 'never', endDate: '', count: 10 }
  }
}

export function formatRecurrence(raw) {
  if (!raw) return null
  const r = parseRecurrence(raw)
  const units = { day: ['dia', 'dias'], week: ['semana', 'semanas'], month: ['mês', 'meses'] }
  const [sing, plur] = units[r.unit] || ['dia', 'dias']
  let text = `A cada ${r.interval} ${r.interval > 1 ? plur : sing}`
  if (r.unit === 'week' && r.days?.length > 0) {
    const labels = { dom: 'D', seg: 'S', ter: 'T', qua: 'Q', qui: 'Q', sex: 'S', sab: 'S' }
    text += ' · ' + r.days.map(d => WEEK_DAYS.find(w => w.id === d)?.label || d).join(' ')
  }
  if (r.endType === 'count') text += ` · ${r.count}×`
  if (r.endType === 'date' && r.endDate) {
    text += ` · até ${new Date(r.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
  }
  return text
}

export default function RecurrenceModal({ raw, onSave, onClose }) {
  const init = parseRecurrence(raw)
  const [interval, setInterval] = useState(init.interval || 1)
  const [unit, setUnit]         = useState(init.unit || 'week')
  const [days, setDays]         = useState(init.days || [])
  const [endType, setEndType]   = useState(init.endType || 'never')
  const [endDate, setEndDate]   = useState(init.endDate || '')
  const [count, setCount]       = useState(init.count || 10)

  function toggleDay(id) {
    setDays(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  function handleSave() {
    onSave(JSON.stringify({ interval, unit, days, endType, endDate: endType === 'date' ? endDate : '', count: endType === 'count' ? count : 10 }))
    onClose()
  }

  function handleRemove() {
    onSave(null)
    onClose()
  }

  const UNO_PURPLE = '#4A0E8F'
  const fieldStyle = { fontSize: 14, border: '1px solid #e4e4e7', borderRadius: 10, padding: '8px 12px', outline: 'none', background: '#fafafa' }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200, backdropFilter: 'blur(2px)' }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 20, padding: '32px 28px', width: 340, maxWidth: '90vw',
        zIndex: 201, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, color: '#0a0a0a', margin: '0 0 28px', lineHeight: 1.2 }}>
          Recorrência<br />personalizada
        </h2>

        {/* Interval */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 10 }}>Repetir a cada:</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number" min="1" max="99" value={interval}
              onChange={e => setInterval(Math.max(1, +e.target.value))}
              style={{ ...fieldStyle, width: 70, textAlign: 'center', fontWeight: 700 }}
            />
            <select value={unit} onChange={e => { setUnit(e.target.value); setDays([]) }}
              style={{ ...fieldStyle, flex: 1, cursor: 'pointer' }}>
              <option value="day">dia</option>
              <option value="week">semana</option>
              <option value="month">mês</option>
            </select>
          </div>
        </div>

        {/* Days of week (weekly only) */}
        {unit === 'week' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 10 }}>Repetir:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {WEEK_DAYS.map(d => {
                const active = days.includes(d.id)
                return (
                  <button key={d.id} onClick={() => toggleDay(d.id)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: active ? UNO_PURPLE : '#f0f0f0',
                      color: active ? '#fff' : '#71717a',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all .15s',
                    }}>
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* End condition */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>Termina em</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Never */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" checked={endType === 'never'} onChange={() => setEndType('never')}
                style={{ accentColor: UNO_PURPLE, width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 15, color: '#1a1a1a' }}>Nunca</span>
            </label>

            {/* By date */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" checked={endType === 'date'} onChange={() => setEndType('date')}
                style={{ accentColor: UNO_PURPLE, width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 15, color: '#1a1a1a', minWidth: 24 }}>Em</span>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setEndType('date') }}
                style={{ ...fieldStyle, flex: 1, fontSize: 13, color: endType === 'date' ? '#1a1a1a' : '#a1a1aa' }} />
            </label>

            {/* By count */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" checked={endType === 'count'} onChange={() => setEndType('count')}
                style={{ accentColor: UNO_PURPLE, width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 15, color: '#1a1a1a', minWidth: 38 }}>Após</span>
              <input type="number" min="1" max="999" value={count}
                onChange={e => { setCount(Math.max(1, +e.target.value)); setEndType('count') }}
                style={{ ...fieldStyle, width: 60, textAlign: 'center', fontWeight: 700 }} />
              <span style={{ fontSize: 15, color: '#71717a' }}>ocorrências</span>
            </label>

          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          {raw && (
            <button onClick={handleRemove}
              style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 0' }}>
              Remover
            </button>
          )}
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 99, border: 'none', background: 'none', color: UNO_PURPLE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSave}
              style={{ padding: '10px 24px', borderRadius: 99, border: 'none', background: UNO_PURPLE, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3a0a72'}
              onMouseLeave={e => e.currentTarget.style.background = UNO_PURPLE}>
              Concluir
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
