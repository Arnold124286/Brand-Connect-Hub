import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'amber' }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple:'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
