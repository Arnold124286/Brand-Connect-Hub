import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, Menu, X, Search, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(({ data }) => setUnread(data.notifications.filter(n => !n.is_read).length))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-surface-200' : 'bg-white border-b border-surface-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm font-display">
              B
            </div>
            <span className="font-display font-bold text-xl text-surface-900">
              Brand<span className="text-brand-600">Connect</span>
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/search?type=vendors" className="btn-ghost text-sm">Find Vendors</Link>
            <Link to="/search?type=projects" className="btn-ghost text-sm">Browse Projects</Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
                >
                  <Bell size={20} className="text-surface-600" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                      {user.fullName?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-surface-800 max-w-[120px] truncate">{user.fullName}</span>
                    <ChevronDown size={14} className="text-surface-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-lg border border-surface-200 py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-surface-100 mb-1">
                        <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{user.userType}</p>
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-brand-700 transition-colors"
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  )}
                </div>

                {user.userType === 'brand' && (
                  <Link to="/post-project" className="btn-primary text-sm">
                    Post Project
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-surface-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-surface-100 px-4 py-4 space-y-2 animate-fade-in">
          <Link to="/search?type=vendors"  className="block py-2.5 px-4 rounded-xl hover:bg-surface-50 text-sm font-medium" onClick={() => setMobileOpen(false)}>Find Vendors</Link>
          <Link to="/search?type=projects" className="block py-2.5 px-4 rounded-xl hover:bg-surface-50 text-sm font-medium" onClick={() => setMobileOpen(false)}>Browse Projects</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block py-2.5 px-4 rounded-xl hover:bg-surface-50 text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              {user.userType === 'brand' && (
                <Link to="/post-project" className="btn-primary block text-center text-sm" onClick={() => setMobileOpen(false)}>Post Project</Link>
              )}
              <button onClick={handleLogout} className="w-full text-left py-2.5 px-4 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="block py-2.5 px-4 rounded-xl hover:bg-surface-50 text-sm font-medium" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn-primary block text-center text-sm" onClick={() => setMobileOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}

      {/* Overlay for closing menus */}
      {(userMenuOpen || mobileOpen) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setUserMenuOpen(false); setMobileOpen(false); }} />
      )}
    </nav>
  );
}
