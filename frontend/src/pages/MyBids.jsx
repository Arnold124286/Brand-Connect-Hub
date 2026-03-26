import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bidsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Clock, DollarSign, XCircle, CheckCircle, FileText, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';

const safeFormatDist = (d) => {
  const dateStr = d ? new Date(d) : null;
  return dateStr && isValid(dateStr) ? formatDistanceToNow(dateStr, { addSuffix: true }) : 'Unknown time';
};

const STATUS_BADGE = {
  pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  accepted: 'bg-green-500/10 text-green-500 border border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border border-red-500/20',
  withdrawn: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const STATUS_ICONS = {
  pending: <Clock size={14} />,
  accepted: <CheckCircle size={14} />,
  rejected: <XCircle size={14} />,
  withdrawn: <FileText size={14} />,
};

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBids = async () => {
    try {
      const { data } = await bidsAPI.myBids();
      setBids(data);
    } catch (err) {
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBids();
  }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;
    try {
      await bidsAPI.withdraw(id);
      toast.success('Bid withdrawn successfully');
      loadBids();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to withdraw bid');
    }
  };

  if (loading) return <LoadingSpinner text="Loading your bids..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">My Proposals</h1>
        <p className="text-slate-400">Track and manage the bids you've submitted to projects.</p>
      </div>

      {bids.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Bids Yet</h2>
          <p className="text-slate-400 mb-6">You haven't submitted any proposals to projects.</p>
          <Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bids.map(bid => (
            <div key={bid.id} className="card hover:border-slate-700 transition-colors">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/projects/${bid.project_id}`} className="font-display text-lg font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-2">
                      {bid.project_title} <ExternalLink size={14} className="text-slate-500" />
                    </Link>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 capitalize ${STATUS_BADGE[bid.status]}`}>
                      {STATUS_ICONS[bid.status]} {bid.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 text-slate-300">
                        <DollarSign size={12} />
                      </span>
                      <span>Budget: KES {parseFloat(bid.budget_min).toLocaleString()} - {parseFloat(bid.budget_max).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="badge-slate capitalize">{bid.category}</span>
                    </div>
                    <span>Submitted {safeFormatDist(bid.created_at)}</span>
                  </div>

                  <div className="bg-[#0A0F1E] rounded-lg p-4 border border-slate-800 relative">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Proposal</h4>
                    <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">{bid.proposal}</p>
                  </div>
                </div>

                <div className="md:w-64 flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                  <div className="text-left md:text-right w-full mb-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Your Bid</p>
                    <p className="text-2xl font-bold text-amber-400">KES {parseFloat(bid.bid_amount).toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-1">{bid.delivery_days} days delivery</p>
                  </div>

                  {bid.status === 'pending' && (
                    <button 
                      onClick={() => handleWithdraw(bid.id)}
                      className="w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                    >
                      Withdraw Bid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
