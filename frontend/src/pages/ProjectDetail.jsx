import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, bidsAPI, transactionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, DollarSign, Users, Star, Send, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

  const acceptBid = async (bidId) => {
    try {
      await bidsAPI.accept(bidId);
      toast.success('Bid accepted! Project is now in progress.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept bid');
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
                  <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users size={15} className="text-green-400" />
                <span>{project.bids?.length ?? 0} bids received</span>
              </div>
            </div>

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
                        <button onClick={() => acceptBid(b.id)} className="btn-primary mt-3 text-xs py-1.5 px-4">
                          Accept This Bid
                        </button>
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
              <span className="text-slate-200">{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
