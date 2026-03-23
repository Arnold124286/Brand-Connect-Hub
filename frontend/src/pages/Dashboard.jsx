import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, bidsAPI, transactionsAPI, notificationsAPI } from '../utils/api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FolderOpen, Users, CreditCard, TrendingUp, Plus, ArrowRight, Clock, CheckCircle, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_BADGES = {
  open: 'badge-amber', in_progress: 'badge-blue', completed: 'badge-green',
  cancelled: 'badge-red', in_review: 'badge-slate', disputed: 'badge-red',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user.userType === 'brand') {
          const [projects, transactions, notifications] = await Promise.all([
            projectsAPI.my(),
            transactionsAPI.my(),
            notificationsAPI.list(),
          ]);
          setData({ projects: projects.data, transactions: transactions.data, notifications: notifications.data });
        } else {
          const [bids, transactions, notifications] = await Promise.all([
            bidsAPI.myBids(),
            transactionsAPI.my(),
            notificationsAPI.list(),
          ]);
          setData({ bids: bids.data, transactions: transactions.data, notifications: notifications.data });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const isBrand = user.userType === 'brand';

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Good day, <span className="text-amber-400">{user.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isBrand && (
          <Link to="/projects/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Post Project
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isBrand ? (
          <>
            <StatCard icon={FolderOpen} label="Total Projects" color="amber"
              value={data?.projects?.length ?? 0}
              sub={`${data?.projects?.filter(p => p.status === 'open').length ?? 0} open`} />
            <StatCard icon={Users} label="Hired Vendors" color="blue"
              value={data?.projects?.filter(p => p.status === 'in_progress').length ?? 0}
              sub="active projects" />
            <StatCard icon={CreditCard} label="Total Spent" color="green"
              value={`KES ${(data?.transactions?.reduce((s, t) => s + parseFloat(t.amount), 0) || 0).toLocaleString()}`}
              sub={`${data?.transactions?.length ?? 0} transactions`} />
            <StatCard icon={TrendingUp} label="Completed" color="purple"
              value={data?.projects?.filter(p => p.status === 'completed').length ?? 0}
              sub="projects delivered" />
          </>
        ) : (
          <>
            <StatCard icon={Star} label="Total Bids" color="amber"
              value={data?.bids?.length ?? 0}
              sub={`${data?.bids?.filter(b => b.status === 'accepted').length ?? 0} accepted`} />
            <StatCard icon={FolderOpen} label="Active Projects" color="blue"
              value={data?.bids?.filter(b => b.status === 'accepted' && b.project_status === 'in_progress').length ?? 0} />
            <StatCard icon={CreditCard} label="Earnings" color="green"
              value={`KES ${(data?.transactions?.reduce((s, t) => s + parseFloat(t.net_amount || 0), 0) || 0).toLocaleString()}`}
              sub="net after platform fee" />
            <StatCard icon={CheckCircle} label="Completed" color="purple"
              value={data?.bids?.filter(b => b.project_status === 'completed').length ?? 0} />
          </>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent projects / bids */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">
              {isBrand ? 'Recent Projects' : 'Recent Bids'}
            </h2>
            <Link to={isBrand ? '/projects' : '/my-bids'}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {(isBrand ? data?.projects : data?.bids)?.slice(0, 6).map((item) => (
              <div key={item.pid || item.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0A0F1E] border border-slate-800">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {isBrand ? item.title : item.project_title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={STATUS_BADGES[item.status] || 'badge-slate'}>
                    {(item.status || '').replace('_', ' ')}
                  </span>
                  {isBrand && (
                    <span className="text-xs text-slate-500">
                      KES {parseFloat(item.budget_min).toLocaleString()}–{parseFloat(item.budget_max).toLocaleString()}
                    </span>
                  )}
                  {!isBrand && (
                    <span className="text-xs text-amber-400 font-semibold">
                      KES {parseFloat(item.bid_amount).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!isBrand ? data?.bids : data?.projects)?.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No {isBrand ? 'projects' : 'bids'} yet.{' '}
                <Link to={isBrand ? '/projects/new' : '/marketplace'} className="text-amber-400">
                  {isBrand ? 'Post your first project →' : 'Browse projects →'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="font-display font-bold text-white mb-5">Notifications</h2>
          <div className="space-y-3">
            {data?.notifications?.slice(0, 6).map((n) => (
              <div key={n.id} className={`p-3 rounded-lg border text-xs ${!n.is_read ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-[#0A0F1E]'}`}>
                <p className="font-semibold text-slate-200">{n.title}</p>
                <p className="text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-slate-600 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
            {data?.notifications?.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No notifications yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
