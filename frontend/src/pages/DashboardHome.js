import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, weatherAPI } from '../services/api';
import { useAuthStore } from '../store';
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiCloudRain,
  FiCompass,
  FiDroplet,
  FiFileText,
  FiShield,
  FiSun,
  FiTrendingUp,
  FiUnlock,
  FiWind,
  FiZap,
} from 'react-icons/fi';

const STATUS_COLORS = {
  paid: 'badge-green', approved: 'badge-blue', auto_triggered: 'badge-orange',
  under_review: 'badge-yellow', rejected: 'badge-red', fraud_flagged: 'badge-red', submitted: 'badge-gray'
};

const TRIGGER_ICONS = {
  extreme_heat: FiSun,
  heavy_rain: FiCloudRain,
  flood: FiDroplet,
  severe_pollution: FiActivity,
  curfew: FiAlertTriangle,
  strike: FiCompass,
  platform_outage: FiZap,
  cyclone: FiWind,
  hailstorm: FiCloudRain,
  dense_fog: FiCloudRain,
  cold_wave: FiWind,
};

const getWeatherIcon = (w) => {
  if (!w) return FiSun;
  if (w.temp >= 42) return FiSun;
  if (w.rainfall > 64) return FiCloudRain;
  if (w.aqi > 300) return FiActivity;
  if (w.windSpeed > 50) return FiWind;
  return FiSun;
};

function StatCard({ Icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="card flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 flex items-center justify-center shrink-0">
        <Icon className="text-xl" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { worker } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes] = await Promise.all([analyticsAPI.getDashboard()]);
        setDashboard(dashRes.data.dashboard);
        if (worker?.city) {
          try {
            const wRes = await weatherAPI.getCurrent(worker.city);
            setWeather(wRes.data);
          } catch { }
        }
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [worker]);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-24 skeleton" />)}
    </div>
  );

  const policy = dashboard?.policy;
  const claimStats = dashboard?.claimStats || {};
  const recentClaims = dashboard?.recentClaims || [];
  const alerts = dashboard?.weatherAlerts || [];
  const daysUntilExpiry = policy ? Math.ceil((new Date(policy.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="page-container animate-slide-in">
      {/* Welcome Banner */}
      <div className="section-head">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="section-chip mb-3">Live Protection Snapshot</span>
            <h1 className="font-display text-2xl font-bold text-white">
              नमस्ते, {worker?.name?.split(' ')[0]}
            </h1>
            <p className="text-gray-400 mt-1">
              {policy ? `Your ${policy.planName} is active · ${daysUntilExpiry} days remaining` : 'You are not currently covered. Get protected now.'}
            </p>
          </div>
          {!policy && (
            <Link to="/dashboard/policy" className="btn-primary text-sm shrink-0">Get Protected Now →</Link>
          )}
          {policy && daysUntilExpiry <= 2 && (
            <Link to="/dashboard/policy" className="btn-primary text-sm shrink-0">Renew Now →</Link>
          )}
        </div>
      </div>

      {/* Weather Alert Banner */}
      {alerts.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <FiAlertTriangle className="text-xl text-red-300 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">Active Weather Alert in {worker?.city}</p>
            <p className="text-red-400/70 text-xs mt-0.5">{alerts[0].eventType?.replace(/_/g,' ')} — {alerts[0].severity} severity detected. Your claim may be auto-triggered.</p>
          </div>
          <Link to="/dashboard/weather" className="ml-auto text-xs text-red-300 hover:text-red-200 whitespace-nowrap">View →</Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard Icon={FiShield} label="Coverage Amount" value={policy ? `₹${policy.coverageAmount.toLocaleString()}` : '—'} sub={policy ? `₹${policy.weeklyPremium}/week` : 'No active policy'} color="text-brand-300" />
        <StatCard Icon={FiZap} label="Total Paid Out" value={`₹${(dashboard?.totalPaid || 0).toLocaleString()}`} sub={`${dashboard?.totalClaims || 0} total claims`} color="text-cyan-300" />
        <StatCard Icon={FiTrendingUp} label="Approval Rate" value={`${dashboard?.approvalRate || 0}%`} sub="Claims approved" color="text-blue-300" />
        <StatCard Icon={FiAward} label="Loyalty Points" value={worker?.loyaltyPoints || 0} sub={`${worker?.streakWeeks || 0} week streak`} color="text-amber-300" />
      </div>

      {/* Policy Card + Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Details */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Active Policy</h2>
            <Link to="/dashboard/policy" className="text-brand-400 text-sm hover:text-brand-300">Manage →</Link>
          </div>
          {policy ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-300"><FiShield className="text-2xl" /></div>
                <div>
                  <p className="font-bold text-white">{policy.planName}</p>
                  <p className="text-gray-400 text-sm">{policy.policyNumber}</p>
                </div>
                <span className="ml-auto badge-green">Active</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { l: 'Coverage', v: `₹${policy.coverageAmount?.toLocaleString()}` },
                  { l: 'Premium', v: `₹${policy.weeklyPremium}/wk` },
                  { l: 'Expires', v: new Date(policy.endDate).toLocaleDateString('en-IN') },
                  { l: 'Triggers', v: `${policy.coverageTriggers?.length || 0} events` }
                ].map(({ l, v }) => (
                  <div key={l} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">{l}</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              {/* Progress bar days remaining */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Week Coverage</span>
                  <span>{daysUntilExpiry} days left</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, (daysUntilExpiry / 7) * 100))}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-3 text-brand-300 flex items-center justify-center"><FiUnlock className="text-3xl" /></div>
              <p className="text-gray-400 mb-4">You're not currently covered</p>
              <Link to="/dashboard/policy" className="btn-primary text-sm">Buy a Policy Now</Link>
            </div>
          )}
        </div>

        {/* Risk Score */}
        <div className="card">
          <h2 className="font-display text-lg font-bold text-white mb-4">Risk Profile</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a26" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={worker?.riskCategory === 'low' ? '#1d8fff' : worker?.riskCategory === 'high' ? '#ef4444' : '#f59e0b'}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${(worker?.riskScore || 0.5) * 314} 314`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-white">{Math.round((worker?.riskScore || 0.5) * 100)}</span>
                <span className="text-gray-400 text-xs capitalize">{worker?.riskCategory}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 text-center">Risk score determines your premium. Lower score = lower premium.</p>
            <div className="mt-4 w-full space-y-2">
              {(worker?.riskFactors || []).slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 capitalize">{f.factor?.replace(/_/g, ' ')}</span>
                  <span className={f.weight > 0 ? 'text-red-400' : 'text-green-400'}>{f.weight > 0 ? '+' : ''}{(f.weight * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Claims + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Claims */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Recent Claims</h2>
            <Link to="/dashboard/claims" className="text-brand-400 text-sm hover:text-brand-300">View All →</Link>
          </div>
          {recentClaims.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No claims yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClaims.map(claim => (
                <div key={claim._id} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-xl">
                  {(() => {
                    const TriggerIcon = TRIGGER_ICONS[claim.triggerType] || FiFileText;
                    return <TriggerIcon className="text-lg text-brand-300" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium capitalize">{claim.triggerType?.replace(/_/g,' ')}</p>
                    <p className="text-gray-500 text-xs">{new Date(claim.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    {claim.approvedAmount > 0 && <p className="text-green-400 font-semibold text-sm">₹{claim.approvedAmount}</p>}
                    <span className={STATUS_COLORS[claim.status] || 'badge-gray'}>{claim.status?.replace(/_/g,' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Weather */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Weather in {worker?.city}</h2>
            <Link to="/dashboard/weather" className="text-brand-400 text-sm hover:text-brand-300">Details →</Link>
          </div>
          {weather ? (
            <div className="space-y-4">
              {(() => {
                const WeatherIcon = getWeatherIcon(weather.weather);
                return (
              <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300">
                  <WeatherIcon className="text-4xl" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{Math.round(weather.weather?.temp || 0)}°C</p>
                  <p className="text-gray-400 text-sm capitalize">{weather.weather?.description}</p>
                </div>
              </div>
                );
              })()}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">Humidity</p>
                  <p className="font-bold text-white">{weather.weather?.humidity}%</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">AQI</p>
                  <p className={`font-bold ${weather.weather?.aqi > 300 ? 'text-red-400' : weather.weather?.aqi > 150 ? 'text-yellow-400' : 'text-cyan-300'}`}>{weather.weather?.aqi}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">Wind</p>
                  <p className="font-bold text-white">{Math.round(weather.weather?.windSpeed || 0)} km/h</p>
                </div>
              </div>
              {weather.triggers?.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm">
                  <p className="text-red-300 font-medium inline-flex items-center gap-2"><FiAlertTriangle /> {weather.triggers.length} trigger(s) active — claims may be triggered automatically</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">Weather data unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
}
