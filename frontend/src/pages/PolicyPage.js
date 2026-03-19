import React, { useEffect, useState } from 'react';
import { policyAPI, riskAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiCloudRain,
  FiCompass,
  FiDroplet,
  FiFileText,
  FiFolder,
  FiShield,
  FiStar,
  FiUnlock,
  FiWind,
} from 'react-icons/fi';

const PLAN_ICONS = { basic: FiShield, standard: FiActivity, premium: FiStar };
const TRIGGER_LABELS = {
  extreme_heat: 'Extreme Heat (>42°C)',
  heavy_rain: 'Heavy Rain (>64mm/hr)',
  severe_pollution: 'Severe Pollution (AQI>301)',
  flood: 'Flooding',
  curfew: 'Curfew / Bandh',
  strike: 'City Strike',
  platform_outage: 'Platform Outage',
  cyclone: 'Cyclone',
  hailstorm: 'Hailstorm',
  dense_fog: 'Dense Fog',
  cold_wave: 'Cold Wave'
};

const TRIGGER_ICONS = {
  extreme_heat: FiActivity,
  heavy_rain: FiCloudRain,
  severe_pollution: FiActivity,
  flood: FiDroplet,
  curfew: FiAlertTriangle,
  strike: FiCompass,
  platform_outage: FiActivity,
  cyclone: FiWind,
  hailstorm: FiCloudRain,
  dense_fog: FiCloudRain,
  cold_wave: FiWind,
};

export default function PolicyPage() {
  const { worker, updateWorker } = useAuthStore();
  const [plans, setPlans] = useState(null);
  const [myPolicies, setMyPolicies] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState('plans');

  const activePolicy = myPolicies.find(p => p.status === 'active');

  const loadData = async () => {
    const [plansRes, policiesRes, riskRes] = await Promise.all([
      policyAPI.getPlans(), policyAPI.getAll(), riskAPI.assess()
    ]);
    setPlans(plansRes.data.plans);
    setMyPolicies(policiesRes.data.policies);
    setRisk(riskRes.data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success('Policy data refreshed');
    } catch {
      toast.error('Unable to refresh policy data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBuy = async (planType) => {
    setPurchasing(planType);
    try {
      const res = await policyAPI.create({ planType, paymentMethod: 'upi' });
      toast.success(`${res.data.policy.planName} activated! You're now protected.`);
      setMyPolicies(prev => [res.data.policy, ...prev]);
      updateWorker({ activePolicyId: res.data.policy._id });
      setTab('my-policies');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create policy');
    } finally { setPurchasing(null); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel your active policy? You will lose coverage immediately.')) return;
    setCancelling(true);
    try {
      await policyAPI.cancel(id);
      toast.success('Policy cancelled.');
      setMyPolicies(prev => prev.map(p => p._id === id ? { ...p, status: 'cancelled' } : p));
      updateWorker({ activePolicyId: null });
    } catch { } finally { setCancelling(false); }
  };

  const handleRenew = async (id) => {
    try {
      const res = await policyAPI.renew(id, { paymentMethod: 'upi' });
      toast.success('Policy renewed for another week.');
      setMyPolicies(prev => prev.map(p => p._id === id ? res.data.policy : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed');
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-40 skeleton" />)}</div>;

  return (
    <div className="page-container animate-slide-in">
      <div className="section-head">
        <div>
          <span className="section-chip mb-3">Plan And Coverage</span>
          <h1 className="font-display text-2xl font-bold text-white">Insurance Policy</h1>
          <p className="text-gray-400 text-sm mt-1">Weekly income protection for gig workers</p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary text-sm py-2 px-3" disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        {risk && (
          <div className="bg-white/[0.06] border border-white/10 rounded-xl py-2 px-4 text-sm text-right hidden sm:block">
            <p className="text-gray-400">Your Risk Score</p>
            <p className={`font-bold ${risk.riskCategory === 'low' ? 'text-green-400' : risk.riskCategory === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
              {Math.round(risk.riskScore * 100)} / 100 ({risk.riskCategory})
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-shell">
        {[['plans', `Plans`, FiFileText], ['my-policies', `My Policies (${myPolicies.length})`, FiFolder]].map(([t, l, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? 'tabs-btn-active inline-flex items-center gap-2' : 'tabs-btn inline-flex items-center gap-2'}>
            <Icon className="text-sm" /> {l}
          </button>
        ))}
      </div>

      {tab === 'plans' && plans && (
        <div className="space-y-6">
          {activePolicy && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-300">
              <span className="inline-flex items-center gap-2"><FiCheckCircle /> You have an active <strong>{activePolicy.planName}</strong>. Cancel it first to switch plans.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(plans).map(([key, plan]) => (
              <div key={key} className={`card relative flex flex-col transition-all duration-300 hover:shadow-glow ${plan.recommended ? 'border-brand-500 ring-1 ring-brand-500/50' : 'border-dark-600 hover:border-brand-500/40'}`}>
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-orange font-bold">RECOMMENDED</div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const PlanIcon = PLAN_ICONS[key] || FiShield;
                    return <PlanIcon className="text-2xl text-brand-300" />;
                  })()}
                  <h3 className="font-display font-bold text-white">{plan.planName}</h3>
                </div>

                <div className="mb-4">
                  <div className="font-display text-4xl font-bold gradient-text">₹{plan.finalPremium}</div>
                  <div className="text-gray-400 text-sm">per week</div>
                </div>

                <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl mb-4">
                  <p className="text-gray-400 text-xs mb-1">Coverage Amount</p>
                  <p className="text-white font-bold text-lg">₹{plan.coverageAmount.toLocaleString()}/week</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Covers about {Math.min(100, Math.round((plan.coverageAmount / Math.max(worker?.averageWeeklyEarnings || 1, 1)) * 100))}% of your weekly earnings
                  </p>
                  {plan.premiumBreakdown && (
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Base Premium</span><span>₹{plan.basePremium}</span></div>
                      {plan.riskLoading !== 0 && <div className="flex justify-between"><span>Risk Loading</span><span className={plan.riskLoading > 0 ? 'text-red-400' : 'text-green-400'}>₹{plan.riskLoading}</span></div>}
                      {plan.cityAdjustment !== 0 && <div className="flex justify-between"><span>City Factor</span><span>₹{plan.cityAdjustment}</span></div>}
                      {plan.loyaltyDiscount > 0 && <div className="flex justify-between"><span>Loyalty Discount</span><span className="text-green-400">-₹{plan.loyaltyDiscount}</span></div>}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Covered Disruptions</p>
                  {plan.coverageTriggers?.map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-gray-300">
                      <FiCheck className="text-brand-300 text-xs" />
                      {TRIGGER_LABELS[t] || t}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features?.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <FiCheck className="text-cyan-300" />{f}
                    </div>
                  ))}
                </div>

                <button onClick={() => handleBuy(key)} disabled={!!activePolicy || purchasing === key}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${activePolicy ? 'bg-dark-600 text-gray-500 cursor-not-allowed' : 'btn-primary'}`}>
                  {purchasing === key ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span> : activePolicy ? 'Cancel Current Policy First' : `Get ${plan.planName} →`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'my-policies' && (
        <div className="space-y-4">
          {myPolicies.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-4 text-brand-300 flex items-center justify-center"><FiUnlock className="text-3xl" /></div>
              <p className="text-gray-400 mb-4">No policies yet</p>
              <button onClick={() => setTab('plans')} className="btn-primary text-sm">View Plans →</button>
            </div>
          ) : (
            myPolicies.map(policy => (
              <div key={policy._id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-300"><FiShield className="text-2xl" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{policy.planName}</p>
                        <span className={`badge text-xs ${policy.status === 'active' ? 'badge-green' : policy.status === 'expired' ? 'badge-gray' : 'badge-red'}`}>{policy.status}</span>
                      </div>
                      <p className="text-gray-400 text-sm font-mono">{policy.policyNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {policy.status === 'active' && (
                      <>
                        <button onClick={() => handleRenew(policy._id)} className="btn-secondary text-xs py-2 px-3">Renew</button>
                        <button onClick={() => handleCancel(policy._id)} disabled={cancelling} className="text-xs py-2 px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all">Cancel</button>
                      </>
                    )}
                  </div>
                </div>

                {policy.status === 'active' && new Date(policy.endDate) - new Date() <= 2 * 24 * 60 * 60 * 1000 && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs">
                    Policy expires soon. Renew now to avoid coverage gaps.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { l: 'Coverage', v: `₹${policy.coverageAmount?.toLocaleString()}` },
                    { l: 'Weekly Premium', v: `₹${policy.weeklyPremium}` },
                    { l: 'Start Date', v: new Date(policy.startDate).toLocaleDateString('en-IN') },
                    { l: 'End Date', v: new Date(policy.endDate).toLocaleDateString('en-IN') },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">{l}</p>
                      <p className="text-white font-semibold text-sm mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">Covered Triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {policy.coverageTriggers?.map(ct => {
                      const TriggerIcon = TRIGGER_ICONS[ct.type] || FiActivity;
                      return (
                        <span key={ct.type} className="badge-blue text-xs inline-flex items-center gap-1">
                          <TriggerIcon className="text-xs" />
                          {TRIGGER_LABELS[ct.type] || ct.type}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Total Premium Paid: <strong className="text-white">₹{policy.totalPremiumPaid}</strong></span>
                  <span>Claims Paid: <strong className="text-cyan-300">₹{policy.totalClaimsPaid || 0}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
