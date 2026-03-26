import React, { useEffect, useState } from 'react';
import { transactionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DollarSign, Clock, CheckCircle, Wallet, ArrowRight, ArrowUpCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import WithdrawalModal from '../components/common/WithdrawalModal';

const safeFormat = (d, str) => {
  const dateStr = d ? new Date(d) : null;
  return dateStr && isValid(dateStr) ? format(dateStr, str) : 'Unknown Date';
};

export default function Earnings() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    transactionsAPI.my()
      .then(res => setTransactions(res.data))
      .catch(() => toast.error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading earnings data..." />;

  const pendingEscrow = transactions.filter(t => t.status === 'escrow_held').reduce((acc, t) => acc + parseFloat(t.net_amount || 0), 0);
  const totalEarnings = parseFloat(user.total_earnings || 0);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">My Earnings</h1>
          <p className="text-slate-400 font-medium">Track your completed payouts and funds currently secured in escrow.</p>
        </div>
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="bg-[#14a800] hover:bg-[#108a00] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-[#14a800]/20 transition-all active:scale-95 group"
        >
          <ArrowUpCircle size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          Withdraw Funds
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="p-10 rounded-[40px] bg-gradient-to-br from-[#14a800]/20 to-emerald-900/10 border border-[#14a800]/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Wallet size={120} />
          </div>
          <p className="text-sm font-black text-[#14a800] uppercase tracking-[0.2em] mb-4">Available for Payout</p>
          <h2 className="text-5xl font-display font-bold text-white mb-2">KES {totalEarnings.toLocaleString()}</h2>
          <p className="text-sm text-slate-500 font-medium">Funds released from strictly completed milestones</p>
        </div>

        <div className="p-10 rounded-[40px] bg-[#1c2237]/50 border border-white/5 shadow-2xl relative overflow-hidden">
          <p className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Pending in Escrow</p>
          <h2 className="text-5xl font-display font-bold text-white mb-2">KES {pendingEscrow.toLocaleString()}</h2>
          <p className="text-sm text-slate-500 font-medium">Secured funds awaiting client approval of submission</p>
        </div>
      </div>

      <div className="bg-[#1c2237] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-xl">Earnings History</h2>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
             <Clock size={14} /> Real-time Ledger
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-24 text-center text-slate-600">
            <DollarSign className="w-16 h-16 mx-auto mb-6 opacity-5" />
            <p className="text-lg font-bold text-slate-500">No earnings history detected</p>
            <p className="text-sm">Completed project payments will automatically appear in your ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0F1E]/50 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                  <th className="p-6">Date Registered</th>
                  <th className="p-6">Project Context</th>
                  <th className="p-6">Client Name</th>
                  <th className="p-6">Platform Net Pay</th>
                  <th className="p-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {transactions.map(t => (
                  <tr key={t.tid} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6 text-slate-400 font-medium">
                      {safeFormat(t.created_at, 'MMM d, yyyy')}
                    </td>
                    <td className="p-6">
                       <p className="text-white font-bold group-hover:text-[#14a800] transition-colors">{t.project_title}</p>
                       <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">KES {parseFloat(t.amount).toLocaleString()} Gross</p>
                    </td>
                    <td className="p-6 text-slate-300 font-semibold">{t.brand_name}</td>
                    <td className="p-6 font-display font-bold text-[#14a800] text-lg">KES {parseFloat(t.net_amount).toLocaleString()}</td>
                    <td className="p-6 text-right">
                      {t.status === 'escrow_held' ? (
                        <span className="bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Secured</span>
                      ) : (
                        <span className="bg-[#14a800]/10 text-[#14a800] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#14a800]/20">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
        balance={totalEarnings}
        onRefresh={() => refreshUser()}
      />
    </div>
  );
}
