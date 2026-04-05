import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldAlert, MoreVertical, X } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';

export const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const status = useOrderStore((s) => s.status);

  const handleSOS = () => {
    const confirmSOS = window.confirm("Dispatch Emergency Services to your location?");
    if (confirmSOS) {
      console.log('Sending SOS...');
    }
  };

  // Dynamically compute bottom offset so the FAB always floats above visible trays
  // Nav bar = 4rem, Earnings footer ~8rem above nav, active order sheets ~14rem above nav
  const getBottomOffset = () => {
    switch (status) {
      case 'RINGING':     return '6rem';       // minimal — ringing tray is fullscreen-ish
      case 'NAV_PICKUP':  return '18rem';
      case 'AT_PICKUP':   return '22rem';
      case 'NAV_DROP':    return '18rem';
      case 'AT_DROP':
      case 'PAYMENT':     return '30rem';
      default:            return '14rem';       // IDLE — above earnings card + nav
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.05 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <motion.div
      className="fixed right-4 z-[999] flex flex-col items-end gap-2 pointer-events-none"
      animate={{ bottom: getBottomOffset() }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            exit="hidden"
            className="flex flex-col gap-2.5 items-end mb-2 pointer-events-auto"
          >
            <motion.button 
              variants={itemVariants} 
              className="flex items-center gap-2.5 bg-[#1E1E1E]/95 backdrop-blur-md text-gray-200 font-semibold py-2.5 pl-4 pr-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-gray-700/60 active:scale-95 transition-transform text-sm tracking-wide"
            >
              <Phone size={16} className="text-blue-400" />
              <span>Support</span>
            </motion.button>

            <motion.button 
              variants={itemVariants}
              onClick={handleSOS}
              className="flex items-center gap-2.5 bg-red-600/90 backdrop-blur-md text-white font-semibold py-2.5 pl-4 pr-3 rounded-xl shadow-[0_4px_20px_rgba(220,38,38,0.4)] border border-red-500/50 active:scale-95 transition-transform text-sm tracking-wide"
            >
              <ShieldAlert size={16} />
              <span>SOS Emergency</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-[#1E1E1E]/90 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-gray-700/60 text-gray-300 flex items-center justify-center transition-all active:scale-90 pointer-events-auto hover:bg-[#2A2A2A]"
      >
        {isOpen 
          ? <X size={20} strokeWidth={2.5} className="transition-transform" /> 
          : <MoreVertical size={20} strokeWidth={2.5} className="transition-transform" />
        }
      </button>
    </motion.div>
  );
};
