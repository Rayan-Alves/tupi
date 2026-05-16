import { Link } from 'react-router-dom'

const LAST_UPDATED = 'May 15, 2026'
const CONTACT = 'staff@apptupi.com'

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="font-display text-xl text-[#1B3A5C] mb-3">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-zinc-600">{children}</div>
  </section>
)

const MailLink = () => (
  <a href={`mailto:${CONTACT}`} className="text-[#8B5A2B] underline underline-offset-2">
    {CONTACT}
  </a>
)

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-12">
          <Link to="/login">
            <img src="/tupi-logo.png" alt="TUPI" className="w-28 h-auto mb-10 opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
          <h1 className="font-display text-4xl text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-400 font-mono">Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="Who we are">
          <p>
            Tupi is a personal journaling and life-management app. The service is operated by
            Tupi, reachable at <MailLink />.
          </p>
          <p>
            This policy explains what data we collect, why, and what rights you have over it.
          </p>
        </Section>

        <Section title="What we collect">
          <p><strong className="text-zinc-800">Account data</strong> — your email address and the password you choose (stored as a secure hash, never in plain text).</p>
          <p><strong className="text-zinc-800">Content you create</strong> — journal entries, notes, goals, routines, book annotations, and anything else you write inside the app. This content belongs to you.</p>
          <p><strong className="text-zinc-800">Usage data</strong> — basic session information (login timestamps, device type) used to keep the service running securely. We do not track behavior or build profiles.</p>
        </Section>

        <Section title="How we use your data">
          <p>We use your data exclusively to provide and improve the Tupi service. We do not sell it, share it with advertisers, or use it for any purpose unrelated to running the app for you.</p>
        </Section>

        <Section title="Where your data lives">
          <p>
            Your data is stored in a PostgreSQL database managed by{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5A2B] underline underline-offset-2">Supabase</a>,
            hosted on AWS infrastructure. The app itself is served via{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5A2B] underline underline-offset-2">Vercel</a>.
            Both providers maintain industry-standard security practices.
          </p>
          <p>No other third parties have access to your personal data.</p>
        </Section>

        <Section title="Your rights (GDPR & similar)">
          <p>Wherever you are located, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong className="text-zinc-700">Access</strong> — request a copy of the data we hold about you.</li>
            <li><strong className="text-zinc-700">Correction</strong> — ask us to fix inaccurate information.</li>
            <li><strong className="text-zinc-700">Deletion</strong> — ask us to permanently delete your account and all associated content.</li>
            <li><strong className="text-zinc-700">Portability</strong> — request your data in a machine-readable format.</li>
            <li><strong className="text-zinc-700">Objection</strong> — object to how we process your data.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <MailLink />. We will respond within 30 days.
          </p>
        </Section>

        <Section title="Data retention">
          <p>We keep your data for as long as your account is active. If you request deletion, we remove all personal data within 30 days, except where retention is required by law.</p>
        </Section>

        <Section title="Cookies">
          <p>Tupi uses only the cookies necessary to keep you signed in. We do not use advertising or tracking cookies.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>If we make material changes, we will notify you by email or by a notice inside the app before the changes take effect.</p>
        </Section>

        <div className="mt-14 pt-8 border-t border-zinc-200">
          <p className="text-sm text-zinc-400 font-mono">
            Questions? <MailLink />
          </p>
          <Link to="/login" className="inline-block mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Back to Tupi
          </Link>
        </div>

      </div>
    </div>
  )
}
