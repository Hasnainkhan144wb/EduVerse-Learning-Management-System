import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiBookOpen,
  FiHeart,
  FiAward,
  FiPlusCircle,
  FiUsers,
  FiBarChart2,
  FiCheckSquare,
  FiFolder,
  FiUserCheck,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const studentLinks = [
    { label: 'Overview', path: '/student', icon: FiGrid },
    { label: 'Enrolled Courses', path: '/student/courses', icon: FiBookOpen },
    { label: 'Wishlist', path: '/student/wishlist', icon: FiHeart },
    { label: 'Certificates', path: '/student/certificates', icon: FiAward },
  ];

  const instructorLinks = [
    { label: 'Dashboard', path: '/instructor', icon: FiGrid },
    { label: 'My Courses', path: '/instructor/courses', icon: FiBookOpen },
    { label: 'Create Course', path: '/instructor/courses/create', icon: FiPlusCircle },
    { label: 'Analytics', path: '/instructor/analytics', icon: FiBarChart2 },
  ];

  const adminLinks = [
    { label: 'Platform Stats', path: '/admin', icon: FiGrid },
    { label: 'Instructor Approvals', path: '/admin/approvals', icon: FiUserCheck },
    { label: 'Course Management', path: '/admin/courses', icon: FiCheckSquare },
    { label: 'Categories', path: '/admin/categories', icon: FiFolder },
    { label: 'User Directory', path: '/admin/users', icon: FiUsers },
  ];

  const getLinks = () => {
    switch (role) {
      case 'Instructor':
        return instructorLinks;
      case 'Admin':
        return adminLinks;
      default:
        return studentLinks;
    }
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-[61px] left-0 z-40 w-64 h-[calc(100vh-61px)] bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-4 px-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {role} Navigation
            </h3>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/student' || link.path === '/instructor' || link.path === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Card */}
          <div className="mt-auto p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
            <p className="text-xs font-semibold text-slate-300">EduVerse LMS</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Version 1.0.0 • Pro</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
