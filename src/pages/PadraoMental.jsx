import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CSS = `
html,body{overflow-x:hidden}
.pm*{box-sizing:border-box;margin:0;padding:0}
.pm-page{min-height:100vh;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --gd:#1A3A1F;--amb:#C8841A;--clay:#C4A882;--neb:#F5F0E8;--navy:#2D3F5A}
.pm-inner{max-width:680px;margin:0 auto;padding:1.5rem 1.25rem 5rem}
.pm-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.pm-title{font-size:13px;color:#52525b;font-weight:500}
.pm-back{display:flex;align-items:center;gap:4px;font-size:12px;color:#52525b;background:none;
  border:0.5px solid #d4d4d8;border-radius:20px;padding:5px 14px;cursor:pointer;
  font-family:inherit;transition:all .2s}
.pm-back:hover{background:#e4e4e7}
.pm-quote{border-left:2px solid var(--clay);padding:10px 14px;margin-bottom:1.5rem;
  background:rgba(255,255,255,0.55);border-radius:0 10px 10px 0}
.pm-qt{font-size:11.5px;color:#52525b;line-height:1.8;font-style:italic}
.pm-qs{font-size:11px;color:#a1a1aa;margin-top:5px}
.pm-prev{margin-bottom:1.25rem}
.pm-prev-lbl{font-size:11px;color:#a1a1aa;margin-bottom:8px;letter-spacing:0.06em}
.pm-prev-item{border:0.5px solid var(--clay);border-radius:10px;overflow:hidden;margin-bottom:8px}
.pm-prev-poles{display:flex}
.pm-pneg{flex:1;padding:8px 10px;background:#EDF3EE;border-right:0.5px solid var(--clay)}
.pm-ppos{flex:1;padding:8px 10px;background:#FDF6EC}
.pm-plbl{font-size:9px;letter-spacing:0.08em;color:#a1a1aa;margin-bottom:2px}
.pm-ptxt{font-size:11px;font-weight:500;line-height:1.3;color:#1a1a1a}
.pm-banner{background:#FAEEDA;border:0.5px solid #EDCF9A;border-radius:10px;padding:8px 12px;
  margin-bottom:1rem;font-size:12px;color:#633806;display:none;align-items:center;gap:6px}
.pm-banner.on{display:flex}
.pm-pol{border:0.5px solid var(--clay);border-radius:16px;overflow:hidden;background:#fff}
.pm-sides{display:flex;flex-direction:row;min-height:300px}
.pm-side{flex:1;display:flex !important;flex-direction:column !important;position:relative;min-width:0}
.pm-phdr{padding:8px 12px;display:flex;align-items:flex-start;gap:8px;flex-shrink:0}
.pm-phdr-pos{background:#FDF6EC;border-bottom:0.5px solid #EDCF9A}
.pm-phdr-neg{background:#EDF3EE;border-bottom:0.5px solid #C4D9C7}
.pm-sign{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:13px;font-weight:500;flex-shrink:0;margin-top:1px}
.pm-sp{background:#FDE8C0;color:#633806}
.pm-sn{background:#C4D9C7;color:#1A3A1F}
.pm-hta{flex:1;font-size:12px;font-family:inherit;background:transparent;border:none;outline:none;
  resize:none;line-height:1.5;padding:0;min-height:18px}
.pm-hta-neg{color:#1A3A1F;font-weight:500}
.pm-hta-neg::placeholder{color:#8AAB8E;font-weight:400}
.pm-hta-pos{color:#633806;font-weight:500}
.pm-hta-pos::placeholder{color:#C4A882;font-weight:400}
.pm-hta:disabled{opacity:0.4;cursor:not-allowed}
.pm-pbody{padding:10px 12px;display:flex;flex-direction:column;gap:8px;flex:1}
.pm-fw{display:flex;flex-direction:column;gap:3px;opacity:0;transform:translateY(5px);
  transition:opacity .3s,transform .3s;pointer-events:none}
.pm-fw.on{opacity:1;transform:translateY(0);pointer-events:auto}
.pm-fl{font-size:10px;letter-spacing:0.05em}
.pm-fl-neg{color:#3B6D11}
.pm-fl-pos{color:#854F0B}
.pm-fta{width:100%;font-size:12px;font-family:inherit;color:#1a1a1a;background:transparent;
  border:none;border-bottom:0.5px solid var(--clay);outline:none;resize:none;
  line-height:1.5;padding:2px 0;transition:border-color .2s}
.pm-fta:focus{border-bottom-color:var(--amb)}
.pm-div{width:1px;background:#C4A882;flex-shrink:0;position:relative;
  display:flex !important;align-items:center;justify-content:center}
.pm-divc{width:18px;height:18px;border-radius:50%;background:#fff;border:0.5px solid var(--clay);
  position:absolute;font-size:9px;color:var(--clay);display:flex;align-items:center;
  justify-content:center;z-index:2}
.pm-lock{position:absolute;inset:0;background:rgba(245,240,232,0.9);display:flex;
  flex-direction:column;align-items:center;justify-content:center;gap:5px;
  transition:opacity .35s,transform .35s;z-index:5}
.pm-lock.off{opacity:0;pointer-events:none;transform:scale(0.97)}
.pm-lcklbl{font-size:11px;color:#a1a1aa;text-align:center;padding:0 10px;line-height:1.5}
.pm-saverow{padding:12px 14px;border-top:0.5px solid var(--clay);display:flex;
  justify-content:flex-end;opacity:0;transition:opacity .4s;pointer-events:none;background:#fff}
.pm-saverow.on{opacity:1;pointer-events:auto}
.pm-savebtn{background:var(--gd);color:white;border:none;border-radius:20px;padding:7px 20px;
  font-size:12px;font-family:inherit;cursor:pointer;transition:all .2s;letter-spacing:0.04em}
.pm-savebtn:hover{background:#2A5A34}
.pm-sv{border:0.5px solid var(--clay);border-radius:16px;overflow:hidden;background:#fff;position:relative}
.pm-sv:hover .pm-sv-edit{opacity:1}
.pm-sv-edit{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;
  background:#fff;border:0.5px solid var(--clay);display:flex;align-items:center;
  justify-content:center;cursor:pointer;opacity:0;transition:opacity .2s;z-index:10;
  font-size:14px;color:#52525b}
.pm-sv-edit:hover{background:var(--neb);border-color:var(--amb);color:var(--amb)}
.pm-sv-poles{display:flex;cursor:pointer}
.pm-sv-poles:hover .pm-sv-neg,.pm-sv-poles:hover .pm-sv-pos{filter:brightness(0.97)}
.pm-sv-neg{flex:1;padding:14px;background:#EDF3EE;border-right:0.5px solid var(--clay)}
.pm-sv-pos{flex:1;padding:14px 36px 14px 14px;background:#FDF6EC}
.pm-sv-plbl{font-size:10px;letter-spacing:0.08em;color:#a1a1aa;margin-bottom:4px}
.pm-sv-ptxt{font-size:13px;font-weight:500;line-height:1.4}
.pm-sv-neg .pm-sv-ptxt{color:#1A3A1F}
.pm-sv-pos .pm-sv-ptxt{color:#633806}
.pm-sv-hint{font-size:11px;color:#a1a1aa;text-align:center;padding:6px;
  border-top:0.5px solid var(--clay);background:#fff}
.pm-sv-expand{max-height:0;overflow:hidden;transition:max-height .45s ease}
.pm-sv-expand.open{max-height:800px}
.pm-sv-ei{padding:14px;display:flex;gap:14px;border-top:0.5px solid var(--clay)}
.pm-sv-col{flex:1;min-width:0}
.pm-sv-ct{font-size:10px;letter-spacing:0.08em;font-weight:500;margin-bottom:8px;
  padding-bottom:6px;border-bottom:0.5px solid var(--clay)}
.pm-sv-cn .pm-sv-ct{color:#1A3A1F}
.pm-sv-cp .pm-sv-ct{color:#633806}
.pm-sv-f{margin-bottom:8px}
.pm-sv-fl{font-size:10px;color:#a1a1aa;letter-spacing:0.04em;margin-bottom:2px}
.pm-sv-fv{font-size:12px;color:#1a1a1a;line-height:1.5}
.pm-sv-title{font-size:14px;font-weight:500;color:#1a1a1a;margin-bottom:1.25rem}
`

function toB(p) {
  return {
    id: p.id,
    neg: { belief:p.neg_belief||'', causes:p.neg_causes||'', feeling:p.neg_feeling||'', result:p.neg_result||'' },
    pos: { action:p.pos_action||'', feeling:p.pos_feeling||'', impact:p.pos_impact||'', belief:p.pos_belief||'' },
  }
}
function toFlat(b) {
  return {
    neg_belief:b.neg.belief, neg_causes:b.neg.causes, neg_feeling:b.neg.feeling, neg_result:b.neg.result,
    pos_action:b.pos.action, pos_feeling:b.pos.feeling, pos_impact:b.pos.impact, pos_belief:b.pos.belief,
  }
}

export default function PadraoMental({ table = 'mental_patterns', onBack, initEditId, embedded = false }) {
  const [params] = useSearchParams()
  const editId = initEditId !== undefined ? initEditId : params.get('id')
  const goBack = () => onBack ? onBack() : (window.location.href = '/mind')
  const { user } = useAuth()

  const [allPatterns, setAllPatterns] = useState([])
  const [view,      setView]      = useState('exercise')  // 'exercise' | 'saved'
  const [editingId, setEditingId] = useState(editId || null)
  const [savedB,    setSavedB]    = useState(null)
  const [form,      setForm]      = useState({ n1:'',n2:'',n3:'',n4:'',p1:'',p2:'',p3:'',p4:'' })
  const [vis,       setVis]       = useState({ nf2:false,nf3:false,nf4:false,pf1:false,pf2:false,pf3:false })
  const [negLocked, setNegLocked] = useState(true)
  const [p4Enabled, setP4Enabled] = useState(false)
  const [showSave,  setShowSave]  = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const ta = useRef({})

  // inject CSS
  useEffect(() => {
    const id = 'pm-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
    return () => document.getElementById(id)?.remove()
  }, [])

  // load all patterns + if editing, populate form
  useEffect(() => {
    if (!user) return
    supabase.from(table).select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setAllPatterns(data)
        if (editId) {
          const p = data.find(x => x.id === editId)
          if (p) {
            const b = toB(p)
            setForm({ n1:b.neg.belief,n2:b.neg.causes,n3:b.neg.feeling,n4:b.neg.result,
                      p1:b.pos.action,p2:b.pos.feeling,p3:b.pos.impact,p4:b.pos.belief })
            setVis({ nf2:true,nf3:true,nf4:true,pf1:true,pf2:true,pf3:true })
            setNegLocked(false); setP4Enabled(true); setShowSave(true)
            setTimeout(() => Object.values(ta.current).forEach(el => {
              if (el) { el.style.height='auto'; el.style.height=el.scrollHeight+'px' }
            }), 80)
          }
        } else {
          setTimeout(() => ta.current['n1']?.focus(), 200)
        }
      })
  }, [user?.id, editId])

  function autoH(id) {
    const el = ta.current[id]; if (!el) return
    el.style.height='auto'; el.style.height=el.scrollHeight+'px'
  }
  function showFw(id) {
    setVis(p => ({ ...p, [id]: true }))
    const map = { nf2:'n2',nf3:'n3',nf4:'n4',pf1:'p1',pf2:'p2',pf3:'p3' }
    const tid = map[id]
    if (tid) setTimeout(() => { const el=ta.current[tid]; if(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';el.focus()} }, 120)
  }
  function chg(key, val) { setForm(p => ({ ...p,[key]:val })); setTimeout(() => autoH(key), 0) }
  function fp(key, onFill) {
    return {
      ref:       el => { ta.current[key]=el },
      value:     form[key],
      onChange:  e => chg(key, e.target.value),
      onBlur:    e => { if(e.target.value.trim()) onFill?.() },
      onKeyDown: e => { if(e.key==='Enter'){e.preventDefault();if(e.target.value.trim())onFill?.()} },
    }
  }
  function onN4() { setNegLocked(false); setTimeout(() => showFw('pf1'), 350) }
  function onP3() {
    setP4Enabled(true)
    setTimeout(() => { const el=ta.current['p4']; if(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';el.focus()} }, 200)
  }

  async function save() {
    const b = {
      id: editingId||null,
      neg: { belief:form.n1.trim(),causes:form.n2.trim(),feeling:form.n3.trim(),result:form.n4.trim() },
      pos: { action:form.p1.trim(),feeling:form.p2.trim(),impact:form.p3.trim(),belief:form.p4.trim() },
    }
    if (!b.pos.belief) return
    const flat = toFlat(b)
    if (editingId) {
      await supabase.from(table).update({ ...flat, updated_at:new Date().toISOString() }).eq('id',editingId).eq('user_id',user.id)
      b.id = editingId
    } else {
      const { data, error } = await supabase.from(table).insert({ user_id:user.id,...flat }).select().single()
      if (!error && data) b.id = data.id
    }
    setSavedB(b); setView('saved')
  }

  const beliefs     = allPatterns.map(toB)
  const prevBeliefs = editingId ? beliefs.filter(b => b.id !== editingId) : beliefs

  function inlineEdit(b) {
    setForm({ n1:b.neg.belief, n2:b.neg.causes, n3:b.neg.feeling, n4:b.neg.result,
               p1:b.pos.action, p2:b.pos.feeling, p3:b.pos.impact, p4:b.pos.belief })
    setVis({ nf2:true, nf3:true, nf4:true, pf1:true, pf2:true, pf3:true })
    setNegLocked(false); setP4Enabled(true); setShowSave(true)
    setEditingId(b.id); setView('exercise')
    setTimeout(() => Object.values(ta.current).forEach(el => {
      if (el) { el.style.height='auto'; el.style.height=el.scrollHeight+'px' }
    }), 80)
  }

  if (view === 'saved' && savedB) {
    const inner = (
      <div className="pm-inner">
        <div className="pm-hdr">
          <span className="pm-sv-title">Crença salva</span>
          <button className="pm-back" onClick={goBack}>← voltar</button>
        </div>
        <div className="pm-sv">
          <button className="pm-sv-edit" aria-label="editar"
            onClick={() => onBack ? inlineEdit(savedB) : (window.location.href='/padrao-mental?id='+savedB.id)}>✎</button>
          <div className="pm-sv-poles" onClick={() => setExpanded(e => !e)}>
            <div className="pm-sv-neg">
              <div className="pm-sv-plbl">POLO NEGATIVO</div>
              <div className="pm-sv-ptxt">{savedB.neg.belief}</div>
            </div>
            <div className="pm-sv-pos">
              <div className="pm-sv-plbl">POLO POSITIVO</div>
              <div className="pm-sv-ptxt">{savedB.pos.belief}</div>
            </div>
          </div>
          <div className="pm-sv-hint">{expanded ? 'toque para fechar' : 'toque para ver o exercício completo'}</div>
          <div className={`pm-sv-expand${expanded?' open':''}`}>
            <div className="pm-sv-ei">
              <div className="pm-sv-col pm-sv-cn">
                <div className="pm-sv-ct">polo negativo</div>
                <div className="pm-sv-f"><div className="pm-sv-fl">crença negativa</div><div className="pm-sv-fv">{savedB.neg.belief}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">o que causa em mim</div><div className="pm-sv-fv">{savedB.neg.causes}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">sentimento que gera</div><div className="pm-sv-fv">{savedB.neg.feeling}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">resultado</div><div className="pm-sv-fv">{savedB.neg.result}</div></div>
              </div>
              <div className="pm-sv-col pm-sv-cp">
                <div className="pm-sv-ct">polo positivo</div>
                <div className="pm-sv-f"><div className="pm-sv-fl">ação que tomaria</div><div className="pm-sv-fv">{savedB.pos.action}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">sentimento positivo</div><div className="pm-sv-fv">{savedB.pos.feeling}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">impacto na vida</div><div className="pm-sv-fv">{savedB.pos.impact}</div></div>
                <div className="pm-sv-f"><div className="pm-sv-fl">crença positiva</div><div className="pm-sv-fv">{savedB.pos.belief}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    if (embedded) return inner
    return <div className="pm-page" style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>{inner}</div>
  }

  const exerciseInner = (
      <div className="pm-inner">
        <div className="pm-hdr">
          <span className="pm-title">{editingId ? 'Editando crença' : 'Nova crença'}</span>
          <button className="pm-back" onClick={goBack}>← voltar</button>
        </div>
        <div className={`pm-banner${editingId ? ' on' : ''}`}>editando crença — salve para atualizar</div>
        <div className="pm-quote">
          <div className="pm-qt">"Tudo é duplo; tudo tem dois pólos; tudo tem o seu par de opostos; o semelhante e o dessemelhante são a mesma coisa; os opostos são idênticos em natureza, mas diferentes em grau; os extremos se tocam; todas as verdades são meias verdades; todos os paradoxos podem ser reconciliados."</div>
          <div className="pm-qs">— O Caibalion</div>
        </div>
        {prevBeliefs.length > 0 && (
          <div className="pm-prev">
            <div className="pm-prev-lbl">crenças anteriores</div>
            {prevBeliefs.map(b => (
              <div key={b.id} className="pm-prev-item">
                <div className="pm-prev-poles">
                  <div className="pm-pneg"><div className="pm-plbl">POLO −</div><div className="pm-ptxt">{b.neg.belief}</div></div>
                  <div className="pm-ppos"><div className="pm-plbl">POLO +</div><div className="pm-ptxt">{b.pos.belief}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pm-pol">
          <div className="pm-sides" style={{display:'flex',flexDirection:'row',minHeight:'300px'}}>
            <div className="pm-side" style={{flex:1,display:'flex',flexDirection:'column',position:'relative',minWidth:0}}>
              <div className="pm-phdr pm-phdr-pos">
                <div className="pm-sign pm-sp">+</div>
                <textarea className="pm-hta pm-hta-pos"
                  ref={el => { ta.current['p4']=el }} value={form.p4} rows={1}
                  placeholder="reescreva em positivo..." disabled={!p4Enabled}
                  onChange={e => { chg('p4', e.target.value); if(e.target.value.trim()) setShowSave(true) }}
                  onBlur={e => { if(e.target.value.trim()) setShowSave(true) }}
                  onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();if(e.target.value.trim()){ setShowSave(true); save() }} }}
                />
              </div>
              <div className="pm-pbody">
                <div className={`pm-fw${vis.pf1?' on':''}`}>
                  <div className="pm-fl pm-fl-pos">qual ação você tomaria se esse pensamento fosse positivo</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('p1',()=>showFw('pf2'))} />
                </div>
                <div className={`pm-fw${vis.pf2?' on':''}`}>
                  <div className="pm-fl pm-fl-pos">qual sentimento positivo essa ação causaria</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('p2',()=>showFw('pf3'))} />
                </div>
                <div className={`pm-fw${vis.pf3?' on':''}`}>
                  <div className="pm-fl pm-fl-pos">qual impacto esses sentimentos teriam na sua vida</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('p3',onP3)} />
                </div>
              </div>
              <div className={`pm-lock${negLocked?'':' off'}`}>
                <span style={{fontSize:'18px',color:'#C4A882'}}>🔒</span>
                <div className="pm-lcklbl">complete o polo negativo primeiro</div>
              </div>
            </div>
            <div className="pm-div" style={{width:'1px',background:'#C4A882',flexShrink:0,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="pm-divc">◎</div></div>
            <div className="pm-side" style={{flex:1,display:'flex',flexDirection:'column',position:'relative',minWidth:0}}>
              <div className="pm-phdr pm-phdr-neg">
                <div className="pm-sign pm-sn">−</div>
                <textarea className="pm-hta pm-hta-neg"
                  ref={el => { ta.current['n1']=el }} value={form.n1} rows={1}
                  placeholder="sua crença ou padrão negativo..."
                  onChange={e => chg('n1', e.target.value)}
                  onBlur={e => { if(e.target.value.trim()) showFw('nf2') }}
                  onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();if(e.target.value.trim())showFw('nf2')} }}
                />
              </div>
              <div className="pm-pbody">
                <div className={`pm-fw${vis.nf2?' on':''}`}>
                  <div className="pm-fl pm-fl-neg">o que esse pensamento causa em mim</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('n2',()=>showFw('nf3'))} />
                </div>
                <div className={`pm-fw${vis.nf3?' on':''}`}>
                  <div className="pm-fl pm-fl-neg">qual sentimento isso gera</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('n3',()=>showFw('nf4'))} />
                </div>
                <div className={`pm-fw${vis.nf4?' on':''}`}>
                  <div className="pm-fl pm-fl-neg">qual o resultado desse sentimento</div>
                  <textarea className="pm-fta" rows={2} placeholder="escreva aqui..." {...fp('n4',onN4)} />
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:'12px 14px',borderTop:'0.5px solid #C4A882',display:'flex',justifyContent:'flex-end',background:'#fff',opacity:showSave?1:0,pointerEvents:showSave?'auto':'none',transition:'opacity .4s'}}>
            <button className="pm-savebtn" onClick={save} style={{background:'#1A3A1F',color:'white',border:'none',borderRadius:'20px',padding:'7px 20px',fontSize:'12px',fontFamily:'inherit',cursor:'pointer',letterSpacing:'0.04em'}}>{editingId?'atualizar crença':'salvar crença'}</button>
          </div>
        </div>
      </div>
  )

  if (embedded) return exerciseInner
  return <div className="pm-page" style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>{exerciseInner}</div>
}
