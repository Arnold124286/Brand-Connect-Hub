import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, bidsAPI, paymentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, DollarSign, Users, Star, Send, CheckCircle, Flag, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';

const safeFormat = (d, str) => {
  const dateStr = d ? new Date(d) : null;
  return dateStr && isValid(dateStr) ? format(dateStr, str) : 'Invalid Date';
};

const safeFormatDist = (d) => {
  const dateStr = d ? new Date(d) : null;
  return dateStr && isValid(dateStr) ? formatDistanceToNow(dateStr, { addSuffix: true }) : 'Unknown';
};

const STATUS_BADGE = {
  open: 'badge-amber', in_progress: 'badge-blue', completed: 'badge-green',
  cancelled: 'badge-red', in_review: 'badge-slate',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ proposal: '', bidAmount: '', deliveryDays: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    projectsAPI.get(id).then(r => setProject(r.data)).catch(() => toast.error('Project not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const submitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bidsAPI.submit({ projectId: id, ...bidForm });
      toast.success('Bid submitted!');
      setBidForm({ proposal: '', bidAmount: '', deliveryDays: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit bid');
    } finally { setSubmitting(false); }
  };

  const acceptBid = async (bid) => {
    try {
      const { data } = await paymentsAPI.createCheckoutSession({
        projectId: id,
        vendorId: bid.vendor_id,
        amount: bid.bid_amount,
        bidId: bid.id
      });
      toast.loading('Redirecting to Stripe...', { duration: 2000 });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
    }
  };

  const payWithWallet = async (bid) => {
    if (!window.confirm(`Pay KES ${bid.bid_amount} from your wallet?`)) return;
    if (parseFloat(user.wallet_balance) < parseFloat(bid.bid_amount)) {
      return toast.error('Insufficient wallet balance. Please fund your wallet.');
    }

    try {
      await api.post('/payments/pay-from-wallet', {
        projectId: id,
        vendorId: bid.vendor_id,
        amount: bid.bid_amount,
        bidId: bid.id
      });
      toast.success('Payment successful! Project is now in progress.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    }
  };

  const flagProject = async () => {
    if (!window.confirm('Are you sure you want to flag this project? This will notify the brand.')) return;
    try {
      await projectsAPI.post(`/${id}/flag`);
      toast.success('Project flagged.');
      load();
    } catch (err) {
      toast.error('Failed to flag project');
    }
  };

  const submitReview = async () => {
    const rating = prompt('Enter rating (1-5):');
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) return toast.error('Invalid rating');
    const comment = prompt('Enter a comment (optional):');
    
    try {
      await api.post('/reviews', {
        projectId: id,
        reviewerId: user.uid,
        revieweeId: project.assigned_vendor_uid,
        rating: parseInt(rating),
        comment: comment || ''
      });
      toast.success('Review submitted! Vendor credits updated.');
      load();
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner text="Loading project..." />;
  if (!project) return <div className="p-8 text-slate-500">Project not found.</div>;

  const isBrand = user.userType === 'brand';
  const isOwner = isBrand && project.brand_id === user.uid;
  const isVendor = user.userType === 'vendor';
  const hasBid = project.bids?.some(b => b.vendor_name === user.fullName);

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
              <span className={STATUS_BADGE[project.status] || 'badge-slate'}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{project.description}</p>

            <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-slate-800 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <DollarSign size={15} className="text-amber-400" />
                <span>KES {parseFloat(project.budget_min).toLocaleString()} – {parseFloat(project.budget_max).toLocaleString()}</span>
                <span className="badge-slate ml-1 capitalize">{project.budget_type}</span>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={15} className="text-blue-400" />
                  <span>Due {safeFormat(project.deadline, 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users size={15} className="text-green-400" />
                <span>{project.bids?.length ?? 0} bids received</span>
              </div>
            </div>

            {/* Actions for Vendor */}
            {isVendor && project.assigned_vendor_uid === user.uid && !project.is_flagged && (
              <div className="flex gap-3 mt-4">
                <button onClick={flagProject} className="btn-secondary text-red-400 border-red-400/30 bg-red-400/5 flex items-center gap-2">
                  <Flag size={14} /> Flag as Unpaid
                </button>
              </div>
            )}

            {/* Actions for Brand */}
            {isOwner && project.status === 'completed' && !project.has_review && (
              <div className="flex gap-3 mt-4">
                <button onClick={submitReview} className="btn-primary flex items-center gap-2">
                  <Star size={14} /> Review Vendor
                </button>
              </div>
            )}

            {project.skills_required?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map(s => <span key={s} className="badge-slate">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Bids list (brand sees bids) */}
          {isOwner && (
            <div className="card">
              <h2 className="font-display font-bold text-white mb-5">Bids ({project.bids?.length ?? 0})</h2>
              {project.bids?.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No bids yet. Check back soon.</p>
              ) : (
                <div className="space-y-4">
                  {project.bids.map(b => (
                    <div key={b.id} className={`p-4 rounded-lg border ${b.status === 'accepted' ? 'border-green-500/40 bg-green-500/5' : 'border-slate-800 bg-[#0A0F1E]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {b.vendor_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 text-sm">{b.vendor_name}</p>
                            <div className="flex items-center gap-1">
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs text-slate-500">{parseFloat(b.avg_rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-400">KES {parseFloat(b.bid_amount).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{b.delivery_days} days</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-3 line-clamp-2">{b.proposal}</p>
                      {b.status === 'accepted' ? (
                        <span className="badge-green mt-3 inline-flex items-center gap-1"><CheckCircle size={11} /> Accepted</span>
                      ) : project.status === 'open' ? (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => acceptBid(b)} className="btn-primary text-xs py-1.5 px-3">
                            Pay with Stripe
                          </button>
                          <button onClick={() => payWithWallet(b)} className="btn-secondary border-brand-500 text-brand-500 hover:bg-brand-500/10 text-xs py-1.5 px-3 font-bold">
                            Pay with Wallet
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vendor bid form */}
          {isVendor && project.status === 'open' && !hasBid && (
            <div className="card">
              <h2 className="font-display font-bold text-white mb-5">Submit Your Proposal</h2>
              <form onSubmit={submitBid} className="space-y-4">
                <div>
                  <label className="label">Your Proposal *</label>
                  <textarea className="input resize-none" rows={5}
                    placeholder="Describe your approach, relevant experience, and why you're the best fit..."
                    value={bidForm.proposal} onChange={e => setBidForm(b => ({...b, proposal: e.target.value}))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bid Amount (KES) *</label>
                    <input type="number" className="input" placeholder="15000" min="0"
                      value={bidForm.bidAmount} onChange={e => setBidForm(b => ({...b, bidAmount: e.target.value}))} required />
                  </div>
                  <div>
                    <label className="label">Delivery Days *</label>
                    <input type="number" className="input" placeholder="14" min="1"
                      value={bidForm.deliveryDays} onChange={e => setBidForm(b => ({...b, deliveryDays: e.target.value}))} required />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {submitting && <span className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />}
                  <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            </div>
          )}
          {isVendor && hasBid && (
            <div className="card border-amber-500/30 bg-amber-500/5">
              <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <CheckCircle size={16} /> You have already submitted a bid for this project.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Posted By</h3>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                {project.brand_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-sm">{project.brand_name}</p>
                <p className="text-xs text-slate-500">Brand</p>
              </div>
            </div>
          </div>
          <div className="card text-sm space-y-3">
            <h3 className="font-display font-bold text-white">Project Info</h3>
            <div className="flex justify-between"><span className="text-slate-500">Category</span><span className="text-slate-200">{project.category}</span></div>
            {project.industry && <div className="flex justify-between"><span className="text-slate-500">Industry</span><span className="text-slate-200">{project.industry}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-200 capitalize">{project.budget_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Posted</span>
              <span className="text-slate-200">{safeFormatDist(project.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
