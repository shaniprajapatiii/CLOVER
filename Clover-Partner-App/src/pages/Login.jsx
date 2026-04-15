import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Sparkles, Wallet, MapPinned, Users } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { authService } from '../services/authService';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGetOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.sendOtp(phone);
      setSuccess('OTP sent successfully!');

      setTimeout(() => {
        navigate('/otp', { state: { phone } });
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="public-shell px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-none pb-4">
        <CloverShellHeader
          title="Partner login"
          subtitle="Sign in with your mobile number to access Clover delivery tools, live orders, and payouts."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Sparkles size={14} /> Fast partner login</span>}
          actions={[
            { label: 'Home', onClick: () => navigate('/'), tone: 'secondary', icon: <MapPinned size={14} />, chevron: false },
            { label: 'Register', onClick: () => navigate('/register'), tone: 'secondary', icon: <Users size={14} />, chevron: false }
          ]}
          navItems={[
            { label: 'Home', to: '/' },
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' }
          ]}
        />
      </div>

      <div className="mx-auto grid w-full max-w-none gap-6 items-stretch lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1.08fr_0.92fr]">
        <div className="page-card p-6 sm:p-8 lg:p-10 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              <Sparkles size={14} /> Fast partner login
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 w-16 h-16 rounded-[1.35rem] flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-3xl">🚚</span>
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Deliver with confidence.</h1>
                <p className="text-slate-600 mt-1">A polished partner portal for live orders, tracking and payouts.</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">OTP login</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">Fast access</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">Partner mode</span>
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <MiniStat icon={Wallet} title="Daily Pay" desc="Track earnings" />
              <MiniStat icon={MapPinned} title="Live Orders" desc="Real-time pickup" />
              <MiniStat icon={Users} title="Support" desc="Partner help" />
            </div>

            {error && (
              <div className="w-full mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-[1.35rem] flex gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="w-full mt-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-[1.35rem] flex gap-2">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{success}</p>
              </div>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleGetOtp();
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="block field-label">Phone number</label>
                  <span className="text-xs font-medium text-slate-400">Use your registered mobile</span>
                </div>
                <div className="flex w-full bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 rounded-[1.35rem] overflow-hidden transition-all duration-300 shadow-sm">
                  <div className="flex items-center justify-center bg-slate-50 px-5 border-r border-slate-200">
                    <span className="text-slate-700 font-bold text-lg tracking-wider">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setPhone(val);
                      if (error) setError('');
                    }}
                    placeholder="9876543210"
                    maxLength="10"
                    className="flex-grow bg-transparent text-slate-900 font-semibold text-xl px-5 py-4 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500">We will send a one-time code to this number.</p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className={`btn-primary w-full py-4 text-lg ${
                  phone.length === 10 && !loading
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Get OTP <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/register', { state: { phone } })}
                className="btn-secondary w-full py-3"
              >
                Create a new account
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure OTP login. No password required.
            </div>
          </div>
        </div>

        <div className="page-card p-6 sm:p-8 lg:p-10">
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white rounded-[1.75rem] p-6 sm:p-8 h-full flex flex-col justify-between overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]" />
            <div className="relative z-10">
              <p className="text-cyan-200 text-sm font-semibold uppercase tracking-[0.18em]">Partner Dashboard</p>
              <h2 className="text-3xl font-black mt-2 leading-tight">Everything a delivery partner needs in one place.</h2>
              <p className="text-slate-200 mt-3 max-w-md">Modern profile, live orders, duty controls, real-time map, and fast payouts.</p>

              <div className="mt-6 space-y-3">
                <FeatureRow icon={ShieldCheck} title="Live tracking" desc="Real-time GPS and order visibility" />
                <FeatureRow icon={MapPinned} title="Full profile section" desc="Complete KYC, bank, vehicle, and emergency details later" />
                <FeatureRow icon={Wallet} title="Partner earnings" desc="Clean cards, completion score, and payout readiness" />
              </div>
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[1.35rem] bg-white/16 border border-white/20 p-4">
                <p className="text-cyan-200 text-xs uppercase tracking-[0.2em]">Fast flow</p>
                <p className="font-bold mt-1">Login → Verify → Go online</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/16 border border-white/20 p-4">
                <p className="text-cyan-200 text-xs uppercase tracking-[0.2em]">Profile</p>
                <p className="font-bold mt-1">Complete details later</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MiniStat = ({ icon: IconComp, title, desc }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
      <IconComp size={18} />
    </div>
    <p className="font-bold text-slate-900">{title}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </div>
);

const FeatureRow = ({ icon: IconComp, title, desc }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-white/16 border border-white/20 p-4">
    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
      <IconComp size={18} />
    </div>
    <div>
      <p className="font-bold">{title}</p>
      <p className="text-sm text-slate-100 mt-1">{desc}</p>
    </div>
  </div>
);