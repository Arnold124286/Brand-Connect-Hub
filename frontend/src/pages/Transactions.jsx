import React, { useEffect, useState } from 'react';
import { transactionsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DollarSign, CheckCircle, Clock, ShieldCheck, Wallet, ArrowUpRight, History } from 'lucide-react';
import { format, isValid } from 'date-fns';
import UnifiedPaymentModal from '../components/common/UnifiedPaymentModal';

const safeFormat = (d, str) => {
  const dateStr = d ? new Date(d) : null;
  return dateStr && isValid(dateStr) ? format(dateStr, str) : 'Unknown Date';
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await transactionsAPI.my();
      setTransactions(data);
    } catch (err) {
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRelease = async (tid) => {
    if (!window.confirm('Are you sure you want to release these funds permanently to the vendor?')) return;
    try {
      await transactionsAPI.release(tid);
      toast.success('Funds released successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release funds');
    }
  };

  const handleFundConfirm = async (paymentData) => {
    try {
      // In a real app, this would call the backend to initiate M-Pesa or Stripe
      toast.loading(`Initiating ${paymentData.method.toUpperCase()} payment for KES ${paymentData.amount}...`);
      setIsModalOpen(false);
      
      // Simulate backend delay
      setTimeout(() => {
        toast.dismiss();
        toast.success(`Wallet funding initiated! Check your phone/email for confirmation.`);
      }, 2000);
    } catch (err) {
      toast.error('Payment initiation failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading escrow data..." />;

  const totalEscrowed = transactions.filter(t => t.status === 'escrow_held').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalReleased = transactions.filter(t => t.status === 'released').reduce((acc, t) => acc + parseFloat(t.amount), 0);

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-fade-in font-body">
      {/* Header Section (Image 1 Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 tracking-tight">Payments & Escrow</h1>
          <p className="text-slate-400 text-lg font-medium">Track funds held in escrow and release payments for completed milestones.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#14a800] hover:bg-[#108a00] text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-[#14a800]/20"
          >
            <Wallet size={18} /> Fund Wallet
          </button>
          <button 
            className="flex items-center gap-2 bg-[#1c2237] hover:bg-[#252c48] text-white px-6 py-3.5 rounded-2xl font-bold transition-all border border-slate-700"
            onClick={() => toast.info('Auto-release enabled for approved work')}
          >
            <ArrowUpRight size={18} /> Release Funds
          </button>
        </div>
      </div>

      {/* Stats Grid (Image 1 Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#1c2237] border border-slate-800 p-8 rounded-[32px] group hover:border-amber-500/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-1">Total in Escrow</p>
              <h2 className="text-4xl font-display font-bold text-white">KES {totalEscrowed.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <div className="bg-[#1c2237] border border-slate-800 p-8 rounded-[32px] group hover:border-green-500/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <CheckCircle size={32} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-green-500 uppercase tracking-[0.2em] mb-1">Total Released</p>
              <h2 className="text-4xl font-display font-bold text-white">KES {totalReleased.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History (Image 1 Style) */}
      <div className="bg-[#1c2237] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <History size={20} className="text-[#14a800]" />
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-[0.1em]">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-24 text-center">
            <DollarSign className="w-20 h-20 mx-auto mb-6 text-slate-700 opacity-20" />
            <p className="text-2xl font-bold text-slate-500 mb-2">No escrow transactions found.</p>
            <p className="text-slate-600">Once you initiate project payments, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                  <th className="p-6">Date</th>
                  <th className="p-6">Project Title</th>
                  <th className="p-6">Vendor</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {transactions.map(t => (
                  <tr key={t.tid} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-6 text-slate-400 font-medium whitespace-nowrap">
                      {safeFormat(t.created_at, 'MMM d, yyyy')}
                    </td>
                    <td className="p-6">
                      <p className="text-white font-bold group-hover:text-[#14a800] transition-colors">{t.project_title}</p>
                    </td>
                    <td className="p-6 text-slate-300 font-medium">{t.vendor_name}</td>
                    <td className="p-6">
                       <span className="text-lg font-display font-bold text-white">KES {parseFloat(t.amount).toLocaleString()}</span>
                    </td>
                    <td className="p-6 text-center">
                      {t.status === 'escrow_held' ? (
                        <span className="bg-amber-500/10 text-amber-500 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter inline-flex items-center gap-2">
                           <Clock size={12} /> Escrow
                        </span>
                      ) : (
                        <span className="bg-green-500/10 text-green-500 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter inline-flex items-center gap-2">
                           <CheckCircle size={12} /> Released
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      {t.status === 'escrow_held' ? (
                        <button 
                          onClick={() => handleRelease(t.tid)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-lg shadow-green-500/10"
                        >
                          Release
                        </button>
                      ) : (
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <UnifiedPaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleFundConfirm}
        amount={1000}
      />
    </div>
  );
}
