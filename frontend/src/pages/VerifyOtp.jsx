import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Register.jsx navigates with { state: { email } }, so check state first
    const stateEmail = location.state?.email;
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const resolvedEmail = stateEmail || emailParam;

    if (!resolvedEmail) {
      toast.error('Missing email for verification');
      navigate('/register');
    } else {
      setEmail(resolvedEmail);
    }
  }, [location, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle paste — fill all 6 boxes at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return toast.error('Please enter the full 6-digit code');

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpCode });
      toast.success('Email verified successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md bg-white p-10 rounded-[32px] shadow-xl border border-surface-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-surface-950 mb-2">Check your email</h1>
          <p className="text-surface-500">
            We sent a 6-digit verification code to <br />
            <span className="font-semibold text-surface-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold bg-surface-50 border-2 border-surface-100 rounded-xl focus:border-brand-600 focus:bg-white outline-none transition-all"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 rounded-2xl"
          >
            {loading ? (
              <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Verify Email <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-surface-500">
            Didn't receive the email?{' '}
            <button className="text-brand-600 font-bold hover:underline">Resend code</button>
          </p>
          <Link to="/register" className="text-sm text-surface-400 hover:text-surface-600 flex items-center justify-center gap-1">
            Back to registration
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-50 flex items-center justify-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-widest">
          <ShieldCheck size={14} />
          Secure Verification
        </div>
      </div>
    </div>
  );
}
