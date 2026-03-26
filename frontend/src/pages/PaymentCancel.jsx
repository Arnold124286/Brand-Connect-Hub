import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[80vh] items-center justify-center animate-fade-in p-8">
      <div className="card text-center max-w-md w-full py-12">
        <div className="flex justify-center mb-6">
          <XCircle className="text-red-500 w-20 h-20" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-slate-400 mb-8">
          The checkout process was cancelled. No funds were captured and the bid was not accepted.
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary w-full">
          Go Back
        </button>
      </div>
    </div>
  );
}
