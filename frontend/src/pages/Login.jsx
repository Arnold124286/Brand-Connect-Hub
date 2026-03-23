import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500/20 via-midnight-50 to-midnight relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTllMGIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0yMHY2aC02di02aDZ6TTggMTR2Nmgtdjhoos8tNlY4aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-midnight" strokeWidth={2.5} />
            </div>
            <span className="font-display text-3xl font-bold text-white">Brand<span className="text-amber-400">Connect</span> Hub</span>
          </div>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            The premier marketplace connecting brands with verified creative service professionals across East Africa.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['500+', 'Verified Vendors'], ['1,200+', 'Projects Done'], ['98%', 'Satisfaction']].map(([val, lbl]) => (
              <div key={lbl} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="font-display text-2xl font-bold text-amber-400">{val}</div>
                <div className="text-xs text-slate-400 mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-midnight">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-midnight" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-white">Brand<span className="text-amber-400">Connect</span> Hub</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>Demo credentials:</strong> admin@brandconnecthub.com / Admin@BCH2024!
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to BCH?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
