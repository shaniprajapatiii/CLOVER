import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, Gift, Heart, MapPin, ShoppingBag, Sparkles, Utensils, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { useEarningsStore } from '../store/useEarningsStore';

const TabButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex-1 rounded-[1.15rem] px-4 py-2.5 text-sm font-bold transition ${
      active ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
    }`}
  >
    {active && <span className="absolute inset-0 rounded-[1.15rem] bg-slate-950" />}
    <span className="relative">{children}</span>
  </button>
);

const StatCard = ({ label, value, hint, icon: IconComp, tone = 'slate' }) => {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900'
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
          {hint && <p className="mt-2 text-sm">{hint}</p>}
        </div>
        {IconComp && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <IconComp size={18} />
          </div>
        )}
      </div>
    </div>
  );
};

export const Earnings = () => {
  const [activeTab, setActiveTab] = useState('today');
  const navigate = useNavigate();
  const { todayEarnings, weeklyEarnings, incentiveTarget, orderHistory, activeTrip } = useEarningsStore();

  const walletBalance = useMemo(() => {
    try {
      const partner = JSON.parse(localStorage.getItem('partnerData') || 'null');
      return Number(partner?.totalEarnings || 0);
    } catch {
      return 0;
    }
  }, []);

  const displayTotal = activeTab === 'today' ? todayEarnings.total : weeklyEarnings.total;
  const completedOrders = activeTab === 'today' ? todayEarnings.completedOrders : Math.max(todayEarnings.completedOrders * 7, 0);
  const loginTime = activeTab === 'today' ? '5h 20m' : '38h 15m';

  const progress = Math.min((incentiveTarget.currentOrders / incentiveTarget.targetOrders) * 100, 100);

  return (
    <div className="public-shell min-h-[100dvh] pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <CloverShellHeader
          title="Earnings dashboard"
          subtitle="Track income, incentives, and completed trips in a clean Clover layout."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Sparkles size={14} /> Live payouts</span>}
          actions={[
            { label: 'Dashboard', onClick: () => navigate('/dashboard'), tone: 'secondary', icon: <MapPin size={14} />, chevron: false },
            { label: 'Profile', onClick: () => navigate('/profile'), tone: 'secondary', icon: <Zap size={14} />, chevron: false }
          ]}
        />

        <section className="mt-4 page-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title">Quick view</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {activeTab === 'today' ? "Today's earnings" : weeklyEarnings.weekRange}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track income, incentives, and delivery activity in one clean card flow.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-[320px]">
              <TabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')}>
                Today
              </TabButton>
              <TabButton active={activeTab === 'week'} onClick={() => setActiveTab('week')}>
                This week
              </TabButton>
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-900 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
              <p className="text-xs uppercase tracking-wider font-bold text-emerald-200">Overview</p>
              <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">₹{displayTotal.toLocaleString('en-IN')}</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                {activeTab === 'today'
                  ? 'Your live earnings for the current day, refreshed with every completed trip.'
                  : weeklyEarnings.status}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-200">Orders</p>
                  <p className="mt-2 text-2xl font-black">{completedOrders}</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-200">Login time</p>
                  <p className="mt-2 text-2xl font-black">{loginTime}</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-200">Mode</p>
                  <p className="mt-2 text-2xl font-black">Partner</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <StatCard
                label="Earning rate"
                value={`₹${activeTab === 'today' ? todayEarnings.basePay : weeklyEarnings.total.toLocaleString('en-IN')}`}
                hint={activeTab === 'today' ? 'Base pay visible on current shift' : 'Weekly total across completed trips'}
                icon={ArrowUpRight}
                tone="emerald"
              />
              <StatCard
                label="Deliveries"
                value={String(completedOrders)}
                hint="Completed in this selected range"
                icon={Clock3}
                tone="cyan"
              />
              <StatCard
                label="Wallet"
                value={`Rs ${walletBalance.toLocaleString('en-IN')}`}
                hint="Cash credited after completed deliveries"
                icon={Sparkles}
                tone="amber"
              />
            </div>
          </motion.div>
        </section>

        {activeTrip && (
          <section className="mt-4 page-card p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-title">Current task</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Accepted order in progress</h3>
                <p className="mt-1 text-sm text-slate-500">The order you accepted is now saved as an active trip preview.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">₹{activeTrip.projectedEarning} projected</span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-emerald-700">Route</p>
                <p className="mt-1 text-lg font-black text-emerald-950">{activeTrip.routeSummary}</p>
                <p className="mt-1 text-sm text-emerald-800">Accepted at {new Date(activeTrip.acceptedAt).toLocaleTimeString()}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-500">Profile sync</p>
                <p className="mt-1 text-sm text-slate-600">This task is also saved to your profile and active delivery screen.</p>
                <button onClick={() => navigate('/active-delivery')} className="btn-primary mt-4 w-full py-3">
                  Show path
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'today' && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="mt-4 page-card p-4 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title">Breakdown</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Today&apos;s payout split</h3>
              </div>
              <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {todayEarnings.completedOrders} orders
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Order pay" value={`₹${todayEarnings.basePay}`} icon={MapPin} tone="slate" />
              <StatCard label="Surge pay" value={`₹${todayEarnings.surge}`} icon={Zap} tone="amber" />
              <StatCard label="Tips" value={`₹${todayEarnings.tips}`} icon={Heart} tone="emerald" />
              <StatCard label="Bonus" value={`₹${todayEarnings.incentives}`} icon={Gift} tone="cyan" />
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="mt-4 page-card p-4 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Milestone</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Daily incentive tracker</h3>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
              {incentiveTarget.currentOrders}/{incentiveTarget.targetOrders}
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <p className="mt-3 text-sm font-semibold text-emerald-700">
            {incentiveTarget.text}
          </p>
        </motion.section>

        <section className="mt-4 page-card p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Recent trips</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Trips and route earnings</h3>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {orderHistory.length} items
            </div>
          </div>

          {orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <MapPin size={56} className="text-slate-300" />
              <p className="mt-4 text-slate-500 font-medium leading-relaxed">
                No deliveries yet today. Go online to start earning.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {orderHistory.map((trip, idx) => (
                <div
                  key={`${trip.id}-${idx}`}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white flex-shrink-0">
                    {trip.type === 'instamart'
                      ? <ShoppingBag size={18} />
                      : <Utensils size={18} />
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-950">{trip.restaurant}</p>
                    <p className="mt-1 text-sm text-slate-500">{trip.time} • {trip.distance}</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-700 sm:justify-end">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em]">Earning</span>
                    <span className="text-lg font-black">₹{trip.earning}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Earnings;
