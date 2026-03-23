import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const CATEGORIES = [
  'Digital Marketing', 'Graphic Design', 'Advertising',
  'Video Production', 'Photography', 'Copywriting', 'UI/UX Design',
  'SEO & SEM', 'Social Media Management', 'Brand Strategy',
];

const SUB_CATEGORIES = {
  'Digital Marketing': ['SEO', 'Email Marketing', 'Facebook Ads', 'Google Ads', 'Content Marketing'],
  'Graphic Design':    ['Logo Design', 'Brand Identity', '3D Modeling', 'Motion Graphics', 'Illustration'],
  'Advertising':       ['OOH Advertising', 'Radio Ads', 'TV Commercials', 'Print Media'],
  'Video Production':  ['Corporate Videos', 'Explainer Videos', 'Testimonials', 'Social Media Clips'],
};

const INDUSTRIES = ['Fintech', 'E-commerce', 'Healthcare', 'Education', 'FMCG', 'Real Estate', 'Tourism', 'Tech Startup', 'NGO', 'Government'];

const STEPS = ['Project Details', 'Budget & Timeline', 'Requirements', 'Review'];

export default function PostProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', subCategory: '',
    budgetType: 'fixed', budgetMin: '', budgetMax: '',
    deadline: '', industry: '', requiredSkills: [],
  });

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleSkill = (skill) => {
    const skills = form.requiredSkills.includes(skill)
      ? form.requiredSkills.filter(s => s !== skill)
      : [...form.requiredSkills, skill];
    setForm({ ...form, requiredSkills: skills });
  };

  const next = () => {
    if (step === 0 && (!form.title || !form.category)) {
      toast.error('Please fill in the title and category.'); return;
    }
    if (step === 1 && !form.budgetMax) {
      toast.error('Please set a maximum budget.'); return;
    }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project posted! Vendors will start bidding soon.');
      navigate(`/project/${data.project.pid}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'bg-brand-600 text-white' :
                  i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-surface-200 text-surface-400'
                }`}>
                  {i < step ? <CheckCircle2 size={15} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 sm:w-24 transition-all ${i < step ? 'bg-brand-600' : 'bg-surface-200'}`} />
                )}
              </div>
            ))}
          </div>
          <h2 className="font-display text-xl font-bold text-surface-900">{STEPS[step]}</h2>
        </div>

        <div className="card p-8">
          {/* ── STEP 0: Project Details ── */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Project Title *</label>
                <input className="input-field" placeholder="e.g. Brand Identity Design for Tech Startup" value={form.title} onChange={f('title')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Description *</label>
                <textarea
                  className="input-field h-32 resize-none"
                  placeholder="Describe your project in detail — goals, deliverables, any specific requirements…"
                  value={form.description} onChange={f('description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Category *</label>
                  <select className="input-field" value={form.category} onChange={f('category')}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Sub-category</label>
                  <select className="input-field" value={form.subCategory} onChange={f('subCategory')}>
                    <option value="">Select sub-category</option>
                    {(SUB_CATEGORIES[form.category] || []).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Industry</label>
                <select className="input-field" value={form.industry} onChange={f('industry')}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 1: Budget & Timeline ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Budget Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['fixed', 'hourly'].map(type => (
                    <button key={type} type="button"
                      onClick={() => setForm({ ...form, budgetType: type })}
                      className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm capitalize transition-all ${
                        form.budgetType === type
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}>
                      {type === 'fixed' ? '💰 Fixed Price' : '⏱️ Hourly Rate'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    {form.budgetType === 'hourly' ? 'Min Rate (KES/hr)' : 'Min Budget (KES)'}
                  </label>
                  <input type="number" min="0" className="input-field" placeholder="e.g. 10,000"
                    value={form.budgetMin} onChange={f('budgetMin')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    {form.budgetType === 'hourly' ? 'Max Rate (KES/hr)' : 'Max Budget (KES)'} *
                  </label>
                  <input type="number" min="1" className="input-field" placeholder="e.g. 50,000"
                    value={form.budgetMax} onChange={f('budgetMax')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Project Deadline</label>
                <input type="date" className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.deadline} onChange={f('deadline')} />
              </div>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <p className="text-sm text-brand-700 font-medium mb-1">💡 Tip: Escrow Protection</p>
                <p className="text-xs text-brand-600">Your payment is held securely in escrow and only released to the vendor when you approve the deliverable.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Requirements / Skills ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-3">Required Skills / Tags</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Photoshop', 'Illustrator', 'After Effects', 'Figma', 'WordPress',
                    'React', 'SEO Tools', 'Google Analytics', 'Copywriting', 'Photography',
                    'Video Editing', 'Brand Strategy', '3D Modeling', 'Social Media',
                    ...(SUB_CATEGORIES[form.category] || []),
                  ].map(skill => (
                    <button key={skill} type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.requiredSkills.includes(skill)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-surface-200 text-surface-600 hover:border-brand-300'
                      }`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-surface-900 mb-4">Review your project</h3>
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: `${form.category}${form.subCategory ? ` → ${form.subCategory}` : ''}` },
                { label: 'Industry', value: form.industry || '—' },
                { label: 'Budget', value: `KES ${form.budgetMin ? `${parseFloat(form.budgetMin).toLocaleString()} – ` : ''}${parseFloat(form.budgetMax || 0).toLocaleString()} (${form.budgetType})` },
                { label: 'Deadline', value: form.deadline || '—' },
                { label: 'Required Skills', value: form.requiredSkills.join(', ') || '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2.5 border-b border-surface-100 last:border-0">
                  <span className="text-sm text-surface-500">{row.label}</span>
                  <span className="text-sm font-medium text-surface-900 text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
              <div className="mt-2">
                <span className="text-sm text-surface-500">Description</span>
                <p className="text-sm text-surface-700 mt-1 leading-relaxed bg-surface-50 rounded-xl p-3">{form.description}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary flex items-center gap-1.5">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-70">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Posting…</> : '🚀 Post Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
