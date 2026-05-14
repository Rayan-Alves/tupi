import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, User, Wind } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ARCH_RADIUS = '50% 50% 20px 20px / 28% 28% 20px 20px'

function ArchCard({ chapter, chapterLabel, title, description, color, soft, count, locked, lockedLabel, ctaLabel, entriesLabel, icon: Icon, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={locked}
      style={{
        background: `linear-gradient(180deg, ${soft} 0%, ${soft}66 24%, #ffffff 56%)`,
        border: `1px solid ${soft}88`,
        borderRadius: ARCH_RADIUS,
        transform: hover && !locked ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover && !locked ? `0 16px 40px ${color}22` : `0 1px 4px rgba(0,0,0,0.04)`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.85 : 1,
      }}
      className="relative w-full text-left p-8 pt-10 flex flex-col items-center font-sans"
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full mb-7"
        style={{
          width: 48, height: 48,
          background: `${soft}AA`,
          border: `1px solid ${color}33`,
        }}
      >
        <Icon size={20} style={{ color }} strokeWidth={1.5} />
      </div>

      {/* Chapter label */}
      <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-3">
        {chapter} / {chapterLabel}
      </div>

      {/* Title */}
      <div className="font-display text-[40px] font-medium text-zinc-900 leading-none mb-5" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </div>

      {/* Divider with color dot */}
      <div className="relative w-full mb-8">
        <div className="h-px w-full" style={{ background: `${color}33` }} />
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 10, height: 10, background: color }}
        />
      </div>

      {/* Description */}
      <p className="text-center text-[13px] leading-relaxed text-zinc-700 mb-8 px-2">
        {description}
      </p>

      {/* Footer: count + CTA, or locked pill */}
      {locked ? (
        <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border border-zinc-300 rounded-full px-3 py-1.5">
          {lockedLabel}
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full px-2">
          <span className="text-[11px] font-semibold tabular-nums whitespace-nowrap" style={{ color: count > 0 ? color : '#a1a1aa' }}>
            {count > 0 ? `${count} ${entriesLabel}` : '—'}
          </span>
          <div className="flex-1 h-px" style={{ background: `${color}33` }} />
          <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-700 whitespace-nowrap">
            {ctaLabel} →
          </span>
        </div>
      )}
    </button>
  )
}

export default function IdentitySection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pastCount, setPastCount] = useState(0)
  const [presentCount, setPresentCount] = useState(0)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('past_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('present_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([past, present]) => {
      setPastCount(past.count || 0)
      setPresentCount(present.count || 0)
    })
  }, [user?.id])

  return (
    <section>
      {/* Section header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 font-sans">Chapter One</span>
          <div className="h-px flex-1 bg-zinc-300 max-w-[280px]" />
        </div>
        <h2 className="font-display text-[56px] font-medium text-zinc-900 leading-none mb-3" style={{ letterSpacing: '-0.02em' }}>
          Identity
        </h2>
        <p className="text-[14px] text-zinc-600 font-sans">
          Three doorways into who you are, where you've been, and where you're going.
        </p>
      </div>

      {/* Three arch cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ArchCard
          chapter="01"
          chapterLabel="Looking back"
          title="Past"
          description="The moments and people that shaped the person you are becoming."
          color="#B8703A"
          soft="#F0DCC8"
          count={pastCount}
          entriesLabel={pastCount === 1 ? 'entry' : 'entries'}
          ctaLabel={pastCount > 0 ? 'Open' : 'Enter'}
          icon={Clock}
          onClick={() => navigate('/passado')}
        />
        <ArchCard
          chapter="02"
          chapterLabel="Right now"
          title="Who I am"
          description="The values, beliefs and patterns that make up your present self."
          color="#6E6EB5"
          soft="#DFDFF0"
          count={presentCount}
          entriesLabel={presentCount === 1 ? 'entry' : 'entries'}
          ctaLabel={presentCount > 0 ? 'Open' : 'Enter'}
          icon={User}
          onClick={() => navigate('/presente')}
        />
        <ArchCard
          chapter="03"
          chapterLabel="What's next"
          title="Life unfolding"
          description="A space for the life you are still imagining into being."
          color="#5A8F6A"
          soft="#DCEBDF"
          locked
          lockedLabel="Locked · Coming soon"
          icon={Wind}
        />
      </div>
    </section>
  )
}
