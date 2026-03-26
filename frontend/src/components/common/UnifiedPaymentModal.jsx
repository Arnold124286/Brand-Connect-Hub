import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Wallet, Globe, ArrowRight, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function UnifiedPaymentModal({ isOpen, onClose, onConfirm, amount: initialAmount }) {
  const [method, setMethod] = useState('mpesa');
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(initialAmount || 1000);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    if (method === 'mpesa') {
      if (!phoneNumber || phoneNumber.length < 10) {
        toast.error('Please enter a valid M-Pesa phone number');
        return;
      }
      setLoading(true);
      const tid = toast.loading('Initiating STK Push...');
      try {
        await api.post('/payments/mpesa/stkpush', { amount, phoneNumber });
        toast.dismiss(tid);
        toast.success('STK Push sent! Verify on your phone.');
        onClose();
      } catch (err) {
        toast.dismiss(tid);
        toast.error(err.response?.data?.error || 'Failed to initiate M-Pesa payment');
      } finally {
        setLoading(false);
      }
    } else {
      // Global Pay / Stripe
      setLoading(true);
      const tid = toast.loading('Redirecting to secure checkout...');
      try {
        // This is a simplified call, in real app it might need projectId etc or just deposit
        const { data } = await api.post('/payments/deposit', { amount });
        toast.dismiss(tid);
        toast.success('Wallet funded successfully (Demo mode)');
        onConfirm({ method, amount });
        onClose();
      } catch (err) {
        toast.dismiss(tid);
        toast.error('Payment failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      handlePayNow();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#001e00]/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-[#001e00] mb-1">Payment Details</h2>
            <p className="text-[#5e6d55] text-sm font-medium">Step {step} of 2 — {step === 1 ? 'Choose method' : 'Confirm & Pay'}</p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <button 
                onClick={() => setMethod('mpesa')}
                className={`w-full p-5 border-2 rounded-[24px] text-left transition-all flex items-center justify-between group ${
                  method === 'mpesa' ? 'border-[#14a800] bg-[#f2f7f2]' : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    method === 'mpesa' ? 'bg-[#14a800] text-white' : 'bg-gray-50 text-[#14a800]'
                  }`}>
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#001e00] text-lg">M-Pesa (Local)</p>
                    <p className="text-[#5e6d55] text-xs font-medium">Instant STK Push — Project Payments</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  method === 'mpesa' ? 'bg-[#14a800] scale-100' : 'bg-gray-100 scale-90'
                }`}>
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </button>

              <button 
                onClick={() => setMethod('global')}
                className={`w-full p-5 border-2 rounded-[24px] text-left transition-all flex items-center justify-between group ${
                  method === 'global' ? 'border-[#14a800] bg-[#f2f7f2]' : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    method === 'global' ? 'bg-[#14a800] text-white' : 'bg-gray-50 text-blue-500'
                  }`}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#001e00] text-lg">Card / Global Pay</p>
                    <p className="text-[#5e6d55] text-xs font-medium">Visa, Apple Pay, PayPal, Crypto</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  method === 'global' ? 'bg-[#14a800] scale-100' : 'bg-gray-100 scale-90'
                }`}>
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-[#f9fdf9] rounded-2xl border border-[#14a800]/10">
                <p className="text-[11px] font-bold text-[#5e6d55] uppercase tracking-widest mb-2">Amount to Fund (KES)</p>
                <input 
                  type="number" 
                  className="w-full bg-transparent border-none outline-none text-4xl font-display font-bold text-[#001e00]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              {method === 'mpesa' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">M-Pesa Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#14a800] transition-colors" size={18} />
                    <input 
                      type="tel" 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-[#001e00] font-bold focus:outline-none focus:border-[#14a800] transition-all"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[#5e6d55] text-xs font-medium px-2 italic">
                <ShieldCheck size={14} className="text-[#14a800]" />
                Securely handled via Safaricom Daraja Sandbox.
              </div>
            </div>
          )}

          <button 
            onClick={handleContinue}
            disabled={loading}
            className="w-full mt-10 bg-[#14a800] hover:bg-[#108a00] text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#14a800]/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (step === 1 ? 'Continue' : 'Initiate Payment')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 opacity-40 grayscale">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-full text-center mb-1">Secured by</span>
            <span className="text-xs font-black tracking-tighter">DARAJA</span>
            <span className="text-xs font-black tracking-tighter text-blue-600">PAYSTACK</span>
            <span className="text-xs font-black tracking-tighter text-amber-600">COINBASE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
