import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBookOpen,
  FiLogOut,
  FiUser,
  FiBell,
  FiMenu,
  FiChevronDown,
  FiSearch,
} from 'react-icons/fi';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Instructor':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Side: Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              EduVerse
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses, skills, topics..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Right Side: Notification & User Menu */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          </button>

          {/* Role Badge */}
          {role && (
            <span
              className={`hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor()}`}
            >
              {role}
            </span>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden border border-slate-700">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="hidden md:inline font-medium text-sm text-slate-200">
                {user?.name || 'User'}
              </span>
              <FiChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FiUser className="w-4 h-4" />
                  My Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
