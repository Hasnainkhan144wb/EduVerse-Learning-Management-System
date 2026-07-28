import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBaseRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Checking Authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-4 text-center">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🚫
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Your role (<span className="text-indigo-400 font-semibold">{role}</span>) does not have permission to access this page.
          </p>
          <a
            href="/"
            className="inline-block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleBaseRoute;
