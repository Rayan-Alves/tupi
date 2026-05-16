import { useState, useRef } from 'react'

const FONT = { fontFamily: "'Courier New', Courier, monospace" }

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { type: 'video-logo' },

  {
    type: 'text',
    paragraphs: [
      'Estou feliz que você tenha resolvido dar esse primeiro passo nessa jornada de autoconhecimento. Sei que não é muito fácil enfrentar a si mesmo, mas com certeza é a melhor forma de dar o próximo passo.',
      'Esse processo de autoescrita é um lindo espiral, assim como tem sido para mim, será para você. Investigar a si e acolher seus sentimentos requer coragem; muitas vezes tocamos em lugares sensíveis, feridas que passam despercebidas, mas ainda estão abertas.',
      'Talvez seja a hora. Essa jornada não tem a intenção de ser a sua solução, mas ela é feita para segurar na tua mão e te orientar até determinado ponto. É feita também para te instigar a continuar se investigando a nível individual e para te incentivar a perceber a si mesmo não só como cidadão desse planeta, mas filho da Mãe Terra.',
      'Quando nos percebemos filhos desse planeta, não estamos só, somos as folhas que caem da árvore, a terra que nutre os alimentos, as abelhas que polinizam as flores, a lua que movimenta as marés, as montanhas que levam sombra, o verão que esquenta a pele em um dia de sol, a água que mata a sede, o abraço de dois amigos inseparáveis, uma troca de mensagens de amor, a implicancia amorosa entre irmãos, o olhar de amor dos nossos país.',
      'O processo de auto-investigação acontece na solitude, mas não é solitário, não mais… Já somos uma rede de pessoas que tiveram a coragem de olhar ao redor e perceber a loucura que estamos vivendo, e que resolveram olhar para dentro ao invés de olhar para fora. Nossa mãe terra, que tanto nos acolhe, está feliz com esse passo, porque ele também significa mais consciência e voz ativa em todas as esferas.',
      'A cura interna reflete a cura externa, e assim, mudamos ao redor.',
    ],
    closing: 'Aprecie o momento.',
  },

  {
    type: 'text',
    paragraphs: [
      'Antes de começar, você topa fazer um exercício de respiração de 3 pontos? Caso sim, dá play no vídeo abaixo.',
    ],
    video: true,
  },

  {
    type: 'text',
    paragraphs: [
      'Nesse primeiro exercício, a ideia é que você escreva o que vier à sua cabeça, sem filtros, sem julgamentos, é só você e o papel. Quantas páginas que quiser, da forma que quiser, você é livre.',
      'Agora você já pode fechar essa tela, se afastar dos dispositivos e escrever. Até o próximo encontro.',
    ],
  },

  { type: 'video-placeholder' },

  { type: 'title', text: 'Espírito' },
  { type: 'question', text: 'O que te trouxe até aqui?' },
  { type: 'question', text: 'O que hoje pesa dentro de você?' },
  { type: 'question', text: 'Como você se sente em relação a si mesmo?' },
  {
    type: 'question',
    text: 'Se você pudesse remover os sentimentos que mais te limitam, quais seriam? O que cada um deles tenta dizer?',
  },
  {
    type: 'question',
    text: 'Ao imaginar essas pedras sendo deixadas para trás, como você se sente?',
  },

  { type: 'title', text: 'Mente' },
  { type: 'question', text: 'Quais pensamentos mais ocupam sua mente atualmente?' },
  { type: 'question', text: 'Eles te aproximam ou te afastam de quem você deseja ser?' },
  {
    type: 'text',
    paragraphs: [
      'Escolha um pensamento que te limita e o investigue profundamente.',
      'Pergunte: "Por quê?"',
      'E continue perguntando até encontrar a raiz.',
      'Muitas vezes, por trás de um pensamento recorrente existem medo, rejeição, trauma, proteção…',
      'Não tenha medo de continuar. Algumas respostas só aparecem quando nos permitimos atravessar o desconforto.',
      'Encontre a raiz e repita para todos os pensamentos que achar necessário.',
    ],
  },

  { type: 'title', text: 'Corpo' },
  { type: 'question', text: 'Quais hábitos você sabe que hoje enfraquecem sua vida?' },
  { type: 'question', text: 'O que faz você continuar repetindo-os?' },
  {
    type: 'text',
    paragraphs: [
      'Seu corpo não é um inimigo. Ele muitas vezes apenas manifesta dores que ainda não foram compreendidas.',
    ],
  },

  { type: 'title', text: 'Uno' },
  {
    type: 'question',
    text: 'Se estivesse verdadeiramente livre — sem medo, culpa ou expectativa —, o que sua alma escolheria viver?',
    last: true,
  },
]

// ── Shared components ─────────────────────────────────────────────────────────

function VideoPlaceholder() {
  return (
    <div className="w-full max-w-xl mx-auto aspect-video bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center my-8">
      <div className="flex flex-col items-center gap-3 text-zinc-400" style={FONT}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-xs tracking-widest uppercase">vídeo</span>
      </div>
    </div>
  )
}

function NextButton({ onClick, label = 'next →' }) {
  return (
    <button
      onClick={onClick}
      style={FONT}
      className="fixed bottom-10 right-10 text-sm tracking-widest uppercase text-zinc-900 hover:text-black font-bold transition-colors"
    >
      {label}
    </button>
  )
}

// ── Step renderers ────────────────────────────────────────────────────────────

const PROFUNDO_CSS = `
.jornada-profundo {
  min-height: 100vh;
  background: radial-gradient(120% 90% at 50% 45%, oklch(0.22 0.03 155) 0%, oklch(0.18 0.025 155) 50%, oklch(0.11 0.02 155) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  gap: 56px;
}
.j-portal {
  --size: 380px;
  position: relative;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  border: none; background: transparent; padding: 0;
  cursor: pointer; display: grid; place-items: center;
  isolation: isolate;
  transition: transform 600ms cubic-bezier(.22,1,.36,1);
  -webkit-tap-highlight-color: transparent;
}
.j-portal:active { transform: scale(0.97); }
.j-portal:focus-visible { outline: 2px solid oklch(0.78 0.14 145); outline-offset: 14px; }
.j-portal .j-logo {
  position: relative; z-index: 3;
  width: 86%; height: 86%;
  object-fit: contain;
  pointer-events: none;
  filter:
    drop-shadow(0 0 18px color-mix(in oklch, oklch(0.78 0.14 145) 55%, transparent))
    drop-shadow(0 0 4px color-mix(in oklch, oklch(0.78 0.14 145) 80%, transparent))
    brightness(1.35) contrast(1.05);
  transition: filter 600ms ease, transform 1.2s cubic-bezier(.22,1,.36,1);
}
.j-portal:hover .j-logo {
  filter:
    drop-shadow(0 0 26px color-mix(in oklch, oklch(0.78 0.14 145) 75%, transparent))
    drop-shadow(0 0 8px color-mix(in oklch, oklch(0.78 0.14 145) 90%, transparent))
    brightness(1.5) contrast(1.05);
}
.j-glow {
  position: absolute; inset: -2%;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.78 0.14 145) 60%, transparent) 0%, transparent 60%);
  filter: blur(28px);
  opacity: 0.45;
  z-index: 1;
  animation: j-pulse 5s ease-in-out infinite;
}
.j-glow-2 {
  inset: 12%;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.78 0.14 145) 80%, transparent) 0%, transparent 65%);
  filter: blur(12px);
  opacity: 0.55;
  animation-delay: -1.5s;
}
.j-mote {
  position: absolute;
  left: 50%; top: 50%;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: oklch(0.78 0.14 145);
  box-shadow: 0 0 6px oklch(0.78 0.14 145), 0 0 14px color-mix(in oklch, oklch(0.78 0.14 145) 70%, transparent);
  transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y)));
  opacity: 0;
  z-index: 4;
  animation: j-mote-drift var(--d) ease-in-out infinite;
  animation-delay: var(--delay);
}
.j-caption {
  text-align: center;
  color: color-mix(in oklch, oklch(0.78 0.14 145) 70%, transparent);
}
.j-caption-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: -0.005em;
  font-style: italic;
  margin: 0 0 10px;
  color: color-mix(in oklch, oklch(0.78 0.14 145) 85%, white);
}
.j-caption-sub {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px;
  font-style: italic;
  letter-spacing: 0.03em;
  color: color-mix(in oklch, oklch(0.78 0.14 145) 55%, transparent);
}

@keyframes j-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.98); }
  50%      { opacity: 0.7;  transform: scale(1.04); }
}
@keyframes j-mote-drift {
  0%, 100% { opacity: 0; transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.6); }
  40%, 60% { opacity: 0.9; }
  50%      { transform: translate(calc(-50% + var(--x) * 1.18), calc(-50% + var(--y) * 1.18)) scale(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  .j-glow, .j-mote { animation: none; }
}
@media (max-width: 640px) {
  .j-portal { --size: 280px; }
  .j-caption-title { font-size: 28px; }
}
`

function injectProfundoStyles() {
  const id = 'jornada-profundo-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = PROFUNDO_CSS
    document.head.appendChild(el)
  }
}

function StepVideoLogo({ onNext }) {
  const motes = Array.from({ length: 14 })
  useState(() => { injectProfundoStyles() })
  if (typeof document !== 'undefined') injectProfundoStyles()
  return (
    <div className="jornada-profundo">
      <button className="j-portal" onClick={onNext} aria-label="adentrar">
        <span className="j-glow" aria-hidden="true" />
        <span className="j-glow j-glow-2" aria-hidden="true" />
        {motes.map((_, i) => (
          <span
            key={i}
            className="j-mote"
            style={{
              '--d': `${4 + (i % 5)}s`,
              '--x': `${Math.cos((i / motes.length) * Math.PI * 2) * (110 + (i % 4) * 14)}px`,
              '--y': `${Math.sin((i / motes.length) * Math.PI * 2) * (110 + (i % 4) * 14)}px`,
              '--delay': `${-i * 0.4}s`,
            }}
          />
        ))}
        <img src="/tupi-logo.png" alt="" className="j-logo" draggable="false" />
      </button>
      <div className="j-caption">
        <div className="j-caption-title">adentrar</div>
        <div className="j-caption-sub">a mata respira</div>
      </div>
    </div>
  )
}

function StepText({ step, onNext, isLast }) {
  return (
    <div className="min-h-screen bg-white px-12 py-20 flex justify-center" style={FONT}>
      <div className="max-w-2xl w-full space-y-5 text-[15px] leading-relaxed text-zinc-900">
        {step.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {step.closing && <p className="italic">{step.closing}</p>}
        {step.video && <VideoPlaceholder />}
      </div>
      <NextButton onClick={onNext} label={isLast ? 'fechar' : 'next →'} />
    </div>
  )
}

function StepTitle({ step, onNext }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center" style={FONT}>
      <div className="text-center space-y-4">
        <div className="w-12 h-px bg-zinc-300 mx-auto" />
        <h2 className="text-5xl font-bold tracking-widest text-zinc-900 uppercase">{step.text}</h2>
        <div className="w-12 h-px bg-zinc-300 mx-auto" />
      </div>
      <NextButton onClick={onNext} />
    </div>
  )
}

function StepQuestion({ step, onNext, isLast }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-12" style={FONT}>
      <p className="max-w-xl text-center text-[20px] leading-relaxed text-zinc-900">
        {step.text}
      </p>
      <NextButton onClick={onNext} label={isLast ? 'fechar' : 'next →'} />
    </div>
  )
}

function StepVideoPlaceholder({ onNext, isLast }) {
  return (
    <div className="min-h-screen bg-white px-12 py-20 flex justify-center" style={FONT}>
      <div className="max-w-2xl w-full">
        <VideoPlaceholder />
      </div>
      <NextButton onClick={onNext} label={isLast ? 'fechar' : 'next →'} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Jornada() {
  const [step, setStep] = useState(0)

  function next() {
    if (step >= STEPS.length - 1) { window.close(); return }
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  if (current.type === 'video-logo')       return <StepVideoLogo onNext={next} />
  if (current.type === 'title')            return <StepTitle step={current} onNext={next} />
  if (current.type === 'question')         return <StepQuestion step={current} onNext={next} isLast={isLast} />
  if (current.type === 'video-placeholder') return <StepVideoPlaceholder onNext={next} isLast={isLast} />
  if (current.type === 'text')             return <StepText step={current} onNext={next} isLast={isLast} />

  return null
}
