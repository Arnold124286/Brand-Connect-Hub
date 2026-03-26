import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 bg-[#14a800] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold text-[#001e00]">Brand<span className="text-[#14a800]">Connect</span> Hub</span>
        </Link>

        {/* Form Card */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-8 md:p-10 shadow-sm border-b-4 border-b-[#14a800]/10">
          <h1 className="font-display text-3xl font-bold text-[#001e00] mb-2 text-center">Log in</h1>
          <p className="text-[#5e6d55] mb-8 text-center text-[15px]">Sign in to continue to BrandConnect</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#001e00] uppercase tracking-wider ml-1">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] focus:ring-1 focus:ring-[#14a800]/20 transition-all font-medium"
                placeholder="email@example.com"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[13px] font-bold text-[#001e00] uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" size={13} className="text-[13px] font-bold text-[#14a800] hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="w-full px-4 py-3 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] focus:ring-1 focus:ring-[#14a800]/20 transition-all font-medium pr-12"
                  placeholder="••••••••" 
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#14a800] transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#14a800] hover:bg-[#108a00] text-white font-bold w-full py-4 rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4 shadow-lg shadow-[#14a800]/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Connect <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
             <div className="p-4 rounded-2xl bg-[#f2f7f2] border border-[#14a800]/10">
                <p className="text-[#5e6d55] text-[12px] font-bold uppercase tracking-wider mb-2 text-center">Demo Account</p>
                <p className="text-[#001e00] text-sm font-medium break-all whitespace-pre-wrap">admin@brandconnecthub.com</p>
                <p className="text-[#5e6d55] text-xs font-mono mt-1">Admin@BCH2024!</p>
             </div>
          </div>
        </div>

        <p className="mt-10 text-center text-[#5e6d55] font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#14a800] hover:underline font-bold">Sign Up</Link>
        </p>
        
        <div className="mt-12 text-center">
           <p className="text-[12px] text-gray-400 font-medium">© 2026 Brand Connect Hub Inc.</p>
        </div>
      </div>
    </div>
  );
}
