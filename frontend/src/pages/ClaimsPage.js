import React, { useEffect, useMemo, useState } from 'react';
import { claimAPI } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCloudRain,
  FiCompass,
  FiDroplet,
  FiFileText,
  FiPlusCircle,
  FiSearch,
  FiWind,
  FiXCircle,
  FiZap,
} from 'react-icons/fi';

const STATUS_CONFIG = {
  paid: { color: 'badge-green', label: 'Paid', bg: 'bg-cyan-500/10 border-cyan-500/30', Icon: FiCheckCircle },
  approved: { color: 'badge-blue', label: 'Approved', bg: 'bg-blue-500/10 border-blue-500/30', Icon: FiCheckCircle },
  auto_triggered: { color: 'badge-orange', label: 'Auto-Triggered', bg: 'bg-brand-500/10 border-brand-500/30', Icon: FiZap },
  under_review: { color: 'badge-yellow', label: 'Under Review', bg: 'bg-yellow-500/10 border-yellow-500/30', Icon: FiSearch },
  submitted: { color: 'badge-gray', label: 'Submitted', bg: 'bg-gray-500/10 border-gray-500/30', Icon: FiFileText },
  rejected: { color: 'badge-red', label: 'Rejected', bg: 'bg-red-500/10 border-red-500/30', Icon: FiXCircle },
  fraud_flagged: { color: 'badge-red', label: 'Under Investigation', bg: 'bg-red-500/10 border-red-500/30', Icon: FiAlertTriangle },
};

const TRIGGER_TYPES = [
  { value: 'extreme_heat', label: 'Extreme Heat (>42°C)' },
  { value: 'heavy_rain', label: 'Heavy Rain / Storm' },
  { value: 'flood', label: 'Flooding' },
  { value: 'severe_pollution', label: 'Severe Pollution (AQI>300)' },
  { value: 'curfew', label: 'Curfew / Section 144' },
  { value: 'strike', label: 'City Strike / Bandh' },
  { value: 'platform_outage', label: 'Platform App Outage' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'hailstorm', label: 'Hailstorm' },
  { value: 'dense_fog', label: 'Dense Fog' },
  { value: 'cold_wave', label: 'Cold Wave' },
];

const TRIGGER_ICONS = {
  extreme_heat: FiActivity,
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

function ClaimCard({ claim }) {
  const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.submitted;
  const TriggerIcon = TRIGGER_ICONS[claim.triggerType] || FiFileText;
  return (
    <div className={`card border ${cfg.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center shrink-0 text-brand-300">
            <TriggerIcon className="text-lg" />
          </div>
          <div>
            <p className="font-semibold text-white capitalize">{claim.triggerType?.replace(/_/g, ' ')}</p>
            <p className="text-gray-400 text-xs">#{claim.claimNumber} · {new Date(claim.createdAt).toLocaleDateString('en-IN')}</p>
            {claim.isAutoTriggered && <span className="text-xs text-brand-300 font-medium inline-flex items-center gap-1"><FiZap className="text-xs" /> Auto-Triggered</span>}
          </div>
        </div>
        <div className="text-right">
          <span className={`badge ${cfg.color} text-xs`}><cfg.Icon className="text-xs" /> {cfg.label}</span>
          {claim.approvedAmount > 0 && (
            <p className="text-cyan-300 font-bold text-lg mt-1">₹{claim.approvedAmount.toLocaleString()}</p>
          )}
          {claim.claimAmount && !claim.approvedAmount && (
            <p className="text-gray-400 text-sm mt-1">₹{claim.claimAmount.toLocaleString()} requested</p>
          )}
        </div>
      </div>

      {claim.fraudScore > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span>Fraud Score:</span>
          <div className="flex-1 bg-dark-700 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${claim.fraudScore > 0.7 ? 'bg-red-500' : claim.fraudScore > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${claim.fraudScore * 100}%` }} />
          </div>
          <span>{(claim.fraudScore * 100).toFixed(0)}%</span>
        </div>
      )}

      {claim.status === 'paid' && claim.payoutTransactionId && (
        <div className="mt-2 p-2 bg-dark-700 rounded-lg text-xs text-gray-400">
          Transaction: <span className="font-mono text-cyan-300">{claim.payoutTransactionId}</span>
        </div>
      )}
      {claim.rejectionReason && (
        <div className="mt-2 p-2 bg-red-500/10 rounded-lg text-xs text-red-400">Reason: {claim.rejectionReason}</div>
      )}
    </div>
  );
}

export default function ClaimsPage() {
  const { worker } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('claims');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ triggerType: '', disruptionStartDate: '', description: '', claimAmount: '' });

  const visibleClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const searched = q
      ? claims.filter((claim) => {
        const claimNo = claim.claimNumber?.toLowerCase() || '';
        const trigger = claim.triggerType?.replace(/_/g, ' ').toLowerCase() || '';
        const status = claim.status?.replace(/_/g, ' ').toLowerCase() || '';
        return claimNo.includes(q) || trigger.includes(q) || status.includes(q);
      })
      : claims;

    const sorted = [...searched].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest_amount') return (b.approvedAmount || b.claimAmount || 0) - (a.approvedAmount || a.claimAmount || 0);
      if (sortBy === 'lowest_amount') return (a.approvedAmount || a.claimAmount || 0) - (b.approvedAmount || b.claimAmount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sorted;
  }, [claims, searchQuery, sortBy]);

  useEffect(() => {
    const load = async () => {
      try {
        const [claimsRes, statsRes] = await Promise.all([
          claimAPI.getAll({ status: statusFilter, limit: 50 }),
          claimAPI.getStats()
        ]);
        setClaims(claimsRes.data.claims);
        setStats(statsRes.data);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await claimAPI.submit(form);
      toast.success('Claim submitted! Our AI is reviewing it now.');
      setClaims(prev => [res.data.claim, ...prev]);
      setForm({ triggerType: '', disruptionStartDate: '', description: '', claimAmount: '' });
      setTab('claims');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-container animate-slide-in">
      <div className="section-head">
        <div>
          <span className="section-chip mb-3">Claims Center</span>
          <h1 className="font-display text-2xl font-bold text-white">Claims</h1>
          <p className="text-gray-400 text-sm mt-1">Track and submit income protection claims</p>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { l: 'Total Claims', v: stats.totalClaims || 0, Icon: FiFileText },
            { l: 'Total Paid Out', v: `₹${(stats.totalPaidOut || 0).toLocaleString()}`, Icon: FiZap, color: 'text-cyan-300' },
            { l: 'Approved', v: (stats.stats?.find(s => s._id === 'approved')?.count || 0) + (stats.stats?.find(s => s._id === 'paid')?.count || 0), Icon: FiCheckCircle, color: 'text-blue-300' },
            { l: 'Pending Review', v: stats.stats?.find(s => s._id === 'under_review')?.count || 0, Icon: FiSearch, color: 'text-yellow-400' },
          ].map(({ l, v, Icon, color }) => (
            <div key={l} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-300 flex items-center justify-center">
                <Icon className="text-lg" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">{l}</p>
                <p className={`font-display text-xl font-bold ${color || 'text-white'}`}>{v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-shell">
        {[['claims', 'My Claims', FiFileText], ['submit', 'Submit Claim', FiPlusCircle]].map(([t, l, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? 'tabs-btn-active inline-flex items-center gap-2' : 'tabs-btn inline-flex items-center gap-2'}>
            <Icon className="text-sm" /> {l}
          </button>
        ))}
      </div>

      {tab === 'claims' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input-field"
              placeholder="Search by claim #, trigger, or status"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="highest_amount">Sort: Highest amount</option>
              <option value="lowest_amount">Sort: Lowest amount</option>
            </select>
            <div className="flex items-center text-xs text-gray-400 px-3">
              Showing {visibleClaims.length} of {claims.length} claims
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {['', 'auto_triggered', 'submitted', 'under_review', 'approved', 'paid', 'rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/10'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? [...Array(3)].map((_, i) => <div key={i} className="card h-24 skeleton" />) :
            visibleClaims.length === 0 ? (
              <div className="card text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-4 text-brand-300 flex items-center justify-center">
                  <FiFileText className="text-3xl" />
                </div>
                <p className="text-gray-400">No matching claims found</p>
                <p className="text-gray-600 text-sm mt-1">Try a different status or search query</p>
              </div>
            ) : visibleClaims.map(claim => <ClaimCard key={claim._id} claim={claim} />)
          }
        </div>
      )}

      {tab === 'submit' && (
        <div className="card max-w-lg">
          <h2 className="font-display text-lg font-bold text-white mb-2">Submit a Manual Claim</h2>
          <p className="text-gray-400 text-sm mb-6">Most claims are triggered automatically. Use this form only if you missed an auto-trigger.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Disruption Type *</label>
              <select className="input-field" value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))} required>
                <option value="" disabled>Select disruption type</option>
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Disruption Date *</label>
              <input type="date" className="input-field" value={form.disruptionStartDate}
                onChange={e => setForm(f => ({ ...f, disruptionStartDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Claim Amount (₹)</label>
              <input type="number" className="input-field" placeholder="Leave blank for maximum coverage"
                value={form.claimAmount} onChange={e => setForm(f => ({ ...f, claimAmount: e.target.value }))} min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea className="input-field" rows={3} placeholder="Briefly describe how this disruption affected your work..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300">
              <span className="inline-flex items-center gap-2"><FiZap /> Our AI will verify this claim against real-time weather and event data. False claims will be detected and may lead to account suspension.</span>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</span> : 'Submit Claim →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
