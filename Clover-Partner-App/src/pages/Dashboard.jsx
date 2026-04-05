import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeolocation } from '../hooks/useGeolocation';
import { DashboardMap } from '../components/DashboardMap';
import { OrderOverlay } from '../components/OrderOverlay';
import { useOrderStore } from '../store/useOrderStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FloatingActionMenu } from '../components/FloatingActionMenu';

export const Dashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const { location, error } = useGeolocation(isOnline);
  const isNetworkOnline = useNetworkStatus();
  
  // Zustand State hooks
  const { status, earnings, ordersCount, dispatchMockOrder } = useOrderStore();

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // If permission denied or other critical error, ensure Offline toggle
  useEffect(() => {
    if (error && error.code === 1) {
      setIsOnline(false);
    }
  }, [error]);

  // Handle global network disconnect overrides
  useEffect(() => {
    if (!isNetworkOnline) {
      setIsOnline(false);
    }
  }, [isNetworkOnline]);

  // Handle Mock Order Dispatch after 5 seconds of idle online time
  useEffect(() => {
    let mockTimer;
    if (isOnline && status === 'IDLE' && location && isNetworkOnline) {
      mockTimer = setTimeout(() => {
        dispatchMockOrder();
      }, 5000);
    }
    return () => clearTimeout(mockTimer);
  }, [isOnline, status, location, dispatchMockOrder, isNetworkOnline]);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#121212] text-[#E0E0E0] relative pb-0">
      
      {/* Network Offline Banner layer 9999 */}
      <AnimatePresence>
        {!isNetworkOnline && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="fixed top-0 left-0 w-full bg-red-600 text-white font-bold py-2 text-center z-[9999] shadow-[0_4px_20px_rgba(220,38,38,0.7)]"
          >
            ⚠️ No Internet Connection
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Render */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded-full font-bold shadow-xl border ${
              toast.type === 'error' ? 'bg-red-500 border-red-400' : 'bg-green-500 border-green-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <header className={`h-16 shrink-0 bg-[#1E1E1E] flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm relative transition-all duration-300 ${!isNetworkOnline ? 'mt-10' : ''}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2A2A2A]">
          <User className="text-[#E0E0E0]" size={24} />
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="text-[#4CAF50] text-sm font-semibold tracking-wide">You are Online</span>
          ) : (
            <span className="text-gray-400 text-sm font-semibold tracking-wide animate-pulse">Offline</span>
          )}
          <button 
            disabled={status !== 'IDLE' || !isNetworkOnline}
            onClick={() => setIsOnline(!isOnline)}
            className={`relative flex items-center w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
              isOnline ? 'bg-[#4CAF50]' : 'bg-[#424242]'
            } ${(status !== 'IDLE' || !isNetworkOnline) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <motion.div 
              layout
              className="w-6 h-6 bg-white rounded-full shadow-sm"
              initial={false}
              animate={{
                x: isOnline ? 32 : 0,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center bg-[#2A2A2A] relative overflow-hidden z-10 shadow-inner">
        <DashboardMap location={location} />

        <OrderOverlay 
          onMissedOrder={() => showToast('Order Missed', 'error')}
          onRejectOrder={() => showToast('Order Rejected', 'error')}
          onOrderComplete={() => showToast('Order Delivered! +₹45 added to Earnings', 'success')}
          isNetworkOnline={isNetworkOnline}
        />

        {/* Global loader placeholder if tracking started but no location and no error */}
        {isOnline && !location && !error && status === 'IDLE' && isNetworkOnline && (
          <p className="text-[#E0E0E0] text-lg font-medium opacity-60 animate-pulse relative z-10 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-none">
            Acquiring GPS Signal...
          </p>
        )}
        
        {/* Permission Denied Modal Overlay */}
        <AnimatePresence>
          {error && error.code === 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="bg-[#1E1E1E] p-6 rounded-2xl shadow-xl max-w-sm w-full border border-gray-800">
                <h3 className="text-xl font-bold text-red-400 mb-3">Location Required</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  Please enable GPS permissions in your browser settings to receive orders.
                </p>
                <button 
                  onClick={() => setIsOnline(true)}
                  className="w-full bg-swiggy hover:bg-[#ff9947] text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FloatingActionMenu />

      {/* Bottom Earnings Card - Hides on active order */}
      <AnimatePresence>
        {status === 'IDLE' && (
          <motion.footer 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="h-32 shrink-0 bg-[#1E1E1E] rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.6)] absolute left-0 w-full z-20 flex flex-col justify-between p-5 border-t border-gray-800"
            // Shift explicit 4rem layout height constraints correctly upwards to sit securely over the custom global Layout bottom nav bar directly
            style={{ bottom: '4rem', paddingBottom: '0.75rem' }}
          >
            <div className="grid grid-cols-2 items-start">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Today's Earnings</span>
                <span className="text-3xl font-extrabold text-green-400 tracking-tight">₹{earnings}</span>
              </div>
              <div className="flex justify-end items-center h-full pt-1">
                <span className="text-[#E0E0E0] font-semibold bg-[#2A2A2A] px-3 py-1.5 rounded-lg shadow-sm border border-gray-700">Orders: <span className="text-swiggy">{ordersCount}</span></span>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative mt-auto">
              <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden shadow-inner flex items-center">
                <div 
                  className="h-full bg-swiggy rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(252,128,25,0.6)]"
                  style={{ width: `${Math.min((ordersCount / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-center text-gray-400">
                Complete 10 orders for <span className="text-green-400 font-bold">₹200</span> bonus
              </span>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
};
