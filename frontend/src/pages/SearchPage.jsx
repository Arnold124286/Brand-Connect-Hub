import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, Users, DollarSign, Clock, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const CATEGORIES = ['Digital Marketing', 'Graphic Design', 'Advertising', 'Video Production', 'Photography', 'Copywriting'];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [type, setType]   = useState(params.get('type') || 'vendors');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: params.get('search') || '',
    category: params.get('category') || '',
    industry: '',
    rating: '',
    budgetMax: '',
  });

  useEffect(() => {
    fetchResults();
  }, [type, filters]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (type === 'vendors') {
        const q = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
        const res = await api.get(`/vendors?${q}`);
        setResults(res.data.vendors);
        setTotal(res.data.total);
      } else {
        const q = new URLSearchParams(Object.fromEntries(
          Object.entries({ search: filters.search, category: filters.category, budget_max: filters.budgetMax, status: 'open' })
            .filter(([, v]) => v)
        ));
        const res = await api.get(`/projects?${q}`);
        setResults(res.data.projects);
        setTotal(res.data.total);
      }
    } catch { } finally { setLoading(false); }
  };

  const f = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-surface-900 mb-6">
          {type === 'vendors' ? 'Find Creative Vendors' : 'Browse Open Projects'}
        </h1>

        {/* Type toggle */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-6">
          {['vendors', 'projects'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                type === t ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <Filter size={15} /> Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">Search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input className="input-field pl-8 text-sm" placeholder="Keywords…" value={filters.search} onChange={f('search')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">Category</label>
                  <select className="input-field text-sm" value={filters.category} onChange={f('category')}>
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {type === 'vendors' && (
                  <div>
                    <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">Min Rating</label>
                    <select className="input-field text-sm" value={filters.rating} onChange={f('rating')}>
                      <option value="">Any rating</option>
                      <option value="4">4+ stars</option>
                      <option value="4.5">4.5+ stars</option>
                    </select>
                  </div>
                )}
                {type === 'projects' && (
                  <div>
                    <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">Max Budget (KES)</label>
                    <input type="number" className="input-field text-sm" placeholder="e.g. 100000" value={filters.budgetMax} onChange={f('budgetMax')} />
                  </div>
                )}
                <button onClick={fetchResults} className="btn-primary w-full text-sm">Apply Filters</button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-surface-500">
                {loading ? 'Loading…' : `${total} ${type} found`}
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
              </div>
            ) : (
              <div className={type === 'vendors' ? 'grid md:grid-cols-2 gap-5' : 'space-y-4'}>
                {results.map(item => (
                  type === 'vendors'
                    ? <VendorCard key={item.uid} vendor={item} />
                    : <ProjectCard key={item.pid} project={item} />
                ))}
                {!results.length && (
                  <div className="card p-12 text-center col-span-2">
                    <Search size={32} className="text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500">No results found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorCard({ vendor: v }) {
  return (
    <Link to={`/vendor/${v.uid}`} className="card p-5 hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200 block">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
          {v.full_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 truncate">{v.full_name}</p>
          {v.company_name && <p className="text-xs text-surface-400 truncate">{v.company_name}</p>}
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-surface-600">{parseFloat(v.avg_rating || 0).toFixed(1)} ({v.total_reviews || 0})</span>
          </div>
        </div>
        {v.hourly_rate && (
          <div className="text-right">
            <p className="text-xs text-surface-400">from</p>
            <p className="font-semibold text-surface-900 text-sm">KES {parseFloat(v.hourly_rate).toLocaleString()}<span className="font-normal text-xs text-surface-400">/hr</span></p>
          </div>
        )}
      </div>
      {v.bio && <p className="text-xs text-surface-500 line-clamp-2 mb-3">{v.bio}</p>}
      {v.specializations?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {v.specializations.slice(0, 3).map(s => (
            <span key={s} className="badge-blue text-[11px]">{s}</span>
          ))}
          {v.specializations.length > 3 && <span className="badge-gray text-[11px]">+{v.specializations.length - 3}</span>}
        </div>
      )}
    </Link>
  );
}

function ProjectCard({ project: p }) {
  return (
    <Link to={`/project/${p.pid}`} className="card p-5 hover:border-brand-200 block">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-semibold text-surface-900">{p.title}</h3>
        <span className="badge-blue whitespace-nowrap">{p.category}</span>
      </div>
      <p className="text-sm text-surface-500 line-clamp-2 mb-4">{p.description}</p>
      <div className="flex items-center justify-between text-xs text-surface-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            KES {parseFloat(p.budget_max).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> {p.bid_count || 0} bids
          </span>
          {p.deadline && <span className="flex items-center gap-1"><Clock size={12} />{new Date(p.deadline).toLocaleDateString()}</span>}
        </div>
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}
