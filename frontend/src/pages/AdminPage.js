import React, { useEffect, useState } from 'react';
import { analyticsAPI, claimAPI, adminAPI, weatherAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [claims, setClaims] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [simulateForm, setSimulateForm] = useState({ city: 'Mumbai', eventType: 'heavy_rain', severity: 'high' });
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [anaRes, claimsRes, workersRes] = await Promise.all([
          analyticsAPI.getAdminAnalytics(),
          claimAPI.adminGetAll({ limit: 20 }),
          adminAPI.getWorkers({ limit: 20 })
        ]);
        setAnalytics(anaRes.data.analytics);
        setClaims(claimsRes.data.claims);
        setWorkers(workersRes.data.workers);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleReviewClaim = async (id, action) => {
    try {
      await claimAPI.review(id, { action, reviewNotes: `Admin ${action}d via dashboard` });
      toast.success(`Claim ${action}d!`);
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c));
    } catch { }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await weatherAPI.simulate(simulateForm);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally { setSimulating(false); }
  };

  const TABS = ['overview', 'claims', 'workers', 'simulate'];

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-32 skeleton" />)}</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Platform management and analytics</p>
      </div>

      <div className="flex flex-wrap gap-2 bg-dark-800 border border-dark-600 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'simulate' ? '⚡ Simulate' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { l: 'Total Workers', v: analytics.workers?.total || 0, sub: `${analytics.workers?.active || 0} active`, icon: '👥' },
              { l: 'Active Policies', v: analytics.policies?.active || 0, sub: `${analytics.policies?.total || 0} total`, icon: '🛡️' },
              { l: 'Fraud Detected', v: analytics.fraud?.detected || 0, sub: `₹${(analytics.fraud?.amountSaved || 0).toLocaleString()} saved`, icon: '🚨' },
              { l: 'Total Revenue', v: `₹${(analytics.revenue?.totalRevenue || 0).toLocaleString()}`, sub: `₹${Math.round(analytics.revenue?.avgPremium || 0)}/wk avg`, icon: '💰' },
            ].map(({ l, v, sub, icon }) => (
              <div key={l} className="card">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-gray-400 text-xs">{l}</p>
                    <p className="font-display text-2xl font-bold text-white">{v}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* City-wise Chart */}
          {analytics.cityWise?.length > 0 && (
            <div className="card">
              <h2 className="font-display text-lg font-bold text-white mb-4">Workers by City</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.cityWise}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d45" />
                  <XAxis dataKey="_id" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid #2d2d45', borderRadius: 12 }} />
                  <Bar dataKey="count" name="Workers" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trigger-wise Claims */}
          {analytics.triggerWise?.length > 0 && (
            <div className="card">
              <h2 className="font-display text-lg font-bold text-white mb-4">Claims by Trigger Type</h2>
              <div className="space-y-3">
                {analytics.triggerWise.map(t => (
                  <div key={t._id} className="flex items-center gap-3">
                    <p className="text-gray-300 text-sm capitalize w-40">{t._id?.replace(/_/g,' ')}</p>
                    <div className="flex-1 bg-dark-700 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${(t.count / (analytics.triggerWise[0]?.count || 1)) * 100}%` }} />
                    </div>
                    <span className="text-gray-400 text-xs w-16 text-right">{t.count} claims</span>
                    <span className="text-green-400 text-xs w-24 text-right">₹{(t.totalPaid || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'claims' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['under_review', 'fraud_flagged', 'auto_triggered'].map(s => (
              <button key={s} onClick={() => claimAPI.adminGetAll({ status: s }).then(r => setClaims(r.data.claims))}
                className="px-3 py-1.5 rounded-lg text-xs bg-dark-700 text-gray-400 hover:text-white border border-dark-500 capitalize transition-all">
                {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          {claims.map(claim => (
            <div key={claim._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">#{claim.claimNumber}</p>
                    <span className={`badge text-xs ${claim.isFraudulent ? 'badge-red' : 'badge-yellow'}`}>{claim.status?.replace(/_/g,' ')}</span>
                    {claim.isAutoTriggered && <span className="badge-orange text-xs">Auto-Triggered</span>}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {claim.workerId?.name} · {claim.workerId?.city} · {claim.triggerType?.replace(/_/g,' ')}
                  </p>
                  <p className="text-gray-500 text-xs">₹{claim.claimAmount?.toLocaleString()} requested · Fraud: {(claim.fraudScore * 100).toFixed(0)}%</p>
                  {claim.fraudFlags?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {claim.fraudFlags.map((f, i) => (
                        <p key={i} className="text-red-400 text-xs">⚠️ {f.description}</p>
                      ))}
                    </div>
                  )}
                </div>
                {['submitted', 'under_review', 'auto_triggered'].includes(claim.status) && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleReviewClaim(claim._id, 'approve')} className="px-3 py-2 text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-all">✅ Approve</button>
                    <button onClick={() => handleReviewClaim(claim._id, 'reject')} className="px-3 py-2 text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-all">❌ Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'workers' && (
        <div className="space-y-3">
          {workers.map(w => (
            <div key={w._id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center font-bold text-brand-400">{w.name?.[0]}</div>
                <div>
                  <p className="font-semibold text-white">{w.name}</p>
                  <p className="text-gray-400 text-sm capitalize">{w.platform} · {w.city} · {w.riskCategory} risk</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${w.isActive ? 'badge-green' : 'badge-red'}`}>{w.isActive ? 'Active' : 'Inactive'}</span>
                {w.activePolicyId && <span className="badge-blue text-xs">Policy: {w.activePolicyId.planType}</span>}
                <button onClick={async () => {
                  const res = await adminAPI.toggleWorker(w._id);
                  setWorkers(prev => prev.map(wk => wk._id === w._id ? { ...wk, isActive: res.data.isActive } : wk));
                  toast.success(res.data.message);
                }} className="text-xs py-1.5 px-3 bg-dark-700 text-gray-400 border border-dark-500 rounded-lg hover:text-white transition-all">
                  {w.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'simulate' && (
        <div className="max-w-md space-y-4">
          <div className="card border-brand-500/30">
            <h2 className="font-display text-lg font-bold text-white mb-2">Simulate Weather Event</h2>
            <p className="text-gray-400 text-sm mb-6">Trigger a simulated weather event to test automatic claim processing across all active policies in a city.</p>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">City</label>
                <select className="input-field" value={simulateForm.city} onChange={e => setSimulateForm(f => ({ ...f, city: e.target.value }))}>
                  {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Event Type</label>
                <select className="input-field" value={simulateForm.eventType} onChange={e => setSimulateForm(f => ({ ...f, eventType: e.target.value }))}>
                  {['heavy_rain', 'extreme_heat', 'severe_pollution', 'flood', 'cyclone', 'curfew', 'strike', 'platform_outage'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Severity</label>
                <select className="input-field" value={simulateForm.severity} onChange={e => setSimulateForm(f => ({ ...f, severity: e.target.value }))}>
                  {['low', 'moderate', 'high', 'extreme'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                ⚠️ This will trigger real claims for all eligible workers in {simulateForm.city}. Use only for testing.
              </div>
              <button type="submit" className="btn-primary w-full" disabled={simulating}>
                {simulating ? 'Simulating...' : '⚡ Trigger Event & Auto-Claims'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
