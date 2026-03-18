// ===== WEATHER PAGE =====
import React, { useEffect, useState } from 'react';
import { weatherAPI } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  low: 'badge-green', moderate: 'badge-yellow', high: 'badge-red', extreme: { bg: 'bg-red-600', text: 'text-white' }
};

export function WeatherPage() {
  const { worker } = useAuthStore();
  const [weather, setWeather] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(worker?.city || 'Mumbai');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, evRes] = await Promise.all([
        weatherAPI.getCurrent(city),
        weatherAPI.getEvents({ city, active: 'true', limit: 20 })
      ]);
      setWeather(wRes.data);
      setEvents(evRes.data.events || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [city]);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Weather Alerts</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time disruption monitoring across Indian cities</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <button key={c} onClick={() => setCity(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${city === c ? 'bg-brand-500 text-white' : 'bg-dark-700 text-gray-400 hover:text-white border border-dark-500'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? <div className="card h-48 skeleton" /> : weather && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-display text-lg font-bold text-white mb-4">Current Conditions — {city}</h2>
            <div className="flex items-center gap-6 mb-6">
              <div className="text-6xl">{weather.weather?.temp >= 42 ? '🔥' : weather.weather?.rainfall > 64 ? '🌧️' : weather.weather?.aqi > 300 ? '😷' : weather.weather?.windSpeed > 50 ? '🌀' : '☀️'}</div>
              <div>
                <p className="font-display text-5xl font-bold text-white">{Math.round(weather.weather?.temp || 0)}°C</p>
                <p className="text-gray-400 capitalize">{weather.weather?.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Humidity', v: `${weather.weather?.humidity || 0}%`, warn: weather.weather?.humidity > 85 },
                { l: 'Rainfall', v: `${weather.weather?.rainfall || 0}mm/hr`, warn: weather.weather?.rainfall > 64 },
                { l: 'AQI Index', v: weather.weather?.aqi || 0, warn: weather.weather?.aqi > 300 },
                { l: 'Wind Speed', v: `${Math.round(weather.weather?.windSpeed || 0)} km/h`, warn: weather.weather?.windSpeed > 50 },
              ].map(({ l, v, warn }) => (
                <div key={l} className={`p-3 rounded-xl text-center ${warn ? 'bg-red-500/15 border border-red-500/30' : 'bg-dark-700'}`}>
                  <p className="text-gray-400 text-xs">{l}</p>
                  <p className={`font-bold text-sm ${warn ? 'text-red-400' : 'text-white'}`}>{v}</p>
                  {warn && <p className="text-red-400 text-xs mt-0.5">⚠️ Alert</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-bold text-white mb-4">Active Triggers</h2>
            {weather.triggers?.length > 0 ? (
              <div className="space-y-3">
                {weather.triggers.map((t, i) => (
                  <div key={i} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-red-300 font-semibold capitalize">{t.type?.replace(/_/g,' ')}</p>
                      <span className="badge-red text-xs">{t.severity}</span>
                    </div>
                    <p className="text-red-400/70 text-xs mt-1">Claim may be auto-triggered for eligible workers in {city}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-400 text-sm">No active triggers in {city}</p>
                <p className="text-gray-600 text-xs mt-1">Conditions are within normal range</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event History */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-white mb-4">Recent Weather Events — {city}</h2>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No events recorded for this city</div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev._id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                <div className="text-2xl">{ev.eventType?.includes('heat') ? '🔥' : ev.eventType?.includes('rain') ? '🌧️' : ev.eventType?.includes('pollution') ? '😷' : ev.eventType?.includes('flood') ? '🌊' : '⚠️'}</div>
                <div className="flex-1">
                  <p className="text-white font-medium capitalize">{ev.eventType?.replace(/_/g,' ')}</p>
                  <p className="text-gray-500 text-xs">{new Date(ev.startTime).toLocaleString('en-IN')} · {ev.claimsTriggered} claims triggered</p>
                </div>
                <span className={`badge text-xs ${ev.severity === 'extreme' ? 'badge-red' : ev.severity === 'high' ? 'badge-orange' : ev.severity === 'moderate' ? 'badge-yellow' : 'badge-green'}`}>{ev.severity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== NOTIFICATIONS PAGE =====
import { notificationAPI } from '../services/api';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 50 });
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const TYPE_ICONS = { claim_triggered: '⚡', claim_approved: '✅', claim_rejected: '❌', claim_paid: '💰', policy_created: '🛡️', policy_expiring: '⏰', policy_renewed: '🔄', weather_alert: '🌩️', fraud_alert: '🚨', general: '📢' };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && <p className="text-gray-400 text-sm mt-1">{unreadCount} unread notifications</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm py-2">Mark All Read</button>
        )}
      </div>

      {loading ? [...Array(5)].map((_, i) => <div key={i} className="card h-16 skeleton" />) :
        notifications.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n._id} className={`card flex items-start gap-3 cursor-pointer transition-all ${!n.isRead ? 'border-brand-500/30 bg-brand-500/5' : ''}`}
                onClick={() => notificationAPI.markRead(n._id)}>
                <div className="text-2xl mt-0.5">{TYPE_ICONS[n.type] || '📢'}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${n.isRead ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5">{n.message}</p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ===== PROFILE PAGE =====
import { authAPI } from '../services/api';

export function ProfilePage() {
  const { worker, updateWorker } = useAuthStore();
  const [form, setForm] = useState({ name: worker?.name || '', email: worker?.email || '', upiId: worker?.upiId || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateWorker(res.data.worker);
      toast.success('Profile updated!');
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-slide-in max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar Card */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-2xl">
          {worker?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-white text-lg">{worker?.name}</p>
          <p className="text-gray-400 text-sm">{worker?.phone} · {worker?.city}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-xs ${worker?.isKycVerified ? 'badge-green' : 'badge-yellow'}`}>
              {worker?.isKycVerified ? '✓ KYC Verified' : '⏳ KYC Pending'}
            </span>
            <span className={`badge text-xs ${worker?.riskCategory === 'low' ? 'badge-green' : worker?.riskCategory === 'high' ? 'badge-red' : 'badge-yellow'}`}>
              {worker?.riskCategory} risk
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-lg font-bold text-white mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">UPI ID (for payouts)</label>
            <input className="input-field" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[['Platform', worker?.platform], ['City', worker?.city], ['Vehicle', worker?.vehicleType], ['Segment', worker?.deliverySegment]].map(([l, v]) => (
              <div key={l} className="bg-dark-700 rounded-xl p-3">
                <p className="text-gray-500 text-xs">{l}</p>
                <p className="text-white font-medium capitalize mt-0.5">{v || '—'}</p>
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== KYC PAGE =====
import { workerAPI } from '../services/api';

export function KycPage() {
  const { worker, updateWorker } = useAuthStore();
  const [form, setForm] = useState({ aadhaarNumber: '', panNumber: '', bankAccountNumber: '', ifscCode: '', upiId: worker?.upiId || '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await workerAPI.submitKyc(form);
      updateWorker({ isKycVerified: true, ...form });
      toast.success('KYC submitted successfully! ✅');
    } catch { } finally { setSubmitting(false); }
  };

  if (worker?.isKycVerified) {
    return (
      <div className="animate-slide-in max-w-lg">
        <h1 className="font-display text-2xl font-bold text-white mb-6">KYC / Documents</h1>
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-display text-xl font-bold text-white mb-2">KYC Verified</h2>
          <p className="text-gray-400">Your identity and bank details have been verified. You're eligible for all payouts.</p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>Aadhaar: ••••••••{worker.aadhaarNumber?.slice(-4) || '****'}</p>
            <p>UPI: {worker.upiId || 'Not set'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-gray-400 text-sm mt-1">Required to receive claim payouts</p>
      </div>
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-300">
        ⚠️ Complete KYC to unlock instant payouts. Without KYC, approved claims will be held.
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Aadhaar Number *</label>
            <input className="input-field font-mono" placeholder="1234 5678 9012" maxLength={12}
              value={form.aadhaarNumber} onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">PAN Number</label>
            <input className="input-field font-mono uppercase" placeholder="ABCDE1234F" maxLength={10}
              value={form.panNumber} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Bank Account Number</label>
            <input className="input-field font-mono" placeholder="Account number"
              value={form.bankAccountNumber} onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">IFSC Code</label>
            <input className="input-field font-mono uppercase" placeholder="SBIN0001234"
              value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">UPI ID (preferred payout method)</label>
            <input className="input-field" placeholder="name@upi or phone@paytm"
              value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
          </div>
          <p className="text-gray-500 text-xs">🔒 Your data is encrypted and stored securely. We never share it with third parties.</p>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit KYC →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== REFERRAL PAGE =====
export function ReferralPage() {
  const { worker } = useAuthStore();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workerAPI.getReferrals().then(res => {
      setReferrals(res.data.referrals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(worker?.referralCode || '');
    toast.success('Referral code copied! 📋');
  };

  return (
    <div className="animate-slide-in max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Refer & Earn</h1>
        <p className="text-gray-400 text-sm mt-1">Earn 100 loyalty points for every friend you refer</p>
      </div>

      <div className="card bg-gradient-to-br from-brand-500/15 to-brand-600/5 border-brand-500/30">
        <div className="text-center">
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Your Referral Code</h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="font-mono text-3xl font-bold gradient-text tracking-widest">{worker?.referralCode}</div>
            <button onClick={copyCode} className="btn-secondary text-sm py-2 px-3">Copy</button>
          </div>
          <p className="text-gray-400 text-sm mt-4">Share this code with fellow delivery partners. They get 5% off their first premium, you get 100 points!</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Friends Referred', value: worker?.referralCount || 0, icon: '👥' },
          { label: 'Points Earned', value: (worker?.referralCount || 0) * 100, icon: '⭐' },
          { label: 'Discount Earned', value: `₹${((worker?.referralCount || 0) * 100 * 0.1).toFixed(0)}`, icon: '💸' }
        ].map(({ label, value, icon }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl mb-1">{icon}</div>
            <p className="font-display text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {referrals.length > 0 && (
        <div className="card">
          <h2 className="font-display text-lg font-bold text-white mb-4">Your Referrals</h2>
          <div className="space-y-2">
            {referrals.map(r => (
              <div key={r._id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm">{r.name?.[0]}</div>
                <div>
                  <p className="text-white text-sm font-medium">{r.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{r.platform} · {r.city}</p>
                </div>
                <span className="ml-auto badge-green text-xs">+100 pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
