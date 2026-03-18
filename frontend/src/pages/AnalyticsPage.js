import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyticsAPI } from '../services/api';
import { useAuthStore } from '../store';

const COLORS = ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f87171'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-dark-500 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { worker } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(3);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, earnRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getEarnings(period)
        ]);
        setDashboard(dashRes.data.dashboard);
        setEarnings(earnRes.data.data || []);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [period]);

  // Build mock chart data if earnings is empty
  const earningsChartData = earnings.length > 0 ? earnings.map(e => ({
    name: `W${e._id.week}`,
    protected: e.totalProtected,
    claims: e.claimsCount
  })) : [
    { name: 'Week 1', protected: 1200, claims: 1 },
    { name: 'Week 2', protected: 0, claims: 0 },
    { name: 'Week 3', protected: 2800, claims: 2 },
    { name: 'Week 4', protected: 1500, claims: 1 },
    { name: 'Week 5', protected: 0, claims: 0 },
    { name: 'Week 6', protected: 3200, claims: 3 },
  ];

  const claimStats = dashboard?.claimStats || {};
  const pieData = Object.entries(claimStats).map(([status, data]) => ({
    name: status.replace(/_/g, ' '),
    value: data.count || 0
  })).filter(d => d.value > 0);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-48 skeleton" />)}</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Your income protection performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Protected', value: `₹${(dashboard?.totalPaid || 0).toLocaleString()}`, icon: '💰', color: 'text-green-400' },
          { label: 'Total Claims', value: dashboard?.totalClaims || 0, icon: '📋', color: 'text-blue-400' },
          { label: 'Approval Rate', value: `${dashboard?.approvalRate || 0}%`, icon: '✅', color: 'text-brand-400' },
          { label: 'Loyalty Points', value: worker?.loyaltyPoints || 0, icon: '⭐', color: 'text-yellow-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Earnings Protected Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-white">Income Protected Over Time</h2>
          <select className="input-field w-auto text-sm py-1.5" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={earningsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d45" />
            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="protected" name="Amount Protected (₹)" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims by Status Pie */}
        <div className="card">
          <h2 className="font-display text-lg font-bold text-white mb-4">Claims by Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">No claims data yet</div>
          )}
        </div>

        {/* Risk Score Gauge + Info */}
        <div className="card">
          <h2 className="font-display text-lg font-bold text-white mb-4">Risk Profile Analysis</h2>
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a26" strokeWidth="14" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={worker?.riskCategory === 'low' ? '#22c55e' : worker?.riskCategory === 'high' ? '#ef4444' : '#f59e0b'}
                  strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(worker?.riskScore || 0.5) * 314} 314`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-white">{Math.round((worker?.riskScore || 0.5) * 100)}</span>
                <span className={`text-sm font-semibold capitalize ${worker?.riskCategory === 'low' ? 'text-green-400' : worker?.riskCategory === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>{worker?.riskCategory} risk</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(worker?.riskFactors || []).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 capitalize">{f.factor?.replace(/_/g, ' ')}</span>
                    <span className={f.weight > 0 ? 'text-red-400' : 'text-green-400'}>{f.weight > 0 ? '+' : ''}{(f.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${f.weight > 0.05 ? 'bg-red-500' : f.weight < -0.02 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(Math.abs(f.weight) * 300, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-dark-700 rounded-xl text-xs text-gray-400">
            💡 Lower your risk score by maintaining a clean claim history and staying active on the platform.
          </div>
        </div>
      </div>

      {/* Weekly Streak */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-white mb-4">Weekly Streak & Loyalty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-dark-700 rounded-xl">
            <div className="font-display text-3xl font-bold text-brand-400">{worker?.streakWeeks || 0}</div>
            <p className="text-gray-400 text-xs mt-1">Week Streak 🔥</p>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-xl">
            <div className="font-display text-3xl font-bold text-yellow-400">{worker?.loyaltyPoints || 0}</div>
            <p className="text-gray-400 text-xs mt-1">Loyalty Points ⭐</p>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-xl">
            <div className="font-display text-3xl font-bold text-green-400">{worker?.referralCount || 0}</div>
            <p className="text-gray-400 text-xs mt-1">Friends Referred 🎁</p>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-xl">
            <div className="font-display text-3xl font-bold text-blue-400">{worker?.totalClaimsCount || 0}</div>
            <p className="text-gray-400 text-xs mt-1">Claims Received 💰</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300">
          ⭐ You earn 25 points every week you renew and 50 points per new policy. 10 points per claim received. Redeem points for premium discounts!
        </div>
      </div>
    </div>
  );
}
