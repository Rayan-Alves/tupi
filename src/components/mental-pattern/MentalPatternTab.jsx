import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CSS = `
.mp-root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --clay:#C4A882;--amb:#C8841A;--navy:#2D3F5A;--neb:#F5F0E8}
.mp-root *{box-sizing:border-box}
.mp-list-hdr{display:flex !important;align-items:center;justify-content:space-between;margin-bottom:0.75rem}
.mp-list-label{font-size:11px;letter-spacing:0.18em;color:#a1a1aa}
.mp-add{width:44px;height:44px;border-radius:14px;background:var(--navy) !important;color:white !important;border:none !important;
  font-size:24px;cursor:pointer !important;display:flex !important;align-items:center;justify-content:center;
  transition:all .2s;flex-shrink:0;line-height:1;pointer-events:auto !important;position:relative;z-index:10}
.mp-add:hover{background:#1E2D42 !important;transform:scale(0.96)}
.mp-empty{font-size:13px;color:#a1a1aa;font-style:italic;padding:3rem 0;text-align:center}
.mp-card{border:0.5px solid var(--clay);border-radius:16px;overflow:hidden;margin-bottom:10px;
  cursor:pointer;transition:border-color .2s;background:#fff}
.mp-card:hover{border-color:var(--amb)}
.mp-card-inner{padding:14px 16px;background:#FDF6EC}
.mp-card-lbl{font-size:10px;letter-spacing:0.08em;color:#854F0B;margin-bottom:4px}
.mp-card-text{font-size:14px;font-weight:500;color:#633806;line-height:1.4}
`

export default function MentalPatternTab({ table = 'mental_patterns', label = 'PADRÃO MENTAL', createPath = '/padrao-mental' }) {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const id = 'mp-list-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
    return () => document.getElementById(id)?.remove()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPatterns(data); setLoading(false) })
  }, [user?.id, table])

  if (loading) return null

  return (
    <div className="mp-root">
      <div className="mp-list-hdr">
        <span className="mp-list-label">{label}</span>
        <button type="button" className="mp-add" onClick={() => { window.location.href = createPath }} aria-label="adicionar">+</button>
      </div>
      {patterns.length === 0
        ? <div className="mp-empty">clique em + para trabalhar sua primeira crença</div>
        : patterns.map(p => (
            <div key={p.id} className="mp-card" onClick={() => { window.location.href = `${createPath}?id=${p.id}` }}>
              <div className="mp-card-inner">
                <div className="mp-card-lbl">POLO POSITIVO</div>
                <div className="mp-card-text">{p.pos_belief}</div>
              </div>
            </div>
          ))
      }
    </div>
  )
}
