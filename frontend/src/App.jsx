import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import VendorBrowse from './pages/VendorBrowse';
import Marketplace from './pages/Marketplace';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner text="Loading..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-midnight">
      <Sidebar />
      <main className="ml-60 flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function AdminGuard() {
  const { user } = useAuth();
  if (user?.userType !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function BrandGuard() {
  const { user } = useAuth();
  if (user?.userType !== 'brand') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function VendorGuard() {
  const { user } = useAuth();
  if (user?.userType !== 'vendor') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PlaceholderPage({ title }) {
  return (
    <div className="p-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-500">This section is under construction.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

          {/* Brand routes */}
          <Route element={<BrandGuard />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/vendors" element={<VendorBrowse />} />
            <Route path="/transactions" element={<PlaceholderPage title="Payments & Escrow" />} />
          </Route>

          {/* Shared project detail */}
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Vendor routes */}
          <Route element={<VendorGuard />}>
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/my-bids" element={<PlaceholderPage title="My Bids" />} />
            <Route path="/earnings" element={<PlaceholderPage title="Earnings" />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<PlaceholderPage title="User Management" />} />
            <Route path="/admin/vendors" element={<PlaceholderPage title="Vendor Approvals" />} />
            <Route path="/admin/projects" element={<PlaceholderPage title="All Projects" />} />
            <Route path="/admin/transactions" element={<PlaceholderPage title="All Transactions" />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
