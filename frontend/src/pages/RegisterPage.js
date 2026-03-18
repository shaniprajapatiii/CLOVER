import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const PLATFORMS = ['zomato', 'swiggy', 'amazon', 'flipkart', 'zepto', 'blinkit', 'dunzo', 'other'];
const SEGMENTS = [
  { value: 'food', label: 'Food Delivery', platforms: ['zomato', 'swiggy'], icon: '🍕' },
  { value: 'ecommerce', label: 'E-Commerce', platforms: ['amazon', 'flipkart'], icon: '📦' },
  { value: 'grocery_qcommerce', label: 'Grocery / Q-Commerce', platforms: ['zepto', 'blinkit', 'dunzo'], icon: '🛒' },
];
const VEHICLES = [
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'scooter', label: 'Scooter', icon: '🛵' },
  { value: 'electric_scooter', label: 'Electric Scooter', icon: '⚡' },
  { value: 'car', label: 'Car', icon: '🚗' },
];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Other'];
const STEPS = ['Personal Info', 'Work Details', 'Earnings', 'Review'];

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <React.Fragment key={i}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300
          ${i < current ? 'bg-brand-500 text-white' : i === current ? 'bg-brand-500/20 text-brand-400 border-2 border-brand-500' : 'bg-dark-700 text-gray-500 border border-dark-500'}`}>
          {i < current ? '✓' : i + 1}
        </div>
        {i < total - 1 && <div className={`flex-1 h-px transition-all duration-500 ${i < current ? 'bg-brand-500' : 'bg-dark-600'}`} />}
      </React.Fragment>
    ))}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore(s => s.login);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    platform: '', deliverySegment: '', vehicleType: '', city: '',
    averageWeeklyEarnings: 3500, averageDailyHours: 8, workingDaysPerWeek: 6, experienceMonths: 12,
    referralCode: ''
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      loginStore(res.data.worker, res.data.token);
      toast.success('Welcome to GigShield! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const steps = [
    // Step 0: Personal Info
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
        <input className="input-field" placeholder="Ravi Kumar" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number *</label>
        <input type="tel" className="input-field" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email (optional)</label>
        <input type="email" className="input-field" placeholder="ravi@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
        <input type="password" className="input-field" placeholder="Create a strong password" value={form.password} onChange={e => set('password', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Referral Code (optional)</label>
        <input className="input-field" placeholder="e.g. GS7X9A" value={form.referralCode} onChange={e => set('referralCode', e.target.value.toUpperCase())} />
      </div>
    </div>,

    // Step 1: Work Details
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Delivery Segment *</label>
        <div className="grid grid-cols-3 gap-3">
          {SEGMENTS.map(s => (
            <button key={s.value} type="button" onClick={() => set('deliverySegment', s.value)}
              className={`p-3 rounded-xl border text-center transition-all duration-200 ${form.deliverySegment === s.value ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-dark-500 bg-dark-700 text-gray-400 hover:border-dark-400'}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Platform *</label>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORMS.map(p => (
            <button key={p} type="button" onClick={() => set('platform', p)}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${form.platform === p ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-dark-500 bg-dark-700 text-gray-400 hover:border-dark-400'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Vehicle Type *</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {VEHICLES.map(v => (
            <button key={v.value} type="button" onClick={() => set('vehicleType', v.value)}
              className={`p-2 rounded-xl border text-center transition-all ${form.vehicleType === v.value ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-dark-500 bg-dark-700 text-gray-400 hover:border-dark-400'}`}>
              <div className="text-xl mb-1">{v.icon}</div>
              <div className="text-xs">{v.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
        <select className="input-field" value={form.city} onChange={e => set('city', e.target.value)}>
          <option value="">Select your city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>,

    // Step 2: Earnings Profile
    <div className="space-y-5">
      <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl text-sm text-brand-300">
        💡 This information helps us calculate your <strong>personalized premium</strong> and ensures you're fully covered.
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Average Weekly Earnings (₹)</label>
        <input type="number" className="input-field" value={form.averageWeeklyEarnings} onChange={e => set('averageWeeklyEarnings', parseInt(e.target.value))} min={500} max={20000} />
        <p className="text-xs text-gray-500 mt-1">Your typical weekly take-home from deliveries</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Daily Working Hours: <span className="text-brand-400">{form.averageDailyHours}h</span></label>
        <input type="range" min={2} max={16} value={form.averageDailyHours} onChange={e => set('averageDailyHours', parseInt(e.target.value))}
          className="w-full accent-brand-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Working Days/Week: <span className="text-brand-400">{form.workingDaysPerWeek} days</span></label>
        <input type="range" min={1} max={7} value={form.workingDaysPerWeek} onChange={e => set('workingDaysPerWeek', parseInt(e.target.value))}
          className="w-full accent-brand-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Experience: <span className="text-brand-400">{form.experienceMonths} months</span></label>
        <input type="range" min={0} max={60} value={form.experienceMonths} onChange={e => set('experienceMonths', parseInt(e.target.value))}
          className="w-full accent-brand-500" />
      </div>
    </div>,

    // Step 3: Review
    <div className="space-y-4">
      <div className="p-4 bg-dark-700 rounded-xl space-y-3 text-sm">
        {[
          ['Name', form.name], ['Phone', form.phone], ['Platform', form.platform],
          ['Segment', form.deliverySegment], ['Vehicle', form.vehicleType], ['City', form.city],
          ['Weekly Earnings', `₹${form.averageWeeklyEarnings}`], ['Experience', `${form.experienceMonths} months`]
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-400">{k}</span>
            <span className="text-white font-medium capitalize">{v || '—'}</span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl text-sm text-brand-300">
        By creating an account, you agree to our Terms of Service. Coverage is for income loss only — not health, life, accident, or vehicle damage.
      </div>
    </div>
  ];

  const canProceed = [
    form.name && form.phone && form.password,
    form.platform && form.deliverySegment && form.vehicleType && form.city,
    form.averageWeeklyEarnings > 0,
    true
  ][step];

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-20 w-64 h-64 bg-brand-500/6 rounded-full blur-3xl" />
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center font-bold">G</div>
            <span className="font-display text-2xl font-bold text-white">GigShield</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <div className="card">
          <StepIndicator current={step} total={STEPS.length} />
          {steps[step]}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button" className="btn-secondary flex-1" onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn-primary flex-1" disabled={!canProceed} onClick={() => setStep(s => s + 1)}>
                Continue →
              </button>
            ) : (
              <button type="button" className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create Account & Get Protected →'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
