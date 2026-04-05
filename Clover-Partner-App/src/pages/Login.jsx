import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleGetOtp = () => {
    if (phone.length === 10) {
      navigate('/otp', { state: { phone } });
    }
  };

  return (
    <motion.div 
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col h-[100dvh] w-full items-center justify-center bg-[#121212] p-6"
    >
      <div className="flex flex-col items-center w-full max-w-sm mt-[-10dvh]">
        
        {/* Swiggy Logo Placeholder */}
        <div className="bg-swiggy w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(252,128,25,0.3)] border border-[#ff9947]">
          <span className="text-white font-black text-5xl">S</span>
        </div>
        
        {/* Headers */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-wide text-center">Welcome Partner</h1>
        <p className="text-gray-400 font-medium text-center">Enter your mobile number to continue</p>
        
        {/* Mobile Input Group */}
        <div className="flex w-full mt-10 mb-8 bg-[#1A1A1A] border-2 border-[#333] focus-within:border-swiggy focus-within:shadow-[0_0_20px_rgba(252,128,25,0.15)] rounded-2xl overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-center bg-[#2A2A2A] px-5 border-r border-[#333]">
            <span className="text-gray-300 font-bold text-xl tracking-wider">+91</span>
          </div>
          <input 
            type="tel"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ''); // Accept only digits dynamically
              if (val.length <= 10) setPhone(val);
            }}
            className="flex-grow bg-transparent text-white font-black text-2xl px-5 py-4 focus:outline-none tracking-widest placeholder-gray-600"
            placeholder="00000 00000"
          />
        </div>
        
        {/* Action Button */}
        <button 
          disabled={phone.length !== 10}
          onClick={handleGetOtp}
          className={`w-full h-14 bg-swiggy text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-95 ${
            phone.length !== 10 ? 'opacity-50 cursor-not-allowed saturate-50' : 'hover:bg-[#ff9947] shadow-[0_4px_20px_rgba(252,128,25,0.4)]'
          }`}
        >
          Get OTP
        </button>
        
      </div>
    </motion.div>
  );
};
