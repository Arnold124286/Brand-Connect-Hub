import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, DollarSign, Star, TrendingUp, Bell, ChevronRight,
  CheckCircle2, Clock, X, FileText, Plus, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const BID_COLORS = {
  pending:   'badge-amber',
  accepted:  'badge-green',
  rejected:  'badge-red',
  withdrawn: 'badge-gray',
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [bids, setBids] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [openProjects, setOpenProjects]   = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = {
    totalBids:    bids.length,
    activeBids:   bids.filter(b => b.status === 'pending').length,
    accepted:     bids.filter(b => b.status === 'accepted').length,
    totalEarnings: bids
      .filter(b => b.status === 'accepted')
      .reduce((s, b) => s + parseFloat(b.amount || 0), 0),
  };

  useEffect(() => {
    Promise.all([
      api.get('/bids/my').then(r => setBids(r.data.bids)),
      api.get('/notifications').then(r => setNotifications(r.data.notifications)),
      api.get('/projects?status=open&limit=6').then(r => setOpenProjects(r.data.projects)),
    ])
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const withdrawBid = async (id) => {
    try {
      await api.put(`/bids/${id}/withdraw`);
      setBids(bs => bs.map(b => b.id === id ? { ...b, status: 'withdrawn' } : b));
      toast.success('Bid withdrawn.');
    } catch (err) {
      toast.error('Could not withdraw bid.');
    }
  };

  if (loading) return (
    <div className="pt-16 min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-surface-400 text-sm">Loading dashboard…</div>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Hello, {user.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-surface-500 mt-1">Track your bids and discover new projects</p>
          </div>
          <Link to="/search?type=projects" className="btn-primary flex items-center gap-2">
            <Search size={18} /> Browse Projects
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-8">
          {[
            { id: 'overview',  label: 'Overview',       icon: <TrendingUp size={15} /> },
            { id: 'bids',      label: 'My Bids',        icon: <FileText size={15} /> },
            { id: 'discover',  label: 'Discover',       icon: <Search size={15} /> },
            { id: 'notifications', label: 'Alerts',     icon: <Bell size={15} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard label="Total Bids"     value={stats.totalBids}              icon={<FileText size={20} />}      color="blue" />
              <StatCard label="Active Bids"    value={stats.activeBids}             icon={<Clock size={20} />}         color="amber" />
              <StatCard label="Projects Won"   value={stats.accepted}               icon={<CheckCircle2 size={20} />}  color="green" />
              <StatCard label="Est. Earnings"  value={`KES ${stats.totalEarnings.toLocaleString()}`} icon={<DollarSign size={20} />} color="purple" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-surface-900">Recent Bids</h2>
                <button onClick={() => setTab('bids')} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {bids.slice(0, 4).map(b => (
                  <BidRow key={b.id} bid={b} onWithdraw={withdrawBid} />
                ))}
                {!bids.length && (
                  <EmptyState
                    icon={<Briefcase size={32} />}
                    title="No bids yet"
                    desc="Browse open projects and start submitting proposals."
                    action={<Link to="/search?type=projects" className="btn-primary text-sm">Browse projects</Link>}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BIDS ── */}
        {tab === 'bids' && (
          <div className="animate-fade-in space-y-3">
            {bids.map(b => <BidRow key={b.id} bid={b} onWithdraw={withdrawBid} full />)}
            {!bids.length && (
              <EmptyState icon={<Briefcase size={32} />} title="No bids submitted" desc="Find a project and submit your first proposal." />
            )}
          </div>
        )}

        {/* ── DISCOVER ── */}
        {tab === 'discover' && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-lg text-surface-900 mb-5">Open Projects for You</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {openProjects.map(p => (
                <Link key={p.pid} to={`/project/${p.pid}`}
                  className="card p-5 hover:border-brand-200 cursor-pointer block">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-surface-900 leading-tight">{p.title}</h3>
                    <span className="badge-blue whitespace-nowrap">{p.category}</span>
                  </div>
                  <p className="text-sm text-surface-500 line-clamp-2 mb-4">{p.description}</p>
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span>Budget: <span className="text-surface-700 font-medium">KES {parseFloat(p.budget_max).toLocaleString()}</span></span>
                    <span>{p.bid_count || 0} bids so far</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/search?type=projects" className="btn-secondary text-sm">View all open projects</Link>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && (
          <div className="animate-fade-in space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`card p-4 flex gap-3 items-start ${!n.is_read ? 'border-brand-200' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-surface-900">{n.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-surface-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />}
              </div>
            ))}
            {!notifications.length && (
              <EmptyState icon={<Bell size={32} />} title="No notifications" desc="You're all caught up!" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BidRow({ bid: b, onWithdraw, full }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link to={`/project/${b.project_id}`} className="font-semibold text-surface-900 hover:text-brand-700 truncate">
            {b.project_title}
          </Link>
          <span className={BID_COLORS[b.status] || 'badge-gray'}>{b.status}</span>
        </div>
        <p className="text-sm text-surface-500">
          Bid: <span className="font-medium text-surface-700">KES {parseFloat(b.amount).toLocaleString()}</span>
          {' · '}{b.delivery_days} days delivery
        </p>
        {full && <p className="text-xs text-surface-400 mt-1 line-clamp-1">{b.proposal}</p>}
      </div>
      <div className="flex items-center gap-2">
        {b.status === 'pending' && (
          <button
            onClick={() => onWithdraw(b.id)}
            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Withdraw
          </button>
        )}
        <Link to={`/project/${b.project_id}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-400">
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="font-display text-2xl font-bold text-surface-900">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-100 text-surface-400 flex items-center justify-center mx-auto mb-4">{icon}</div>
      <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 mb-5">{desc}</p>
      {action}
    </div>
  );
}
