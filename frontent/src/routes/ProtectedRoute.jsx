import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiShield, FiAlertTriangle, FiRefreshCw, FiLogOut } from 'react-icons/fi';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading, checkAuthStatus, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account Approval Verification Check (Instructors and unapproved accounts)
  if (user && user.role !== 'Admin' && user.isApproved === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-amber-500/20">
            <FiClock className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 w-max mx-auto">
              <FiAlertTriangle className="w-3.5 h-3.5" /> Verification Required
            </span>
            <h2 className="text-2xl font-extrabold text-white">Account Pending Approval</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hello <strong className="text-white">{user.name}</strong>, your account is currently under administrative review. Access to course dashboards will be granted as soon as an administrator verifies your application.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={checkAuthStatus}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
            >
              <FiRefreshCw className="w-4 h-4" /> Check Approval Status
            </button>
            <button
              onClick={logout}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
