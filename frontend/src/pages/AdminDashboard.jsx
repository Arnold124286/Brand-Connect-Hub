import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Users, FolderOpen, CreditCard, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([adminAPI.stats(), adminAPI.pendingVendors()]);
      setStats(s.data);
      setPending(p.data);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id, status) => {
    try {
      await adminAPI.verifyVendor(id, status);
      toast.success(`Vendor ${status}`);
      load();
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading admin panel..." />;

  const totalUsers = stats?.users?.reduce((s, u) => s + parseInt(u.total), 0) || 0;
  const totalProjects = stats?.projects?.reduce((s, p) => s + parseInt(p.total), 0) || 0;

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Admin Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Platform-wide statistics and management</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="blue"
          sub={`${stats?.pendingVendors} pending verification`} />
        <StatCard icon={FolderOpen} label="Total Projects" value={totalProjects} color="amber" />
        <StatCard icon={CreditCard} label="Transactions" color="green"
          value={parseInt(stats?.transactions?.total || 0)}
          sub={`Vol: KES ${parseFloat(stats?.transactions?.volume || 0).toLocaleString()}`} />
        <StatCard icon={ShieldCheck} label="Pending Reviews" value={stats?.pendingVendors || 0} color="purple"
          sub="vendor approvals" />
      </div>

      {/* User type breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-display font-bold text-white mb-4">Users by Type</h2>
          <div className="space-y-3">
            {stats?.users?.map(u => (
              <div key={u.user_type} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{u.user_type}s</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (parseInt(u.total) / totalUsers) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 w-6">{u.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-white mb-4">Projects by Status</h2>
          <div className="space-y-3">
            {stats?.projects?.map(p => (
              <div key={p.status} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{p.status?.replace('_', ' ')}</span>
                <span className="text-xs font-semibold badge-slate">{p.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending vendor approvals */}
      <div className="card">
        <h2 className="font-display font-bold text-white mb-5">Pending Vendor Approvals ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No pending approvals. All caught up!</p>
        ) : (
          <div className="space-y-3">
            {pending.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 rounded-lg bg-[#0A0F1E] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {v.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 text-sm">{v.full_name}</p>
                    <p className="text-xs text-slate-500">{v.email}</p>
                    {v.specializations?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {v.specializations.slice(0, 2).map(s => <span key={s} className="badge-slate">{s}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => verify(v.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button onClick={() => verify(v.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
