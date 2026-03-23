import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, categoriesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function NewProject() {
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skill, setSkill] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: '', subcategory: '',
    budgetType: 'fixed', budgetMin: '', budgetMax: '',
    deadline: '', industry: '', skillsRequired: [],
  });

  useEffect(() => {
    categoriesAPI.list().then(r => setCats(r.data)).catch(() => {});
  }, []);

  const addSkill = () => {
    if (skill && !form.skillsRequired.includes(skill)) {
      setForm(f => ({ ...f, skillsRequired: [...f.skillsRequired, skill] }));
      setSkill('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.budgetMin || !form.budgetMax) return toast.error('Budget range is required');
    if (parseFloat(form.budgetMin) > parseFloat(form.budgetMax)) return toast.error('Min budget must be less than max');
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      toast.success('Project posted successfully!');
      navigate(`/projects/${res.data.pid}`);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="font-display text-3xl font-bold text-white mb-1">Post a Project</h1>
      <p className="text-slate-500 text-sm mb-8">Describe what you need and receive bids from verified vendors</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="font-display font-bold text-white text-lg border-b border-slate-800 pb-3">Project Details</h2>

          <div>
            <label className="label">Project Title *</label>
            <input className="input" placeholder="e.g. Social Media Campaign for Q4 2024"
              value={form.title} onChange={f('title')} required />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea className="input min-h-[120px] resize-none" placeholder="Describe the scope, deliverables, and expectations..."
              value={form.description} onChange={f('description')} required rows={5} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Category *</label>
              <select className="input" value={form.category} onChange={f('category')} required>
                <option value="">Select category...</option>
                {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Industry</label>
              <select className="input" value={form.industry} onChange={f('industry')}>
                <option value="">Select industry...</option>
                {['Fintech','E-commerce','Healthcare','Education','Real Estate','Hospitality','Retail','Technology','NGO','Other'].map(i =>
                  <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="font-display font-bold text-white text-lg border-b border-slate-800 pb-3">Budget & Timeline</h2>

          <div>
            <label className="label">Budget Type *</label>
            <div className="flex gap-3">
              {['fixed', 'hourly'].map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({...p, budgetType: t}))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    form.budgetType === t ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-slate-700 text-slate-400'
                  }`}>
                  {t === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Budget (KES) *</label>
              <input type="number" className="input" placeholder="5000" min="0"
                value={form.budgetMin} onChange={f('budgetMin')} required />
            </div>
            <div>
              <label className="label">Max Budget (KES) *</label>
              <input type="number" className="input" placeholder="50000" min="0"
                value={form.budgetMax} onChange={f('budgetMax')} required />
            </div>
          </div>

          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={f('deadline')}
              min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="font-display font-bold text-white text-lg border-b border-slate-800 pb-3">Skills Required</h2>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="e.g. Adobe Photoshop, SEO, Copywriting"
              value={skill} onChange={e => setSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <button type="button" onClick={addSkill} className="btn-secondary px-3">
              <Plus size={16} />
            </button>
          </div>
          {form.skillsRequired.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skillsRequired.map(s => (
                <span key={s} className="badge-slate flex items-center gap-1.5">
                  {s}
                  <button type="button" onClick={() => setForm(p => ({...p, skillsRequired: p.skillsRequired.filter(x => x !== s)}))}
                    className="hover:text-red-400 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading && <span className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Posting...' : 'Post Project & Get Bids'}
        </button>
      </form>
    </div>
  );
}
