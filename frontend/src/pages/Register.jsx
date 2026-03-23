import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Building2, Briefcase } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', userType: 'brand', phone: '', country: 'Kenya' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to BCH.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-midnight">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-midnight" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-white">Brand<span className="text-amber-400">Connect</span> Hub</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-1">Create account</h1>
        <p className="text-slate-500 mb-6">Join the premier creative marketplace</p>

        {/* Account type */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { type: 'brand', Icon: Building2, label: 'Brand', sub: 'Post projects & hire' },
            { type: 'vendor', Icon: Briefcase, label: 'Vendor', sub: 'Offer your services' },
          ].map(({ type, Icon, label, sub }) => (
            <button key={type} type="button" onClick={() => setForm({...form, userType: type})}
              className={`p-4 rounded-xl border text-left transition-all ${
                form.userType === type
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}>
              <Icon size={18} className={form.userType === type ? 'text-amber-400 mb-2' : 'text-slate-500 mb-2'} />
              <p className={`text-sm font-semibold ${form.userType === type ? 'text-amber-400' : 'text-slate-300'}`}>{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Jane Muthoni" value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="jane@company.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+254..." value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">Country</label>
              <select className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                {['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana', 'South Africa', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min 8 characters" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 mt-2">
            {loading && <span className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating account...' : `Join as ${form.userType === 'brand' ? 'Brand' : 'Vendor'}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
