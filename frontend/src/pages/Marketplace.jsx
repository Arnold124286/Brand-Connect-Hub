import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, categoriesAPI } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Briefcase, Clock, Users, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const [projects, setProjects] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', budget_min: '', budget_max: '' });

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await projectsAPI.list({ status: 'open', ...f });
      setProjects(res.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    categoriesAPI.list().then(r => setCats(r.data)).catch(() => {});
    load();
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Project Marketplace</h1>
        <p className="text-slate-500 text-sm mt-1">Browse open projects and submit your proposals</p>
      </div>

      <div className="card mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="label">Category</label>
          <select className="input" value={filters.category}
            onChange={e => setFilters(f => ({...f, category: e.target.value}))}>
            <option value="">All categories</option>
            {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="label">Min Budget (KES)</label>
          <input type="number" className="input" placeholder="0"
            value={filters.budget_min} onChange={e => setFilters(f => ({...f, budget_min: e.target.value}))} />
        </div>
        <div className="w-36">
          <label className="label">Max Budget (KES)</label>
          <input type="number" className="input" placeholder="any"
            value={filters.budget_max} onChange={e => setFilters(f => ({...f, budget_max: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <button onClick={() => load()} className="btn-primary flex items-center gap-2">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading marketplace..." /> :
       projects.length === 0 ? (
         <EmptyState icon={Briefcase} title="No open projects"
           description="No projects match your filters right now. Check back soon!" />
       ) : (
         <div className="space-y-4">
           {projects.map(p => (
             <Link key={p.pid} to={`/projects/${p.pid}`} className="card-hover block group">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex-1 min-w-0">
                   <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">{p.title}</h3>
                   <p className="text-sm text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                   <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                     <span className="badge-amber">{p.category}</span>
                     {p.industry && <span className="badge-slate">{p.industry}</span>}
                     <span className="flex items-center gap-1 text-slate-500">
                       <Users size={11} /> {p.bid_count ?? 0} bids
                     </span>
                     <span className="flex items-center gap-1 text-slate-500">
                       <Clock size={11} /> {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                     </span>
                   </div>
                 </div>
                 <div className="text-right shrink-0">
                   <p className="text-sm font-semibold text-amber-400">
                     KES {parseFloat(p.budget_min).toLocaleString()} – {parseFloat(p.budget_max).toLocaleString()}
                   </p>
                   <p className="text-xs text-slate-500 mt-0.5 capitalize">{p.budget_type}</p>
                   <span className="badge-green mt-2 inline-block">Open</span>
                 </div>
               </div>
             </Link>
           ))}
         </div>
       )
      }
    </div>
  );
}
