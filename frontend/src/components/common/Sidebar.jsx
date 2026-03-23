import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, Users, MessageSquare, CreditCard,
  Bell, Settings, LogOut, Briefcase, Star, ShieldCheck, BarChart3,
  Zap
} from 'lucide-react';

const brandLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'My Projects' },
  { to: '/vendors', icon: Users, label: 'Find Vendors' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/transactions', icon: CreditCard, label: 'Payments' },
];

const vendorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/marketplace', icon: Briefcase, label: 'Browse Projects' },
  { to: '/my-bids', icon: Star, label: 'My Bids' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/earnings', icon: CreditCard, label: 'Earnings' },
];

const adminLinks = [
  { to: '/admin', icon: BarChart3, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/vendors', icon: ShieldCheck, label: 'Vendor Approvals' },
  { to: '/admin/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.userType === 'admin' ? adminLinks
              : user?.userType === 'vendor' ? vendorLinks
              : brandLinks;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#141929] border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-midnight" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-bold text-white text-sm">Brand</span>
            <span className="font-display font-bold text-amber-400 text-sm">Connect</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-800 mx-2 mt-2 rounded-lg bg-[#0A0F1E]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.userType}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard' || to === '/admin'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-slate-800 space-y-1">
        <NavLink to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Bell size={16} />
          <span>Notifications</span>
        </NavLink>
        <NavLink to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="sidebar-link w-full text-left hover:text-red-400 hover:bg-red-500/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
