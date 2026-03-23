import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Star, Users, TrendingUp, CheckCircle2, Search } from 'lucide-react';

const STATS = [
  { label: 'Verified Vendors', value: '2,400+' },
  { label: 'Projects Completed', value: '12,000+' },
  { label: 'Total Value Transacted', value: 'KES 42M+' },
  { label: 'Average Rating', value: '4.8★' },
];

const CATEGORIES = [
  { name: 'Digital Marketing', icon: '📣', count: '340+ vendors' },
  { name: 'Graphic Design',    icon: '🎨', count: '520+ vendors' },
  { name: 'Advertising',       icon: '📺', count: '190+ vendors' },
  { name: 'Video Production',  icon: '🎬', count: '210+ vendors' },
  { name: 'Copywriting',       icon: '✍️',  count: '280+ vendors' },
  { name: 'Photography',       icon: '📷', count: '160+ vendors' },
];

const FEATURES = [
  {
    icon: <Shield size={22} />,
    title: 'Vetted & Verified',
    description: 'Every vendor is manually reviewed, portfolio-verified, and ID-checked before joining.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Smart Matching',
    description: 'Our algorithm ranks vendors by service fit, rating, budget alignment, and industry experience.',
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: 'Escrow Protection',
    description: 'Funds are held securely in escrow and only released when you approve the deliverable.',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Full Project Management',
    description: 'Milestones, in-platform chat, file sharing, and a complete audit trail — all in one place.',
  },
];

const TESTIMONIALS = [
  { name: 'Amara Okonkwo', role: 'CEO, Nairobi Tech Startup', text: 'We hired three vendors through BCH within a week. The escrow feature gave us total peace of mind.', rating: 5 },
  { name: 'David Mwangi', role: 'Freelance Brand Designer', text: 'My project pipeline has never been more consistent. BCH clients are serious buyers.', rating: 5 },
  { name: 'Sofia Kamau', role: 'Marketing Director, FMCG', text: 'The vendor matching is incredible — it surfaced specialists I never would have found on my own.', rating: 5 },
];

export default function Landing() {
  return (
    <main className="pt-16 font-body">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-20 pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-50 opacity-70" />
          <div className="absolute top-60 -left-32 w-[400px] h-[400px] rounded-full bg-brand-50/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-slow" />
            East Africa's #1 Creative Services Marketplace
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-surface-950 leading-[1.08] mb-6 animate-slide-up">
            Connect Brands With<br />
            <span className="text-brand-600">Verified Creative Talent</span>
          </h1>

          <p className="text-xl text-surface-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Post your project, receive matched bids, and collaborate securely
            with pre-vetted vendors — all with escrow-protected payments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register?role=brand" className="btn-primary px-8 py-4 text-base flex items-center gap-2 group">
              Post a Project Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register?role=vendor" className="btn-secondary px-8 py-4 text-base">
              Join as a Vendor
            </Link>
          </div>

          {/* Search bar */}
          <div className="mt-12 max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/search"
              className="flex items-center gap-3 bg-surface-100 hover:bg-surface-200 transition-colors px-5 py-3.5 rounded-2xl text-surface-400 text-sm cursor-pointer"
            >
              <Search size={18} />
              Search for "SEO Expert", "Logo Designer", "Facebook Ads"…
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="bg-brand-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-brand-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-3">Browse by Category</h2>
            <p className="text-surface-500 text-lg">Find the right creative service for your brand</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/search?category=${cat.name}`}
                className="card p-6 flex items-start gap-4 cursor-pointer hover:-translate-y-0.5 transition-transform duration-200"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-surface-900 font-display">{cat.name}</p>
                  <p className="text-sm text-surface-500 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-3">Why Brand Connect Hub?</h2>
            <p className="text-surface-500 text-lg max-w-xl mx-auto">
              Built for high-stakes brand projects, not commodity tasks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-surface-900 mb-1">{f.title}</h3>
                  <p className="text-surface-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-3">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Post Your Project', desc: 'Describe your project, set your budget, and define deliverables. It\'s free for brands.' },
              { step: '02', title: 'Review Matched Vendors', desc: 'Our algorithm scores and ranks bids. Compare portfolios, ratings, and proposals side-by-side.' },
              { step: '03', title: 'Collaborate & Pay Securely', desc: 'Work through milestones with our in-platform tools. Release payment only when satisfied.' },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-display font-bold text-xl flex items-center justify-center mx-auto mb-5">
                  {step.step}
                </div>
                <h3 className="font-display font-bold text-xl text-surface-900 mb-2">{step.title}</h3>
                <p className="text-surface-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-surface-900 mb-3">Trusted by Brands & Vendors</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-surface-600 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-surface-900">{t.name}</p>
                  <p className="text-sm text-surface-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to Build Something Great?
          </h2>
          <p className="text-brand-200 text-lg mb-10">
            Join thousands of brands and vendors already growing with Brand Connect Hub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=brand"  className="bg-white text-brand-700 hover:bg-brand-50 font-semibold px-8 py-4 rounded-xl transition-colors">
              Start Hiring Talent →
            </Link>
            <Link to="/register?role=vendor" className="border border-brand-400 text-white hover:bg-brand-700 font-semibold px-8 py-4 rounded-xl transition-colors">
              Offer Your Services
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-surface-950 text-surface-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm font-display">B</div>
                <span className="font-display font-bold text-lg text-white">Brand<span className="text-brand-400">Connect</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                East Africa's trusted marketplace for high-value creative and marketing services.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wide">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/search?type=vendors"  className="hover:text-white transition-colors">Find Vendors</Link></li>
                <li><Link to="/search?type=projects" className="hover:text-white transition-colors">Browse Projects</Link></li>
                <li><Link to="/register"             className="hover:text-white transition-colors">Join Free</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wide">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About BCH</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2024 Brand Connect Hub. Chuka University Project.</p>
            <p className="text-sm">Built with React · Node.js · PostgreSQL</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
