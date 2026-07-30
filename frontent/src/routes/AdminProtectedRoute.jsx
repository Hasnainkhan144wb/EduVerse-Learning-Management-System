import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  // Check localStorage for persisted Admin session to prevent false bounce during state re-renders
  const adminToken =
    localStorage.getItem('adminToken') || localStorage.getItem('token');
  const savedUser =
    localStorage.getItem('adminUser') || localStorage.getItem('user');

  let isLocalStorageAdmin = false;
  if (adminToken && savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser && parsedUser.role === 'Admin') {
        isLocalStorageAdmin = true;
      }
    } catch (e) {
      isLocalStorageAdmin = false;
    }
  }

  const hasAdminAccess =
    isLocalStorageAdmin || (isAuthenticated && role === 'Admin');

  if (loading && !isLocalStorageAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Verifying Admin Security Clearance...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
