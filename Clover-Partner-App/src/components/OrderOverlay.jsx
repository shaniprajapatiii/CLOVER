import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { useEarningsStore } from '../store/useEarningsStore';

export const OrderOverlay = ({ onMissedOrder, onRejectOrder, onOrderComplete, isNetworkOnline }) => {
  const { status, activeOrder, availableOrders, acceptOrder, setStatus, rejectOrder, completeOrder } = useOrderStore();
  const addCompletedOrder = useEarningsStore((s) => s.addCompletedOrder);
  
  const [timeLeft, setTimeLeft] = useState(60);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let interval;
    if (status === 'RINGING') {
      setTimeLeft(60);
      setIsMinimized(false);
      if (audioRef.current && isNetworkOnline) {
        audioRef.current.play().catch(e => console.error("Audio block:", e));
      }
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            rejectOrder();
            if (onMissedOrder) onMissedOrder();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => clearInterval(interval);
  }, [status, rejectOrder, onMissedOrder, isNetworkOnline]);

  const handleDelivered = () => {
    if (!isNetworkOnline) return;
    // Push order into earnings history before completing
    if (activeOrder) {
      addCompletedOrder({
        id: activeOrder.id,
        restaurant: activeOrder.restaurant,
        distance: activeOrder.distance,
        earning: activeOrder.earning,
        type: 'food',
      });
    }
    completeOrder();
    if (onOrderComplete) onOrderComplete();
  };

  if (status === 'IDLE') return null;

  // RINGING — collapsible bottom tray with minimize/restore
  if (status === 'RINGING') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
        <audio ref={audioRef} loop src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
        
        <AnimatePresence mode="wait">
          {isMinimized ? (
            /* Minimized Pill — tappable to restore */
            <motion.button
              key="minimized"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={() => setIsMinimized(false)}
              className="pointer-events-auto mx-4 mb-20 bg-[#1E1E1E] border border-gray-700 rounded-2xl px-5 py-3 flex justify-between items-center shadow-[0_-4px_30px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-swiggy opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-swiggy"></span></span>
                <span className="text-white font-bold text-sm">{availableOrders?.length} orders available</span>
              </div>
              <span className="text-red-400 font-bold text-sm">{timeLeft}s</span>
            </motion.button>
          ) : (
            /* Expanded Tray */
            <motion.div
              key="expanded"
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-[#1E1E1E] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-gray-800 flex flex-col pointer-events-auto"
              style={{ maxHeight: '65vh', marginBottom: '4rem' }}
            >
              {/* Handle bar + minimize button */}
              <div className="flex flex-col items-center pt-3 pb-1 px-5">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="flex items-center justify-center w-12 h-6 rounded-full bg-[#2A2A2A] border border-gray-700 mb-2 active:scale-90 transition-transform"
                  aria-label="Minimize orders tray"
                >
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="px-5 pb-2 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Available Orders ({availableOrders?.length})</h2>
                <span className="text-red-400 font-bold animate-pulse text-sm">{timeLeft}s remaining</span>
              </div>
               
              <div className="flex flex-col gap-3 px-5 pt-3 overflow-y-auto flex-1">
                {availableOrders?.map(order => (
                  <div key={order.id} className="bg-[#2A2A2A] rounded-2xl p-4 border border-gray-700 shadow-lg flex flex-col gap-3 transition-transform hover:scale-[1.01]">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-swiggy font-bold text-lg">{order.restaurant}</span>
                        <p className="text-gray-400 text-sm mt-1">{order.distance} &bull; {order.items}</p>
                      </div>
                      <div className="bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/30">
                        <span className="text-green-400 font-black text-xl">₹{order.earning}</span>
                      </div>
                    </div>
                    <button 
                      disabled={!isNetworkOnline}
                      onClick={() => acceptOrder(order.id)}
                      className="w-full mt-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 hover:from-green-500 hover:to-green-400"
                    >
                      Accept Order
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 flex-shrink-0">
                <button 
                  disabled={!isNetworkOnline}
                  onClick={() => {
                    rejectOrder();
                    if (onRejectOrder) onRejectOrder();
                  }}
                  className="w-full text-red-400 font-bold py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/20 active:scale-95 transition-all text-center"
                >
                  Reject All Orders
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Active Bottom Sheet (NAV_PICKUP, AT_PICKUP, NAV_DROP, AT_DROP, PAYMENT)
  // Positioned above the bottom navigation bar (bottom: 4rem)
  return (
    <div className="absolute left-0 w-full z-40 animate-in slide-in-from-bottom duration-300" style={{ bottom: '4rem' }}>
      <div className="bg-[#1E1E1E] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-800 backdrop-blur-xl bg-opacity-95">
        
        {status === 'NAV_PICKUP' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <h3 className="text-swiggy text-xs font-bold w-full text-center bg-swiggy/10 py-1.5 rounded-lg border border-swiggy/20 uppercase tracking-widest">Navigating to Restaurant</h3>
            <p className="text-3xl font-black text-white text-center mt-2">{activeOrder?.restaurant}</p>
            <button 
              disabled={!isNetworkOnline}
              onClick={() => setStatus('AT_PICKUP')}
              className={`w-full mt-4 bg-swiggy hover:bg-[#ff9947] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform ${!isNetworkOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Reached Pickup Location
            </button>
          </div>
        )}

        {status === 'AT_PICKUP' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <h3 className="text-white text-xl font-bold">Order {activeOrder?.id}</h3>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">Ready</span>
            </div>
            <div className="py-2">
              <p className="text-gray-400 text-sm mb-2 font-medium">Items to collect:</p>
              <p className="text-white font-medium bg-[#2A2A2A] p-4 rounded-xl border border-gray-700 shadow-inner">{activeOrder?.items}</p>
            </div>
            <button 
              disabled={!isNetworkOnline}
              onClick={() => setStatus('NAV_DROP')}
              className={`w-full mt-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform ${!isNetworkOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Confirm Order Picked Up
            </button>
          </div>
        )}

        {status === 'NAV_DROP' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <h3 className="text-blue-400 text-xs font-bold w-full text-center bg-blue-500/10 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-widest">Navigating to Customer</h3>
            <p className="text-3xl font-black text-white text-center mt-2">{activeOrder?.customer}</p>
            <button 
              disabled={!isNetworkOnline}
              onClick={() => setStatus('AT_DROP')}
              className={`w-full mt-4 bg-swiggy hover:bg-[#ff9947] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform ${!isNetworkOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Reached Drop Location
            </button>
          </div>
        )}

        {(status === 'AT_DROP' || status === 'PAYMENT') && (
          <div className="flex flex-col gap-4 items-center animate-in fade-in">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider w-full text-left">Payment Collection</h3>
            <div className="bg-white p-3 rounded-2xl w-48 h-48 flex items-center justify-center my-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-swiggy/10 group-hover:bg-swiggy/20 transition-colors z-0"></div>
              <div className="w-full h-full relative z-10 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockPayment&color=FC8019')] bg-contain bg-no-repeat bg-center"></div>
            </div>
            <p className="text-3xl font-extrabold text-white">Collect Cash: <span className="text-green-400">₹250</span></p>
            <button 
              disabled={!isNetworkOnline}
              onClick={handleDelivered}
              className={`w-full mt-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform ${!isNetworkOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Delivered Successfully
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
