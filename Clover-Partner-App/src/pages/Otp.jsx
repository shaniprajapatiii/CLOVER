import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft } from 'lucide-react';

export const Otp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);

  const phone = location.state?.phone || 'XX XXXX';

  // Cooldown logic
  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  const handleChange = (index, e) => {
    let val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return; // Strictly numeric parsing
    
    val = val.substring(val.length - 1); // Grab only the newest char natively
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-advance safely natively shifting arrays
    if (val && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    
    // Clear implicit errors natively
    if (errorMsg) setErrorMsg('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code === '1234') {
      login({ name: 'Delivery Partner', phone: `+91 ${phone}`, id: 'SWG-9901' });
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMsg('Invalid OTP. Try 1234');
    }
  };

  return (
    <motion.div 
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col h-[100dvh] w-full bg-[#121212] p-6 relative"
    >
      {/* Top Header Generic Actions */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-6 w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#333] active:scale-95 transition-transform"
      >
        <ArrowLeft className="text-white" size={24} />
      </button>

      <div className="flex flex-col w-full max-w-sm mx-auto mt-24">
        <h1 className="text-3xl font-black tracking-wide text-white mb-2">Verify Details</h1>
        <p className="text-gray-400 font-medium mb-10">OTP sent to <span className="text-white font-bold tracking-wider">+91 {phone}</span></p>

        {/* 4 Block Input Array Formats */}
        <div className="flex gap-4 justify-center mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="tel"
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={`w-14 h-16 bg-[#1A1A1A] border-2 rounded-xl text-center text-white text-3xl font-black shadow-inner transition-colors duration-200 outline-none ${
                errorMsg ? 'border-red-500 focus:border-red-500' : 'border-[#333] focus:border-swiggy'
              }`}
            />
          ))}
        </div>

        {/* Dynamic Error Status */}
        <div className="h-6 text-center mb-6">
          {errorMsg && <p className="text-red-500 font-bold animate-pulse">{errorMsg}</p>}
        </div>

        {/* Primary Call To Action */}
        <button 
          disabled={otp.join('').length !== 4}
          onClick={handleVerify}
          className={`w-full h-14 font-bold text-lg rounded-xl shadow-lg transition-all active:scale-95 ${
            otp.join('').length !== 4 
              ? 'bg-[#2A2A2A] text-gray-500 border border-[#333] cursor-not-allowed' 
              : 'bg-swiggy text-white hover:bg-[#ff9947] shadow-[0_4px_20px_rgba(252,128,25,0.4)]'
          }`}
        >
          Verify & Proceed
        </button>

        {/* Cooldown Extractor */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 font-medium tracking-wide">
            Resend OTP in <span className={`font-bold ${countdown === 0 ? 'text-swiggy cursor-pointer underline' : 'text-white'}`}>00:{countdown.toString().padStart(2, '0')}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
