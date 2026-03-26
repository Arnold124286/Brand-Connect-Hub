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
import Transactions from './pages/Transactions';
import VendorBrowse from './pages/VendorBrowse';
import MyBids from './pages/MyBids';
import Marketplace from './pages/Marketplace';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Earnings from './pages/Earnings';
import Landing from './pages/Landing';
import VerifyOtp from './pages/VerifyOtp';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner text="Loading..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />

          {/* Brand routes */}
          <Route element={<BrandGuard />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/vendors" element={<VendorBrowse />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/cancel" element={<PaymentCancel />} />
          </Route>

          {/* Shared project detail */}
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Vendor routes */}
          <Route element={<VendorGuard />}>
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/my-bids" element={<MyBids />} />
            <Route path="/earnings" element={<Earnings />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
