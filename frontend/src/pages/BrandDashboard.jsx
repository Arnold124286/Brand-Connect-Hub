import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, DollarSign, MessageSquare,
  Bell, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Star, Eye, FileText, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  open:        'badge-blue',
  in_progress: 'badge-amber',
  in_review:   'badge-amber',
  completed:   'badge-green',
  cancelled:   'badge-gray',
  disputed:    'badge-red',
};

export default function BrandDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('overview');
  const [projects, setProjects]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = {
    total:      projects.length,
    active:     projects.filter(p => p.status === 'in_progress').length,
    open:       projects.filter(p => p.status === 'open').length,
    completed:  projects.filter(p => p.status === 'completed').length,
    totalBids:  projects.reduce((s, p) => s + parseInt(p.bid_count || 0), 0),
  };

  useEffect(() => {
    Promise.all([
      api.get('/projects/my').then(r => setProjects(r.data.projects)),
      api.get('/notifications').then(r => setNotifications(r.data.notifications)),
    ])
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Welcome back, {user.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-surface-500 mt-1">Here's what's happening with your projects</p>
          </div>
          <Link to="/post-project" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Post Project
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
            { id: 'projects', label: 'My Projects', icon: <FolderOpen size={15} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              {t.icon} {t.label}
              {t.id === 'notifications' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="animate-fade-in space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard label="Total Projects" value={stats.total}     icon={<FolderOpen size={20}  />} color="blue" />
              <StatCard label="Active Now"     value={stats.active}    icon={<TrendingUp size={20}  />} color="amber" />
              <StatCard label="Open for Bids"  value={stats.open}      icon={<Clock size={20}       />} color="purple" />
              <StatCard label="Completed"      value={stats.completed} icon={<CheckCircle2 size={20}/>} color="green" />
            </div>

            {/* Recent projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-surface-900">Recent Projects</h2>
                <button onClick={() => setTab('projects')} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 4).map(p => (
                  <ProjectRow key={p.pid} project={p} />
                ))}
                {!projects.length && (
                  <EmptyState
                    icon={<FolderOpen size={32} />}
                    title="No projects yet"
                    desc="Post your first project to start receiving bids from verified vendors."
                    action={<Link to="/post-project" className="btn-primary text-sm">Post first project</Link>}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === 'projects' && (
          <div className="animate-fade-in">
            <div className="space-y-3">
              {projects.map(p => (
                <ProjectRow key={p.pid} project={p} full />
              ))}
              {!projects.length && (
                <EmptyState
                  icon={<FolderOpen size={32} />}
                  title="No projects posted"
                  desc="Post your first project to start connecting with vendors."
                  action={<Link to="/post-project" className="btn-primary text-sm">Post a project</Link>}
                />
              )}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifications' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-surface-900">Notifications</h2>
              {notifications.some(n => !n.is_read) && (
                <button onClick={markAllRead} className="text-sm text-brand-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`card p-4 flex gap-4 items-start ${!n.is_read ? 'border-brand-200 bg-brand-50/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.type === 'new_bid' ? 'bg-blue-100 text-blue-600' :
                    n.type === 'payment_released' ? 'bg-green-100 text-green-600' :
                    n.type === 'message' ? 'bg-purple-100 text-purple-600' :
                    'bg-surface-100 text-surface-500'
                  }`}>
                    {n.type === 'new_bid' ? <FileText size={15} /> :
                     n.type === 'payment_released' ? <DollarSign size={15} /> :
                     n.type === 'message' ? <MessageSquare size={15} /> :
                     <Bell size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 text-sm">{n.title}</p>
                    <p className="text-surface-500 text-xs mt-0.5">{n.body}</p>
                    <p className="text-surface-400 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                </div>
              ))}
              {!notifications.length && (
                <EmptyState icon={<Bell size={32} />} title="All caught up!" desc="You have no notifications." />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project: p, full }) {
  return (
    <Link to={`/project/${p.pid}`} className="card p-5 flex items-center gap-4 hover:border-brand-200 cursor-pointer block">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-surface-900 truncate">{p.title}</h3>
          <span className={STATUS_COLORS[p.status] || 'badge-gray'}>{p.status.replace('_', ' ')}</span>
        </div>
        <p className="text-sm text-surface-500 truncate">{p.category} · Budget: KES {parseFloat(p.budget_max).toLocaleString()}</p>
        {full && <p className="text-xs text-surface-400 mt-1 line-clamp-1">{p.description}</p>}
      </div>
      <div className="flex items-center gap-5 text-sm text-surface-500 flex-shrink-0">
        <div className="flex items-center gap-1"><Users size={14} /> {p.bid_count || 0} bids</div>
        <ChevronRight size={16} className="text-surface-300" />
      </div>
    </Link>
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

function DashboardSkeleton() {
  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}
