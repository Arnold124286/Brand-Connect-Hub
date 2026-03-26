import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, DollarSign, Star, TrendingUp, Bell, ChevronRight,
  CheckCircle2, Clock, X, FileText, Plus, Search, Wallet, MessageSquare, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import WithdrawalModal from '../components/common/WithdrawalModal';

export default function VendorDashboard() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [bids, setBids] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [openProjects, setOpenProjects]   = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const vendorStats = {
    earnings: parseFloat(user.total_earnings || 0),
    credits: parseFloat(user.credits || 0),
    rating: parseFloat(user.avg_rating || 0),
    totalReviews: user.total_reviews || 0
  };

  const loadData = async () => {
    try {
      const [b, n, p, r] = await Promise.all([
        api.get('/bids/my'),
        api.get('/notifications'),
        api.get('/projects?status=open&limit=6'),
        api.get(`/reviews/vendor/${user.uid}`).catch(() => ({ data: { reviews: [] } })), 
      ]);
      setBids(b.data.bids);
      setNotifications(n.data.notifications);
      setOpenProjects(p.data.projects);
      setReviews(r.data.reviews || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user.uid]);

  const withdrawBid = async (id) => {
    try {
      await api.put(`/bids/${id}/withdraw`);
      setBids(bs => bs.map(b => b.id === id ? { ...b, status: 'withdrawn' } : b));
      toast.success('Bid withdrawn.');
    } catch (err) { toast.error('Could not withdraw bid.'); }
  };

  if (loading) return (
    <div className="pt-[100px] min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#14a800]/20 border-t-[#14a800] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-[70px] min-h-screen bg-white font-body">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-semibold text-[#001e00]">Welcome back, {user.fullName.split(' ')[0]}</h1>
            <p className="text-[#5e6d55] text-lg font-medium">Find your next big opportunity today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <div className="bg-[#f2f7f2] px-6 py-4 rounded-3xl border border-[#14a800]/10 flex flex-col items-center">
                <span className="text-[11px] font-bold text-[#5e6d55] uppercase tracking-wider mb-1">Credits</span>
                <div className="flex items-center gap-1.5 text-[#14a800] font-bold text-xl"><Award size={18} /> {vendorStats.credits.toFixed(1)}</div>
             </div>
             <div className="bg-[#14a800] px-6 py-4 rounded-3xl flex flex-col items-center shadow-lg shadow-[#14a800]/10">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">Earnings</span>
                <div className="flex items-center gap-1.5 text-white font-bold text-xl">KES {vendorStats.earnings.toLocaleString()}</div>
             </div>
          </div>
        </div>

        <div className="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview',  label: 'Overview',       icon: <TrendingUp size={18} /> },
            { id: 'bids',      label: 'My Bids',        icon: <FileText size={18} /> },
            { id: 'earnings',  label: 'Earnings',      icon: <DollarSign size={18} /> },
            { id: 'reviews',   label: 'Reviews',        icon: <MessageSquare size={18} /> },
            { id: 'discover',  label: 'Find Work',     icon: <Search size={18} /> },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 pb-4 text-[15px] font-bold transition-all border-b-2 whitespace-nowrap ${
                tab === t.id ? 'border-[#14a800] text-[#14a800]' : 'border-transparent text-[#5e6d55] hover:text-[#001e00]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-display font-semibold text-[#001e00]">Recent Bid Proposals</h2>
                  </div>
                  <div className="space-y-4">
                     {bids.slice(0, 3).map(b => <BidCard key={b.id} bid={b} onWithdraw={withdrawBid} />)}
                  </div>
               </div>
            </div>
            <div className="space-y-8">
               <div className="bg-[#001e00] rounded-3xl p-8 text-white">
                  <h3 className="text-xl font-bold mb-4">Complete your profile</h3>
                  <Link to="/settings" className="bg-[#14a800] text-white font-bold px-6 py-2 rounded-full inline-block">Edit Profile</Link>
               </div>
            </div>
          </div>
        )}

        {tab === 'earnings' && (
           <div className="animate-fade-in max-w-4xl mx-auto space-y-10">
              <div className="bg-[#001e00] p-12 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                 <div>
                    <p className="text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4">Available for Withdrawal</p>
                    <p className="text-6xl font-display font-bold">KES {vendorStats.earnings.toLocaleString()}</p>
                 </div>
                 <button 
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="bg-[#14a800] hover:bg-[#108a00] text-white font-bold px-10 py-5 rounded-full text-lg shadow-xl shadow-[#14a800]/20 transition-all active:scale-95"
                 >
                    Withdraw Funds
                 </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-[40px] shadow-sm overflow-hidden">
                 <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-display font-bold text-[#001e00]">Financial Ledger</h2>
                    <span className="text-sm font-bold text-[#5e6d55]">Total Cleared: KES {vendorStats.earnings.toLocaleString()}</span>
                 </div>
                 <div className="p-20 text-center text-[#5e6d55]">
                    <Wallet size={64} className="mx-auto mb-6 text-gray-100" />
                    <p className="text-lg font-bold text-[#001e00]">No recent transactions</p>
                    <p className="text-sm">When you complete projects, your net pay will appear here.</p>
                 </div>
              </div>
           </div>
        )}

        {tab === 'reviews' && (
           <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
              {reviews.map(r => (
                 <div key={r.rid} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                    <h4 className="font-bold text-lg text-[#001e00] mb-2">{r.project_title}</h4>
                    <p className="text-[#5e6d55] italic">"{r.comment}"</p>
                 </div>
              ))}
              {reviews.length === 0 && <div className="p-20 text-center text-[#5e6d55]">No reviews yet.</div>}
           </div>
        )}

        {(tab === 'bids' || tab === 'discover') && (
           <div className="animate-fade-in space-y-6">
              {tab === 'bids' ? (
                 bids.map(b => <BidCard key={b.id} bid={b} onWithdraw={withdrawBid} full />)
              ) : (
                 <div className="grid md:grid-cols-2 gap-6">
                    {openProjects.map(p => (
                       <Link key={p.pid} to={`/project/${p.pid}`} className="bg-[#f9fdf9] border border-gray-100 p-8 rounded-[32px] hover:border-[#14a800]/30 transition-all group">
                          <h3 className="text-xl font-bold text-[#001e00] mb-4 group-hover:text-[#14a800]">{p.title}</h3>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100/50">
                             <span className="font-bold text-[#14a800]">KES {parseFloat(p.budget_max).toLocaleString()}</span>
                             <span className="text-sm font-bold text-[#5e6d55] uppercase tracking-wider">{p.category}</span>
                          </div>
                       </Link>
                    ))}
                 </div>
              )}
           </div>
        )}
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
        balance={vendorStats.earnings}
        onRefresh={() => refreshUser()}
      />

      <footer className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12 border-t border-gray-100 mt-20 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-xl font-display font-bold text-[#001e00]">Brand<span className="text-[#14a800]">Connect</span></span>
            <p className="text-sm text-gray-400">© 2026 Brand Connect Hub Inc.</p>
          </div>
      </footer>
    </div>
  );
}

function BidCard({ bid: b, onWithdraw, full }) {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
         <div className="flex-1">
            <h4 className="font-bold text-[#001e00] text-xl mb-2">{b.project_title}</h4>
            <div className="flex gap-4 text-sm font-bold text-[#14a800]">
               <span>KES {parseFloat(b.amount).toLocaleString()}</span>
               <span className="text-gray-300">·</span>
               <span className="text-[#5e6d55]">{b.status.toUpperCase()}</span>
            </div>
         </div>
         {b.status === 'pending' && (
           <button onClick={() => onWithdraw(b.id)} className="text-sm font-black text-red-500 uppercase tracking-widest hover:underline">Withdraw</button>
         )}
      </div>
    </div>
  );
}
