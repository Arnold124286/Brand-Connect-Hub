import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, ArrowRight, User, Briefcase, Lock, CheckCircle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'brand'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful! Please check your email for the OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white selection:bg-[#14a800]/20 selection:text-[#14a800]">
      <div className="w-full max-w-[500px]">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-[#14a800] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold text-[#001e00]">Brand<span className="text-[#14a800]">Connect</span> Hub</span>
        </Link>

        <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-sm border-b-4 border-[#14a800]/10">
          <h1 className="font-display text-3xl font-bold text-[#001e00] mb-2 text-center tracking-tight">Create your account</h1>
          
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { type: 'brand', label: 'I’m a client, hiring pro talent', icon: User },
                { type: 'vendor', label: 'I’m a freelancer, finding work', icon: Briefcase },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, userType: type })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 group relative overflow-hidden ${
                    form.userType === type 
                      ? 'border-[#14a800] bg-[#f2f7f2]' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    form.userType === type ? 'bg-[#14a800] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[13px] font-bold leading-tight ${
                    form.userType === type ? 'text-[#001e00]' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {form.userType === type && <CheckCircle size={14} className="absolute top-3 right-3 text-[#14a800]" />}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                placeholder="Janardan Singh"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Password</label>
                 <input
                   type="password"
                   className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                   placeholder="••••••••"
                   value={form.password}
                   onChange={(e) => setForm({ ...form, password: e.target.value })}
                   required
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Repeat Password</label>
                 <input
                   type="password"
                   className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                   placeholder="••••••••"
                   value={form.confirmPassword}
                   onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                   required
                 />
               </div>
            </div>
            
            <p className="text-[10px] text-[#5e6d55] italic px-1">Passwords must match and contain at least 8 characters.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#14a800] hover:bg-[#108a00] text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4 shadow-xl shadow-[#14a800]/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign Up Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[#5e6d55] font-medium">
          Already a member?{' '}
          <Link to="/login" className="text-[#14a800] hover:underline font-bold">Log In</Link>
        </p>

        <div className="mt-12 text-center">
          <p className="text-[12px] text-gray-300 font-medium tracking-wide">© 2026 Brand Connect Hub Inc.</p>
        </div>
      </div>
    </div>
  );
}
