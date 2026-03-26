import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  return (
    <div className="flex h-[80vh] items-center justify-center animate-fade-in p-8">
      <div className="card text-center max-w-md w-full py-12">
        <div className="flex justify-center mb-6">
          <CheckCircle className="text-green-500 w-20 h-20" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-slate-400 mb-8">
          Your funds have been securely placed in escrow. The vendor has been assigned to the project and notified.
        </p>
        <button onClick={() => navigate('/projects')} className="btn-primary w-full">
          View My Projects
        </button>
      </div>
    </div>
  );
}
