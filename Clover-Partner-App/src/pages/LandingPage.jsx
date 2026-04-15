import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, MapPin, ShieldCheck, Sparkles, Truck, Users, Zap } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';

const highlights = [
  {
    icon: MapPin,
    title: 'Live nearby orders',
    description: 'See delivery requests based on your real location and stay ready for the next pickup.'
  },
  {
    icon: Zap,
    title: 'Fast partner flow',
    description: 'Move from login to active delivery quickly with a simple partner-first workflow.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified profile',
    description: 'Keep payout, vehicle, and KYC details in one secure partner profile.'
  }
];

const stats = [
  { label: 'Live partners', value: '12k+' },
  { label: 'Daily deliveries', value: '48k+' },
  { label: 'Cities supported', value: '180+' }
];

export const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="public-shell relative text-slate-900">
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-none flex-col px-4 py-5 sm:px-6 lg:px-8">
        <CloverShellHeader
          title="Delivery partner portal"
          subtitle="Clover gives partners a polished flow for login, profile completion, live tracking, and delivery operations."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Sparkles size={14} /> Built for real delivery partners</span>}
          actions={[
            { label: 'Login', onClick: () => navigate('/login'), tone: 'secondary', icon: <Users size={14} />, chevron: false },
            { label: 'Join now', onClick: () => navigate('/register'), tone: 'brand', icon: <ArrowRight size={14} />, chevron: false }
          ]}
          navItems={[
            { label: 'Home', to: '/' },
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' }
          ]}
        />

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:py-12 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles size={16} />
              Built for real delivery partners
            </div>

            <div className="max-w-2xl space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                A modern delivery dashboard for every partner on the road.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                CLOVER gives delivery partners a premium workflow for login, profile completion, live map tracking,
                nearby order handling, and future integrations with e-commerce, food, and local commerce apps.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Start as partner
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary"
              >
                Existing partner login
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="page-card p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-emerald-500/10 blur-2xl" />
            <div className="page-card relative overflow-hidden p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Partner view</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">What the app helps you do</h3>
                </div>
                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Live demo</div>
              </div>

              <div className="mt-5 grid gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-950">{item.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-white sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-cyan-200">Partner workflow</p>
                  <p className="mt-2 text-lg font-black tracking-tight">Login, complete profile, go online, receive nearby orders, and start delivery.</p>
                </div>
                <div className="flex items-center justify-center rounded-[1.2rem] bg-white/10 p-4">
                  <Truck size={34} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Ready to begin?</p>
                  <p className="text-xs text-slate-500">Use the login screen or create a new partner account.</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary px-4 py-2.5 text-sm"
                >
                  Enter app
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="pb-2 pt-4 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2"><Users size={14} />Built for delivery partners</span>
            <span className="inline-flex items-center gap-2"><BarChart3 size={14} />Real-time operations</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
