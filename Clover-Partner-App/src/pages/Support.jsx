import { useNavigate } from 'react-router-dom';
import { Clock3, Headphones, MessageCircleMore, PhoneCall, ShieldCheck, Sparkles, TriangleAlert, Mail, FileQuestion } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';

const supportCards = [
  {
    icon: PhoneCall,
    title: 'Urgent delivery help',
    description: 'For route breaks, customer reachability issues, or active delivery escalation.',
    action: '+91 1800 200 7001',
    href: 'tel:+9118002007001',
    tone: 'emerald'
  },
  {
    icon: Mail,
    title: 'Email support',
    description: 'For account changes, payout follow-ups, and non-urgent partner requests.',
    action: 'support@cloverpartner.app',
    href: 'mailto:support@cloverpartner.app',
    tone: 'blue'
  },
  {
    icon: MessageCircleMore,
    title: 'Chat with operations',
    description: 'Use live chat for quick updates while you are online or on an active trip.',
    action: 'Open partner chat',
    href: '#faq',
    tone: 'amber'
  }
];

const faqItems = [
  {
    question: 'How do I contact support during a live delivery?',
    answer: 'Use the urgent delivery help number at the top of this page or the support button inside your profile section.'
  },
  {
    question: 'Where do I update bank and KYC issues?',
    answer: 'Open Profile and edit the payout, document, and safety sections. Support can help if a document is rejected.'
  },
  {
    question: 'What if I cannot complete proof of delivery?',
    answer: 'Use the Proof of Delivery screen to recapture the photo or signature. If the camera or GPS is blocked, contact support right away.'
  }
];

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <div className="public-shell min-h-[100dvh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-none">
        <CloverShellHeader
          title="Support center"
          subtitle="Find help for live deliveries, payouts, onboarding, and account issues in one Clover workspace."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Headphones size={14} /> Partner help</span>}
          actions={[
            { label: 'Dashboard', onClick: () => navigate('/dashboard'), tone: 'secondary', icon: <Sparkles size={14} />, chevron: false },
            { label: 'Profile', onClick: () => navigate('/profile'), tone: 'secondary', icon: <ShieldCheck size={14} />, chevron: false }
          ]}
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="page-card p-5 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="section-title">Help channels</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Talk to Clover support</h2>
                <p className="mt-1 text-sm text-slate-500">Pick the channel that matches the urgency of your issue.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <Clock3 size={14} /> 24/7 partner ops
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {supportCards.map((item) => {
                const Icon = item.icon;
                const toneClasses = {
                  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  blue: 'border-blue-200 bg-blue-50 text-blue-900',
                  amber: 'border-amber-200 bg-amber-50 text-amber-900'
                };

                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex gap-4 rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[item.tone]}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-base font-black text-slate-950">{item.title}</h3>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">{item.action}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="page-card p-5 sm:p-6 lg:p-8">
              <p className="section-title">Service status</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">We keep support visible</h2>
              <p className="mt-2 text-sm text-slate-500">For active rides, payouts, and app access problems, support is designed to stay one tap away.</p>

              <div className="mt-4 space-y-3">
                <StatusRow label="Online support" value="Available" tone="green" />
                <StatusRow label="Escalations" value="Priority routing" tone="blue" />
                <StatusRow label="Account safety" value="Verified support only" tone="amber" />
              </div>
            </div>

            <div id="faq" className="page-card p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2">
                <FileQuestion size={18} className="text-emerald-600" />
                <p className="section-title">FAQ</p>
              </div>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Common support questions</h3>

              <div className="mt-4 space-y-3">
                {faqItems.map((item) => (
                  <details key={item.question} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer list-none text-sm font-bold text-slate-950">{item.question}</summary>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] lg:p-8">
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-[0.24em]">
                <TriangleAlert size={14} /> Emergency note
              </div>
              <p className="mt-2 text-lg font-black leading-tight">If you have a safety issue during delivery, contact operations immediately and pause the trip in the app.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const StatusRow = ({ label, value, tone }) => {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800'
  };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-[1.25rem] border px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
};