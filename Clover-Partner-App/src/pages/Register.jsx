import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, AlertCircle, User, Bike, MapPin, ShieldCheck } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { authService } from '../services/authService';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    vehicleType: 'two-wheeler',
    referralCode: ''
  });

  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
  }, [phone, navigate]);

  const isValid = useMemo(() => {
    return (
      formData.firstName.trim().length > 1 &&
      formData.lastName.trim().length > 1 &&
      /^\S+@\S+\.\S+$/.test(formData.email) &&
      formData.city.trim().length > 1 &&
      agreeTerms
    );
  }, [formData, agreeTerms]);

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Please fill all required details and accept terms.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.registerPartner({
        phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        city: formData.city,
        vehicleType: formData.vehicleType,
        referralCode: formData.referralCode
      });

      const worker = result?.worker || result;
      const workerId = worker?._id || result?._id;

      if (workerId) {
        localStorage.setItem('partnerId', workerId);
      }
      localStorage.setItem('partnerData', JSON.stringify(worker || {}));

      setSuccess('Account created. Complete your detailed profile from Profile section.');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell p-4 sm:p-6 min-h-screen overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl pb-4">
        <CloverShellHeader
          title="Create partner account"
          subtitle="Add the basics now and finish the full profile later from your Clover dashboard."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><ShieldCheck size={14} /> Onboarding</span>}
          actions={[
            { label: 'Login', onClick: () => navigate('/login'), tone: 'secondary', icon: <User size={14} />, chevron: false },
            { label: 'Home', onClick: () => navigate('/'), tone: 'secondary', icon: <MapPin size={14} />, chevron: false }
          ]}
          navItems={[
            { label: 'Home', to: '/' },
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' }
          ]}
        />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="section-title">Partner onboarding</p>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Step 1 of 2
            </span>
          </div>
          <p className="section-title">Clover partner</p>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">Create Your Partner Account</h1>
          <p className="text-slate-600 mt-2 leading-7">
            Start with basic details. You can add full KYC, bank, and document information later in Profile.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wider font-bold text-blue-700">Registered phone</p>
              <p className="mt-2 text-sm font-bold text-blue-900">+91 {phone}</p>
            </div>
            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Why this form</p>
              <p className="mt-2 text-sm font-medium text-slate-700">Just the basics now, full profile later.</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-[1.35rem] flex gap-2">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-[1.35rem] flex gap-2">
              <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name">
                <input
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Rahul"
                  className="field-input"
                />
              </Field>
              <Field label="Last name">
                <input
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Sharma"
                  className="field-input"
                />
              </Field>
            </div>

            <Field label="Email address">
              <input
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@example.com"
                className="field-input"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City">
                <input
                  value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Ahmedabad"
                  className="field-input"
                />
              </Field>
              <Field label="Vehicle type">
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData((p) => ({ ...p, vehicleType: e.target.value }))}
                  className="field-input"
                >
                  <option value="two-wheeler">Two Wheeler</option>
                  <option value="three-wheeler">Three Wheeler</option>
                  <option value="four-wheeler">Four Wheeler</option>
                </select>
              </Field>
            </div>

            <Field label="Referral code" hint="Optional">
              <input
                value={formData.referralCode}
                onChange={(e) => setFormData((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                placeholder="PARTNER10"
                className="field-input"
              />
            </Field>

            <label className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I agree to CLOVER Partner terms and privacy policy.</span>
            </label>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="btn-primary w-full py-3 rounded-[1.35rem] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Continue to Dashboard'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              Already verified?
              <button type="button" onClick={() => navigate('/login')} className="font-bold text-blue-600 hover:text-blue-700">
                Go to login
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="page-card p-8 sm:p-10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white shadow-2xl"
        >
          <h2 className="text-3xl font-black tracking-tight">What You Get</h2>
          <p className="text-base leading-7 text-white font-medium mt-4">Built for real delivery partners, inspired by top apps.</p>

          <div className="mt-8 space-y-3">
            <Feature icon={User} title="Fast Onboarding" desc="Start with basics in under 2 minutes." />
            <Feature icon={Bike} title="Duty Mode" desc="Go online/offline and manage active deliveries." />
            <Feature icon={MapPin} title="Live Tracking" desc="Real-time map, path tracking, and order pins." />
            <Feature icon={ShieldCheck} title="Profile Completion" desc="Add KYC, bank details, and documents in Profile." />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Feature = ({ icon: IconComp, title, desc }) => {
  return (
    <div className="rounded-xl bg-white/12 border border-white/25 p-5 flex gap-3 backdrop-blur-sm hover:bg-white/16 transition">
      <div className="w-11 h-11 rounded-lg bg-cyan-400/30 text-cyan-50 flex items-center justify-center flex-shrink-0 shadow-lg">
        <IconComp size={20} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-base text-white">{title}</p>
        <p className="text-slate-50 text-sm mt-1.5 leading-5">{desc}</p>
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label className="field-label">{label}</label>
      {hint && <span className="text-xs text-slate-400 font-medium">{hint}</span>}
    </div>
    {children}
  </div>
);
