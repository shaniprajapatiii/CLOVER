import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Gift, Clock, Utensils, ShoppingBag, MapPin } from 'lucide-react';
import { useEarningsStore } from '../store/useEarningsStore';

export const Earnings = () => {
  const [activeTab, setActiveTab] = useState('today');
  const { todayEarnings, weeklyEarnings, incentiveTarget, orderHistory } = useEarningsStore();

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
  ];

  const displayTotal = activeTab === 'today' ? todayEarnings.total : weeklyEarnings.total;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#121212] overflow-y-auto pb-24">
      
      {/* Sticky Header */}
      <header className="h-14 shrink-0 bg-[#1E1E1E] flex items-center justify-center sticky top-0 z-30 shadow-sm border-b border-gray-800/50">
        <h1 className="text-lg font-black text-white tracking-wider uppercase">Earnings</h1>
      </header>

      {/* Tab Toggle */}
      <div className="flex mx-4 mt-4 bg-[#1A1A1A] rounded-xl p-1 border border-gray-800 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex-1 py-2.5 text-center text-sm font-bold z-10 transition-colors duration-200"
            style={{ color: activeTab === tab.id ? '#fff' : '#9ca3af' }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="earnings-tab-pill"
                className="absolute inset-0 bg-swiggy rounded-lg shadow-[0_2px_12px_rgba(252,128,25,0.3)]"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Earnings Card */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-4 mt-4 p-5 bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
          {activeTab === 'today' ? "Today's Earnings" : weeklyEarnings.weekRange}
        </p>
        <p className="text-green-400 text-5xl font-black tracking-tight">
          ₹{displayTotal.toLocaleString('en-IN')}
        </p>
        {activeTab === 'week' && (
          <p className="text-swiggy text-xs font-bold mt-2 tracking-wide">{weeklyEarnings.status}</p>
        )}

        <div className="border-t border-[#333] my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Orders</span>
            <span className="text-white text-xl font-black mt-0.5">
              {activeTab === 'today' ? todayEarnings.completedOrders : '62'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Login Time</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={14} className="text-gray-400" />
              <span className="text-white text-xl font-black">
                {activeTab === 'today' ? '5h 20m' : '38h 15m'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Section */}
      {activeTab === 'today' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mx-4 mt-4 bg-[#1E1E1E] rounded-2xl border border-[#333] overflow-hidden shadow-md"
        >
          <div className="px-5 py-3 border-b border-[#2A2A2A]">
            <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Earnings Breakdown</h3>
          </div>

          <div className="divide-y divide-[#2A2A2A]">
            <div className="flex justify-between items-center px-5 py-3.5">
              <span className="text-gray-300 font-semibold tracking-wide">Order Pay</span>
              <span className="text-white font-black text-lg">₹{todayEarnings.basePay}</span>
            </div>

            <div className="flex justify-between items-center px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-gray-300 font-semibold tracking-wide">Surge Pay</span>
              </div>
              <span className="text-white font-black text-lg">₹{todayEarnings.surge}</span>
            </div>

            <div className="flex justify-between items-center px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-400" />
                <span className="text-gray-300 font-semibold tracking-wide">Tips</span>
              </div>
              <span className="text-white font-black text-lg">₹{todayEarnings.tips}</span>
            </div>

            <div className="flex justify-between items-center px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-swiggy" />
                <span className="text-gray-300 font-semibold tracking-wide">Incentive Bonus</span>
              </div>
              <span className="text-swiggy font-black text-lg">₹{todayEarnings.incentives}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Incentive Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="mx-4 mt-4 p-4 bg-[#2A2A2A] rounded-2xl border border-[#333]"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-black tracking-wide">Daily Milestone</h3>
          <span className="text-swiggy font-black text-sm">{incentiveTarget.currentOrders}/{incentiveTarget.targetOrders}</span>
        </div>

        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-swiggy rounded-full shadow-[0_0_10px_rgba(252,128,25,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((incentiveTarget.currentOrders / incentiveTarget.targetOrders) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <p className="text-green-400 text-sm font-bold mt-3 tracking-wide">
          {incentiveTarget.text}
        </p>
      </motion.div>

      {/* Recent Trips Section */}
      <h2 className="text-lg font-semibold text-gray-200 px-4 mt-6 mb-2">Recent Trips</h2>

      {orderHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <MapPin size={64} className="text-gray-600 opacity-50 mb-4" />
          <p className="text-gray-500 text-center font-medium leading-relaxed">
            No deliveries yet today.<br />Go online to start earning!
          </p>
        </div>
      ) : (
        <div className="flex flex-col mx-4 bg-[#1E1E1E] rounded-2xl border border-[#333] overflow-hidden shadow-md mb-4">
          {orderHistory.map((trip, idx) => (
            <div
              key={`${trip.id}-${idx}`}
              className={`flex items-center gap-4 p-4 ${idx < orderHistory.length - 1 ? 'border-b border-[#222]' : ''}`}
            >
              <div className="w-10 h-10 bg-[#2A2A2A] rounded-full flex items-center justify-center flex-shrink-0 border border-[#333]">
                {trip.type === 'instamart'
                  ? <ShoppingBag size={18} className="text-blue-400" />
                  : <Utensils size={18} className="text-swiggy" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold tracking-wide truncate">{trip.restaurant}</p>
                <p className="text-gray-400 text-sm mt-0.5">{trip.time} &bull; {trip.distance}</p>
              </div>

              <span className="text-green-400 font-black text-lg flex-shrink-0">₹{trip.earning}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
