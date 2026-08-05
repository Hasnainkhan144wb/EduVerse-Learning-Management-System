import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AdminNotificationBell from '../components/AdminNotificationBell';
import api from '../services/api';
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
  FiBell,
  FiClock,
  FiArrowRight,
  FiUserCheck,
} from 'react-icons/fi';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  const handleAdminLogout = () => {
    logout();
  };

  // Fetch pending user approvals for real-time notification bell & dropdown
  const fetchPendingNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/admin/pending-users');
      if (res.data && res.data.success) {
        setPendingUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending user notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchPendingNotifications();
    // Real-time polling every 10 seconds
    const interval = setInterval(fetchPendingNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      {/* Top Administrative Bar with High-Contrast Visibility */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-white hover:text-blue-400 rounded-xl lg:hidden hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-600/30">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                EduVerse Command Center
              </h1>
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                System Administrator Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Status & High-Contrast Navbar Navigation */}
        <div className="flex items-center gap-4 text-xs">
          {/* Operational Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <FiActivity className="w-3.5 h-3.5" />
            <span>System Operational</span>
          </div>

          {/* Current Date */}
          <div className="hidden md:block text-slate-200 text-xs font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            {currentDateStr}
          </div>

          {/* Real-Time Admin Notification Bell & Dropdown */}
          <AdminNotificationBell />

          {/* Admin User Profile Tag */}
          <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
            <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-300 font-extrabold text-xs flex items-center justify-center border border-blue-400/40 shadow-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-extrabold text-white leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] text-blue-300 font-semibold">Super Admin</span>
            </div>
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
