import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiUsers,
  FiCheckSquare,
  FiFolder,
  FiBarChart2,
  FiLogOut,
  FiShield,
  FiMenu,
  FiX,
  FiActivity,
} from 'react-icons/fi';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAdminLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  const adminNavLinks = [
    { label: 'Dashboard Overview', path: '/admin/dashboard', icon: FiGrid },
    { label: 'User Directory', path: '/admin/users', icon: FiUsers },
    { label: 'Course Approvals', path: '/admin/courses', icon: FiCheckSquare },
    { label: 'Categories Manager', path: '/admin/categories', icon: FiFolder },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: FiBarChart2 },
  ];

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Administrative Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl lg:hidden hover:bg-slate-800"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-900/30">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                EduVerse Command Center
              </h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                System Administrator Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <FiActivity /> System Operational (99.9%)
          </div>

          <div className="hidden md:block text-slate-400 text-[11px] font-medium">
            {currentDateStr}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-200">
              {user?.name || 'Administrator'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex flex-1 relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Dedicated Admin Sidebar */}
        <aside
          className={`fixed top-[57px] left-0 z-40 w-64 h-[calc(100vh-57px)] bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full py-6 px-4">
            <div className="mb-4 px-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Admin Management
              </h3>
            </div>

            <nav className="flex-1 space-y-1.5">
              {adminNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-900/30 font-bold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Exit Admin Session</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
