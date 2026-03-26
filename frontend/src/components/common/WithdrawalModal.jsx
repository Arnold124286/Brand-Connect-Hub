import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Wallet, Smartphone, Landmark, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function WithdrawalModal({ isOpen, onClose, balance, onRefresh }) {
  const [method, setMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (parseFloat(amount) > balance) return toast.error('Insufficient balance');
    if (!details) return toast.error('Please provide payment details');

    setLoading(true);
    try {
      await api.post('/payments/withdraw', { amount, method, details });
      toast.success('Withdrawal request submitted!');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#001e00]/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[480px] rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-[#001e00] mb-1 tracking-tight">Withdraw Funds</h2>
            <p className="text-[#5e6d55] text-sm font-medium">Available: <span className="text-[#14a800] font-bold">KES {balance.toLocaleString()}</span></p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setMethod('mpesa')}
                className={`p-5 border-2 rounded-3xl text-left transition-all ${
                  method === 'mpesa' ? 'border-[#14a800] bg-[#f2f7f2]' : 'border-gray-50 bg-gray-50/50 grayscale opacity-60'
                }`}
              >
                <Smartphone className="mb-3 text-[#14a800]" size={24} />
                <p className="font-bold text-[#001e00]">M-Pesa</p>
              </button>
              <button 
                type="button"
                onClick={() => setMethod('bank')}
                className={`p-5 border-2 rounded-3xl text-left transition-all ${
                  method === 'bank' ? 'border-[#14a800] bg-[#f2f7f2]' : 'border-gray-50 bg-gray-50/50 grayscale opacity-60'
                }`}
              >
                <Landmark className="mb-3 text-blue-600" size={24} />
                <p className="font-bold text-[#001e00]">Bank</p>
              </button>
            </div>

            <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Withdrawal Amount (KES)</label>
               <input 
                 type="number" 
                 required
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-2xl font-display font-bold text-[#001e00] focus:outline-none focus:border-[#14a800] transition-all"
                 placeholder="0.00"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">
                 {method === 'mpesa' ? 'M-Pesa Phone Number' : 'Bank Account Details (Name, Acc, Branch)'}
               </label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-[#001e00] font-bold focus:outline-none focus:border-[#14a800] transition-all"
                 placeholder={method === 'mpesa' ? '07XXXXXXXX' : 'Equity Bank, 1234..., Nairobi'}
                 value={details}
                 onChange={(e) => setDetails(e.target.value)}
               />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#14a800] hover:bg-[#108a00] text-white font-bold py-5 rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#14a800]/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 font-medium italic">
            <ShieldCheck size={12} className="inline mr-1" /> Withdrawals are processed within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
