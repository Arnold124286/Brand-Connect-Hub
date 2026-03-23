import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorsAPI, categoriesAPI } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Search, Star, Users, Filter, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorBrowse() {
  const [vendors, setVendors] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', min_rate: '', max_rate: '' });

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await vendorsAPI.list({ ...f });
      setVendors(res.data);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    categoriesAPI.list().then(r => setCats(r.data)).catch(() => {});
    load();
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Find Vendors</h1>
        <p className="text-slate-500 text-sm mt-1">Discover {vendors.length}+ verified creative professionals</p>
      </div>

      {/* Filters */}
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
          <label className="label">Min Rate (KES/hr)</label>
          <input type="number" className="input" placeholder="0"
            value={filters.min_rate} onChange={e => setFilters(f => ({...f, min_rate: e.target.value}))} />
        </div>
        <div className="w-36">
          <label className="label">Max Rate (KES/hr)</label>
          <input type="number" className="input" placeholder="any"
            value={filters.max_rate} onChange={e => setFilters(f => ({...f, max_rate: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <button onClick={() => load()} className="btn-primary flex items-center gap-2">
            <Filter size={14} /> Apply Filters
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Searching vendors..." /> :
       vendors.length === 0 ? (
         <EmptyState icon={Users} title="No vendors found"
           description="Try adjusting your filters to find more vendors."
           action={<button onClick={() => { setFilters({ category:'',min_rate:'',max_rate:'' }); load({ category:'',min_rate:'',max_rate:'' }); }} className="btn-primary">Clear Filters</button>} />
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {vendors.map(v => (
             <Link key={v.id} to={`/vendors/${v.id}`} className="card-hover group block">
               <div className="flex items-start gap-3 mb-4">
                 <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-display shrink-0">
                   {v.full_name?.[0]?.toUpperCase() || 'V'}
                 </div>
                 <div className="min-w-0">
                   <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">{v.full_name}</h3>
                   <div className="flex items-center gap-1 mt-0.5">
                     <MapPin size={11} className="text-slate-500" />
                     <span className="text-xs text-slate-500">{v.country || 'Kenya'}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 ml-auto shrink-0">
                   <Star size={12} className="text-amber-400 fill-amber-400" />
                   <span className="text-xs font-semibold text-amber-400">{parseFloat(v.avg_rating || 0).toFixed(1)}</span>
                   <span className="text-xs text-slate-500">({v.total_reviews || 0})</span>
                 </div>
               </div>

               {v.bio && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{v.bio}</p>}

               <div className="flex flex-wrap gap-1.5 mb-3">
                 {(v.specializations || []).slice(0, 3).map(s => (
                   <span key={s} className="badge-slate">{s}</span>
                 ))}
               </div>

               <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                 <span className="text-xs text-slate-500">{v.years_experience ?? 0} yrs experience</span>
                 {v.hourly_rate && (
                   <span className="text-sm font-semibold text-amber-400">
                     KES {parseFloat(v.hourly_rate).toLocaleString()}/hr
                   </span>
                 )}
               </div>
             </Link>
           ))}
         </div>
       )
      }
    </div>
  );
}
