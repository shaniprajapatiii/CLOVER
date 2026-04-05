import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, CheckCircle2, Clock, ChevronRight, LogOut, Wallet, Shirt, HelpCircle, FileText } from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#121212] p-5 pt-12 overflow-y-auto pb-32">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-black text-white tracking-wide">My Profile</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 font-bold active:scale-95 transition-transform bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Profile Identity Card */}
      <div className="bg-[#1E1E1E] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-800">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center flex-shrink-0 border-2 border-[#333] shadow-inner">
            <User className="text-swiggy" size={40} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-white">{user?.name || 'Rahul Kumar'}</h2>
            <p className="text-gray-400 font-medium text-sm tracking-wide mt-0.5">ID: {user?.id || 'SWG-9901'}</p>
            <p className="text-gray-400 font-medium text-sm tracking-wide">{user?.phone || '+91 98765 43210'}</p>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-gray-800 flex justify-between items-center text-sm font-bold">
          <span className="bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-[#333] shadow-sm tracking-wide">
            Rating: <span className="text-yellow-400">4.8 ⭐️</span>
          </span>
          <span className="bg-gradient-to-r from-gray-300 to-gray-400 text-black px-3 py-1.5 rounded-lg shadow-sm tracking-wide">
            Tier: Silver Partner
          </span>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-[#1E1E1E] rounded-xl p-4 text-center border border-gray-800 shadow-md">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Lifetime Deliveries</p>
          <p className="text-white text-2xl font-black tracking-tight">1,204</p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-4 text-center border border-gray-800 shadow-md">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Thumbs Up</p>
          <p className="text-white text-2xl font-black tracking-tight">98%</p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-4 text-center border border-gray-800 shadow-md">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Login Hours</p>
          <p className="text-white text-2xl font-black tracking-tight">450 hrs</p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-4 text-center border border-gray-800 shadow-md">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Cancellation Rate</p>
          <p className="text-green-400 text-2xl font-black tracking-tight">1.2%</p>
        </div>
      </div>

      {/* Document & Vehicle Verification Status */}
      <div className="mt-6 bg-[#1E1E1E] rounded-2xl p-5 shadow-lg border border-gray-800">
        <h3 className="text-white font-black mb-5 tracking-wide text-lg">Verification Status</h3>
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-semibold tracking-wide">Aadhaar Card</span>
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 px-2.5 py-1.5 rounded-md border border-green-500/20 uppercase tracking-widest">
              <CheckCircle2 size={16} /> Verified
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-semibold tracking-wide">PAN Card</span>
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 px-2.5 py-1.5 rounded-md border border-green-500/20 uppercase tracking-widest">
              <CheckCircle2 size={16} /> Verified
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-semibold tracking-wide">Driving License</span>
            <div className="flex items-center gap-1.5 text-swiggy text-xs font-bold bg-swiggy/10 px-2.5 py-1.5 rounded-md border border-swiggy/20 uppercase tracking-widest">
              <Clock size={16} /> Pending Review
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-semibold tracking-wide">Bank Account</span>
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 px-2.5 py-1.5 rounded-md border border-green-500/20 uppercase tracking-widest">
              <CheckCircle2 size={16} /> Verified
            </div>
          </div>
          <div className="pt-4 border-t border-gray-800 mt-1">
            <span className="text-gray-500 text-[11px] uppercase tracking-wider font-bold block mb-1">Vehicle Details</span>
            <span className="text-white font-bold tracking-wide">Honda Activa <span className="text-gray-400 font-medium ml-1">(DL-01-XX-9999)</span></span>
          </div>
        </div>
      </div>

      {/* Settings Links */}
      <div className="mt-6 flex flex-col gap-3">
        {[
          { name: 'Payout Settings', icon: <Wallet size={20} className="text-gray-400" /> },
          { name: 'Floating Cash Limit (Current: ₹1500)', icon: <FileText size={20} className="text-gray-400" /> },
          { name: 'ID Card & T-Shirt Request', icon: <Shirt size={20} className="text-gray-400" /> },
          { name: 'Help & Support', icon: <HelpCircle size={20} className="text-gray-400" /> }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#1E1E1E] p-4.5 py-4 rounded-xl border border-gray-800 text-white font-bold flex justify-between items-center active:scale-95 active:bg-[#2A2A2A] transition-all cursor-pointer shadow-sm">
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="tracking-wide text-[15px]">{item.name}</span>
            </div>
            <ChevronRight size={20} className="text-gray-600" />
          </div>
        ))}
      </div>

    </div>
  );
};
