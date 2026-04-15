import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle, ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { authService } from '../services/authService';

export const Otp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const phone = location.state?.phone || '';

  // Redirect if no phone provided
  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  const handleChange = (index, e) => {
    let val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;
    
    val = val.substring(val.length - 1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.verifyOtp(phone, code);
      const nextRoute = result?.isProfileComplete ? '/dashboard' : '/register';

      setSuccess(nextRoute === '/dashboard' ? 'OTP verified! Redirecting to dashboard...' : 'OTP verified! Redirecting to registration...');
      
      // Store token from response
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }

      // Navigate to next step based on profile completeness
      setTimeout(() => {
        navigate(nextRoute, { state: { phone, otp: code }, replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await authService.sendOtp(phone);
      
      setSuccess('New OTP sent to your phone');
      setCountdown(30);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="public-shell flex flex-col min-h-[100dvh] w-full p-4 sm:p-6 lg:p-8"
    >
      <div className="mb-6">
        <CloverShellHeader
          title="OTP verification"
          subtitle="Confirm your mobile number and continue into Clover partner access."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Sparkles size={14} /> Secure login</span>}
          actions={[
            { label: 'Back', onClick: () => navigate(-1), tone: 'secondary', icon: <ArrowLeft size={14} />, chevron: false },
            { label: 'Login', onClick: () => navigate('/login'), tone: 'secondary', icon: <ShieldCheck size={14} />, chevron: false }
          ]}
          navItems={[
            { label: 'Home', to: '/' },
            { label: 'Login', to: '/login' },
            { label: 'OTP', to: '/otp' },
            { label: 'Register', to: '/register' }
          ]}
        />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="page-card overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles size={14} /> Clover secure login
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="section-title">Secure verification</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Verify your OTP</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                We sent a 4-digit code to <span className="font-bold text-slate-900">+91 {phone}</span>. Use the SMS code to continue into your Clover partner dashboard.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="soft-surface p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Step</p>
              <p className="mt-2 text-xl font-black text-slate-950">02 / 03</p>
              <p className="text-sm text-slate-600 mt-2">Confirm the code</p>
            </div>
            <div className="soft-surface p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Security</p>
              <p className="mt-2 text-xl font-black text-slate-950">OTP only</p>
              <p className="text-sm text-slate-600 mt-2">No password required</p>
            </div>
            <div className="soft-surface p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Timer</p>
              <p className="mt-2 text-xl font-black text-slate-950">00:{countdown.toString().padStart(2, '0')}</p>
              <p className="text-sm text-slate-600 mt-2">Resend window</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Enter the code from SMS. You can also press Enter to verify immediately.
          </div>

          {error && (
            <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 flex gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex gap-2">
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleVerify();
            }}
          >
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="tel"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(i, e)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`h-14 rounded-[1.25rem] border bg-white text-center text-2xl font-black tracking-widest text-slate-950 shadow-sm outline-none transition focus:-translate-y-0.5 ${
                    error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otp.join('').length !== 4 || loading}
              className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <Clock3 size={16} className="text-emerald-600" />
              {countdown > 0 ? (
                <span>
                  Resend available in <span className="font-bold text-slate-900">00:{countdown.toString().padStart(2, '0')}</span>
                </span>
              ) : (
                <button onClick={handleResendOtp} disabled={loading} className="font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50">
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Change phone number
            </button>
          </div>
        </div>

        <div className="page-card overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.25)]">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-200">Why this step matters</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Keep Clover partner access fast and secure.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              OTP verification protects partner accounts while keeping the login flow short, clear, and mobile friendly.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                <p className="text-sm uppercase tracking-wider font-bold text-emerald-200">Delivery ready</p>
                <p className="mt-2 text-base font-bold">Login, confirm, and move straight to your dashboard.</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                <p className="text-sm uppercase tracking-wider font-bold text-emerald-200">One-time code</p>
                <p className="mt-2 text-base font-bold">No password friction on mobile.</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                <p className="text-sm uppercase tracking-wider font-bold text-emerald-200">Partner flow</p>
                <p className="mt-2 text-base font-bold">Login → register → dashboard → live deliveries.</p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Didn&apos;t receive the code? Check SMS or spam and resend after the timer ends.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

