import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function MentalPatternTab({ table = 'mental_patterns', label = 'PADRÃO MENTAL', createPath = '/padrao-mental', onAdd, onSelect, onDelete }) {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPatterns(data); setLoading(false) })
  }, [user?.id, table])

  async function handleDelete(e, id) {
    e.stopPropagation()
    e.preventDefault()
    await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
    setPatterns(p => p.filter(x => x.id !== id))
    onDelete?.(id)
  }

  if (loading) return null

  const S = {
    root: { fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
    hdr:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' },
    lbl:  { fontSize:'11px', letterSpacing:'0.18em', color:'#a1a1aa' },
    btn:  { width:'44px', height:'44px', borderRadius:'14px', background:'#2D3F5A', color:'white',
            border:'none', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0, lineHeight:1, textDecoration:'none' },
    empty:{ fontSize:'13px', color:'#a1a1aa', fontStyle:'italic', padding:'3rem 0', textAlign:'center' },
    card: { border:'0.5px solid #C4A882', borderRadius:'16px', overflow:'hidden', marginBottom:'10px',
            cursor:'pointer', background:'#fff' },
    inner:{ padding:'14px 16px', background:'#FDF6EC' },
    clbl: { fontSize:'10px', letterSpacing:'0.08em', color:'#854F0B', marginBottom:'4px' },
    ctxt: { fontSize:'14px', fontWeight:500, color:'#633806', lineHeight:1.4 },
  }

  return (
    <div style={S.root}>
      <div style={S.hdr}>
        <span style={S.lbl}>{label}</span>
        {onAdd
          ? <button type="button" onClick={onAdd} style={S.btn} aria-label="adicionar">+</button>
          : <a href={createPath} style={S.btn} aria-label="adicionar">+</a>
        }
      </div>
      {patterns.length === 0
        ? <div style={S.empty}>clique em + para trabalhar sua primeira crença</div>
        : patterns.map(p => {
            const cardContent = (
              <div style={S.inner}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={S.clbl}>POLO POSITIVO</div>
                    <div style={S.ctxt}>{p.pos_belief}</div>
                  </div>
                  <button
                    onClick={e => handleDelete(e, p.id)}
                    style={{flexShrink:0,width:'28px',height:'28px',borderRadius:'8px',
                      background:'#fee2e2',border:'none',color:'#ef4444',
                      fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',
                      justifyContent:'center',lineHeight:1,marginTop:'0px',transition:'all .2s'}}
                    onMouseEnter={e => { e.currentTarget.style.background='#fecaca' }}
                    onMouseLeave={e => { e.currentTarget.style.background='#fee2e2' }}
                    aria-label="excluir"
                  >🗑</button>
                </div>
              </div>
            )
            return onSelect
              ? <div key={p.id} onClick={() => onSelect(p.id)} style={{...S.card, cursor:'pointer'}}>{cardContent}</div>
              : <a key={p.id} href={`${createPath}?id=${p.id}`} style={{...S.card, display:'block', textDecoration:'none'}}>{cardContent}</a>
          })
      }
    </div>
  )
}
