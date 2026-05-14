import { useTranslation } from 'react-i18next'

const SMART_ITEMS = [
  {
    key: 'smart_specific',
    letter: 'S',
    title: 'Específico',
    question: 'O que exatamente será realizado?',
    placeholder: 'Descreva o objetivo com precisão — quanto mais concreto, mais alcançável.',
    color: '#4A0E8F',
    bg: '#F5F0FF',
    border: '#DDD0F5',
  },
  {
    key: 'smart_measurable',
    letter: 'M',
    title: 'Mensurável',
    question: 'Como você saberá que alcançou? Quais métricas ou KPIs?',
    placeholder: 'Ex: receita de R$150k, 500 clientes, NPS ≥ 70, 10 publicações…',
    color: '#1B3A5C',
    bg: '#EBF3FB',
    border: '#BDD5EF',
  },
  {
    key: 'smart_attainable',
    letter: 'A',
    title: 'Alcançável',
    question: 'É realista? Quais recursos e condições você tem?',
    placeholder: 'Ex: equipe de 3 pessoas, budget de R$10k, parceiro X disponível…',
    color: '#1A3A1F',
    bg: '#EDF3EE',
    border: '#B8D9BC',
  },
  {
    key: 'smart_relevant',
    letter: 'R',
    title: 'Relevante',
    question: 'Por que isso importa agora? Como se alinha à sua visão?',
    placeholder: 'Ex: fortalece minha presença no mercado digital, alinha com o propósito de…',
    color: '#5A3A00',
    bg: '#FEFBE8',
    border: '#EDD98A',
  },
]

const inputStyle = {
  width: '100%', border: 'none', background: 'transparent',
  fontSize: '13px', color: '#1a1a1a', padding: '4px 0',
  outline: 'none', resize: 'none', lineHeight: 1.7,
  fontFamily: "Georgia, serif", boxSizing: 'border-box',
}

export function isSmartComplete(form) {
  return !!(form.smart_specific && form.smart_measurable && form.smart_attainable && form.smart_relevant)
}

export default function SmartTab({ form, onUpdate }) {
  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Intro */}
      <div style={{ marginBottom: 24, padding: '12px 16px', background: '#FAFAF8', borderRadius: 12, border: '1px solid #EBEBEB' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 4 }}>
          Metodologia SMART
        </div>
        <p style={{ fontSize: 12, color: '#71717a', margin: 0, lineHeight: 1.6 }}>
          Objetivos bem definidos têm 2× mais chance de serem alcançados.
          Preencha os 4 campos para ativar o badge <strong style={{ color: '#15803d' }}>SMART ✓</strong> no seu projeto.
        </p>
      </div>

      {SMART_ITEMS.map(item => (
        <div key={item.key} style={{ marginBottom: 20, borderRadius: 14, border: `1px solid ${item.border}`, background: item.bg, overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 8px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: item.color,
              color: '#fff', fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {item.letter}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color, letterSpacing: '0.04em' }}>{item.title}</div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{item.question}</div>
            </div>
            {form[item.key] && (
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#15803d' }}>✓</div>
            )}
          </div>
          {/* Input */}
          <div style={{ padding: '0 14px 12px' }}>
            <textarea
              value={form[item.key] || ''}
              onChange={e => onUpdate(item.key, e.target.value)}
              placeholder={item.placeholder}
              rows={3}
              style={{ ...inputStyle, borderBottom: `1px solid ${item.border}` }}
            />
          </div>
        </div>
      ))}

      {/* T = Time-bound reminder */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#15803d', color: '#fff', fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          T
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Tempo definido</div>
          <div style={{ fontSize: 11, color: '#4ade80', marginTop: 1 }}>
            Coberto pelas datas de início e entrega — defina-as na aba Semente.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#15803d' }}>✓</div>
      </div>
    </div>
  )
}
