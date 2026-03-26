import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Star, Users, TrendingUp, 
  CheckCircle2, Search, Facebook, Twitter, Instagram, 
  Linkedin, Github, Play, Globe, Award, ChevronDown, Menu
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Development & IT',   icon: '💻', count: '1,200+ vendors' },
  { name: 'Design & Creative',  icon: '🎨', count: '850+ vendors' },
  { name: 'Sales & Marketing',  icon: '📈', count: '640+ vendors' },
  { name: 'Writing & Translation', icon: '✍️', count: '410+ vendors' },
  { name: 'Admin & Customer Support', icon: '🎧', count: '320+ vendors' },
  { name: 'Finance & Accounting', icon: '💰', count: '180+ vendors' },
];

const SOCIAL_LINKS = [
  { icon: <Facebook size={20} />,  url: 'https://facebook.com' },
  { icon: <Twitter size={20} />,   url: 'https://twitter.com' },
  { icon: <Instagram size={20} />, url: 'https://instagram.com' },
  { icon: <Linkedin size={20} />,  url: 'https://linkedin.com' },
  { icon: <Github size={20} />,    url: 'https://github.com' },
];

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState('brand');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <main className="bg-white min-h-screen font-body selection:bg-[#14a800]/20 selection:text-[#14a800]">
      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1">
              <span className="text-2xl font-display font-bold text-[#001e00] tracking-tighter">
                Brand<span className="text-[#14a800]">Connect</span>
              </span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/vendors" className="flex items-center gap-1 text-[15px] font-semibold text-[#001e00] hover:text-[#14a800] transition-colors">
                Find Talent <ChevronDown size={14} />
              </Link>
              <Link to="/marketplace" className="flex items-center gap-1 text-[15px] font-semibold text-[#001e00] hover:text-[#14a800] transition-colors">
                Find Work <ChevronDown size={14} />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[15px] font-bold text-[#001e00] hover:text-[#14a800] transition-colors px-4">
              Log In
            </Link>
            <Link to="/register" className="bg-[#14a800] hover:bg-[#108a00] text-white font-bold text-[15px] px-6 py-2 rounded-full transition-all shadow-lg shadow-[#14a800]/20">
              Sign Up
            </Link>
            <button className="lg:hidden p-2">
              <Menu size={24} className="text-[#001e00]" />
            </button>
          </div>
        </div>
      </nav>

      <div className="h-[70px]" />

      {/* ─── Hero Section (Image 2 Style) ─────────────────────────────────── */}
      <section className="relative min-h-[600px] lg:min-h-[750px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop" 
            alt="Professional Workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>

        <div className="max-w-[1100px] mx-auto px-4 relative z-10 text-center space-y-10 animate-fade-in">
          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-display font-medium text-white tracking-tight leading-[0.95]">
            Hire the experts your <br className="hidden md:block" /> business needs
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-[800px] mx-auto font-medium leading-relaxed">
            Access skilled freelancers ready to help you build and scale — without the full-time commitment
          </p>

          {/* Hire / Work Toggles */}
          <div className="flex items-center justify-center p-1.5 bg-white/10 backdrop-blur-md rounded-full w-fit mx-auto border border-white/20">
            <Link 
              to="/register?type=brand"
              onMouseEnter={() => setRole('brand')}
              className={`px-10 py-3.5 rounded-full font-bold text-sm transition-all border ${
                role === 'brand' ? 'bg-white/20 text-white border-white/30 shadow-lg' : 'text-white/60 hover:text-white border-transparent'
              }`}
            >
              I want to hire
            </Link>
            <Link 
              to="/register?type=vendor"
              onMouseEnter={() => setRole('vendor')}
              className={`px-10 py-3.5 rounded-full font-bold text-sm transition-all border ${
                role === 'vendor' ? 'bg-white/20 text-white border-white/30 shadow-lg' : 'text-white/60 hover:text-white border-transparent'
              }`}
            >
              I want to work
            </Link>
          </div>

          {/* Professional Search Bar */}
          <form onSubmit={handleSearch} className="max-w-[750px] mx-auto pt-4 relative">
            <div className="relative flex items-center bg-white rounded-full p-2 shadow-2xl group transition-all focus-within:ring-8 focus-within:ring-[#14a800]/10">
              <input 
                type="text" 
                placeholder="Describe what you need to hire for..." 
                className="flex-1 bg-transparent border-none outline-none px-8 py-5 text-[#001e00] text-xl font-medium placeholder-gray-400 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="bg-[#141414] hover:bg-black text-white px-10 py-5 rounded-full flex items-center gap-3 font-bold transition-all group/search">
                <Search size={24} className="group-focus-within:text-[#14a800] transition-colors" />
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <h2 className="text-4xl lg:text-5xl font-display font-medium text-[#001e00] tracking-tight">Browse talent by category</h2>
            <Link to="/search" className="text-[#14a800] font-bold text-lg hover:underline flex items-center gap-2">
               View all categories <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/search?category=${cat.name}`}
                className="p-8 rounded-2xl bg-[#f9fdf9] border border-gray-100 hover:border-[#14a800]/30 hover:bg-white hover:shadow-xl hover:shadow-[#14a800]/5 group transition-all duration-500"
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                <h3 className="text-[22px] font-semibold text-[#001e00] mb-2">{cat.name}</h3>
                <div className="flex items-center gap-2">
                   <div className="flex gap-0.5 text-[#14a800]">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                   </div>
                   <p className="text-[#5e6d55] text-[15px] font-medium">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Value Prop - For Client ────────────────────────────────────────── */}
      <section className="py-24 bg-[#14a800] text-white relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-5xl lg:text-7xl font-display font-medium leading-[0.95] mb-8">
                Up your game with <br /> talent from <br /> BrandConnect
              </h2>
              <div className="space-y-6 mt-12">
                 <div className="flex gap-4">
                    <CheckCircle2 size={28} className="flex-shrink-0 text-white/50" />
                    <div>
                       <h4 className="text-2xl font-bold mb-1">Proof of quality</h4>
                       <p className="text-white/80 text-lg">Check any pro’s work samples, client reviews, and identity verification.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <CheckCircle2 size={28} className="flex-shrink-0 text-white/50" />
                    <div>
                       <h4 className="text-2xl font-bold mb-1">No cost until you hire</h4>
                       <p className="text-white/80 text-lg">Interview potential fits for your job, negotiate rates, and only pay for work you approve.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <CheckCircle2 size={28} className="flex-shrink-0 text-white/50" />
                    <div>
                       <h4 className="text-2xl font-bold mb-1">Safe and secure</h4>
                       <p className="text-white/80 text-lg">Focus on your work knowing we help protect your data and payments.</p>
                    </div>
                 </div>
              </div>
              <div className="mt-12 flex gap-6">
                 <Link to="/register" className="bg-white text-[#001e00] px-10 py-5 rounded-full font-bold text-lg hover:bg-white/90 transition-all shadow-2xl shadow-black/20">
                    Get Started
                 </Link>
                 <Link to="/vendors" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                    Find Talent
                 </Link>
              </div>
           </div>
           <div className="relative group">
              <div className="absolute inset-0 bg-[#001e00]/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" className="rounded-3xl shadow-2xl border-4 border-white/20 transition-transform duration-700 group-hover:scale-[1.02]" alt="Professional" />
           </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#001e00] text-white pt-24 pb-12 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="space-y-6 flex flex-col items-center md:items-start">
              <h2 className="text-3xl font-display font-bold">BrandConnect</h2>
              <div className="flex gap-4">
                {SOCIAL_LINKS.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#14a800] hover:border-[#14a800] transition-all text-white/60 hover:text-white">
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 text-sm uppercase tracking-[0.2em]">For Clients</h4>
              <ul className="space-y-4 text-[15px] text-gray-400">
                <li><Link to="/vendors" className="hover:text-[#14a800] transition-colors">How to Hire</Link></li>
                <li><Link to="/search" className="hover:text-[#14a800] transition-colors">Talent Search</Link></li>
                <li><Link to="/dashboard" className="hover:text-[#14a800] transition-colors">Post a Job</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 text-sm uppercase tracking-[0.2em]">For Talent</h4>
              <ul className="space-y-4 text-[15px] text-gray-400">
                <li><Link to="/marketplace" className="hover:text-[#14a800] transition-colors">Find Projects</Link></li>
                <li><Link to="/dashboard" className="hover:text-[#14a800] transition-colors">Create Profile</Link></li>
                <li><Link to="/earnings" className="hover:text-[#14a800] transition-colors">Get Paid</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 text-sm uppercase tracking-[0.2em]">Resources</h4>
              <ul className="space-y-4 text-[15px] text-gray-400">
                <li><Link to="/dashboard" className="hover:text-[#14a800] transition-colors">Community</Link></li>
                <li><Link to="/help" className="hover:text-[#14a800] transition-colors">Help Center</Link></li>
                <li><Link to="/login" className="hover:text-[#14a800] transition-colors">Direct Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[13px] text-gray-500 font-medium tracking-wide">
            <p>© 2026 Brand Connect Hub Inc. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-8">
               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
