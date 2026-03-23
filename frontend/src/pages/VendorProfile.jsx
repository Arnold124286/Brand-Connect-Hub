import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Globe, Linkedin, Briefcase, Award, MessageSquare, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function VendorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('services');

  useEffect(() => {
    api.get(`/vendors/${id}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="pt-24 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-brand-600" />
    </div>
  );

  if (!data) return (
    <div className="pt-24 text-center">
      <p className="text-surface-500">Vendor not found.</p>
    </div>
  );

  const { vendor, portfolio, services, reviews } = data;

  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      {/* Hero banner */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 font-bold text-3xl flex items-center justify-center flex-shrink-0 font-display">
              {vendor.full_name?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-surface-900">{vendor.full_name}</h1>
                  {vendor.company_name && <p className="text-surface-500 mt-0.5">{vendor.company_name}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={15} className="fill-current" />
                      <span className="font-semibold text-surface-900">{parseFloat(vendor.avg_rating || 0).toFixed(1)}</span>
                      <span className="text-surface-400 text-sm">({vendor.total_reviews || 0} reviews)</span>
                    </div>
                    {vendor.country && (
                      <div className="flex items-center gap-1 text-sm text-surface-400">
                        <MapPin size={13} /> {vendor.country}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {vendor.specializations?.map(s => <span key={s} className="badge-blue">{s}</span>)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {vendor.hourly_rate && (
                    <div className="text-right">
                      <p className="text-xs text-surface-400">Starting from</p>
                      <p className="font-display font-bold text-xl text-surface-900">
                        KES {parseFloat(vendor.hourly_rate).toLocaleString()}<span className="text-sm font-normal text-surface-400">/hr</span>
                      </p>
                    </div>
                  )}
                  {user && user.uid !== id && (
                    <Link to={`/search?type=projects`} className="btn-primary text-sm">
                      <MessageSquare size={14} className="inline mr-1.5" />
                      Hire {vendor.full_name?.split(' ')[0]}
                    </Link>
                  )}
                  <div className="flex gap-2">
                    {vendor.linkedin_url && <a href={vendor.linkedin_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-brand-600 transition-colors"><Linkedin size={16} /></a>}
                    {vendor.website_url  && <a href={vendor.website_url}  target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-brand-600 transition-colors"><Globe size={16} /></a>}
                  </div>
                </div>
              </div>
              {vendor.bio && <p className="text-surface-600 mt-4 leading-relaxed">{vendor.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit mb-8">
          {[
            { id: 'services',   label: `Services (${services.length})`,   icon: <Briefcase size={14} /> },
            { id: 'portfolio',  label: `Portfolio (${portfolio.length})`,  icon: <Award size={14} /> },
            { id: 'reviews',    label: `Reviews (${reviews.length})`,      icon: <Star size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-600'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Services */}
        {tab === 'services' && (
          <div className="grid md:grid-cols-2 gap-5 animate-fade-in">
            {services.map(s => (
              <div key={s.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-surface-900">{s.title}</h3>
                  <span className="badge-blue whitespace-nowrap">{s.category}</span>
                </div>
                <p className="text-sm text-surface-500 mb-4 line-clamp-3">{s.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    {s.price_min && s.price_max ? (
                      <span className="font-semibold text-surface-900">
                        KES {parseFloat(s.price_min).toLocaleString()} – {parseFloat(s.price_max).toLocaleString()}
                      </span>
                    ) : s.price_max ? (
                      <span className="font-semibold text-surface-900">from KES {parseFloat(s.price_max).toLocaleString()}</span>
                    ) : null}
                    <span className="text-surface-400 ml-1 text-xs">({s.price_type})</span>
                  </div>
                  {s.delivery_days && <span className="text-surface-400 text-xs">{s.delivery_days} days delivery</span>}
                </div>
              </div>
            ))}
            {!services.length && <div className="card p-12 text-center col-span-2"><p className="text-surface-400">No services listed yet.</p></div>}
          </div>
        )}

        {/* Portfolio */}
        {tab === 'portfolio' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {portfolio.map(p => (
              <a key={p.id} href={p.project_url || '#'} target="_blank" rel="noreferrer" className="card overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🎨</span>
                  }
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">{p.title}</h3>
                  {p.description && <p className="text-sm text-surface-500 mt-1 line-clamp-2">{p.description}</p>}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.map(t => <span key={t} className="badge-gray text-[11px]">{t}</span>)}
                    </div>
                  )}
                </div>
              </a>
            ))}
            {!portfolio.length && <div className="card p-12 text-center col-span-3"><p className="text-surface-400">No portfolio items yet.</p></div>}
          </div>
        )}

        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            {reviews.map(r => (
              <div key={r.rid} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-100 text-surface-600 font-bold flex items-center justify-center flex-shrink-0">
                    {r.reviewer_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-surface-900">{r.reviewer_name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'} />
                        ))}
                      </div>
                    </div>
                    {r.title && <p className="font-medium text-sm text-surface-700 mb-1">{r.title}</p>}
                    {r.comments && <p className="text-sm text-surface-600 leading-relaxed">{r.comments}</p>}
                    <p className="text-xs text-surface-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {!reviews.length && <div className="card p-12 text-center"><p className="text-surface-400">No reviews yet.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
