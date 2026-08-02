import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FiShield,
  FiLock,
  FiMail,
  FiArrowRight,
  FiKey,
} from 'react-icons/fi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { updateUserState, setTokenState } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect if already authenticated as Admin
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminUser') || localStorage.getItem('user');
    const savedToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (savedToken && savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        if (parsed && parsed.role === 'Admin') {
          navigate('/admin-dashboard/users', { replace: true });
        }
      } catch (e) {
        // Continue to login
      }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@eduverse.com',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const response = await api.post('/admin/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.success || response.data.token) {
        const token = response.data.token;
        const user = response.data.user || response.data.data;

        // Save Admin credentials directly to localStorage
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update global Auth Context state
        if (updateUserState) {
          updateUserState(user);
        }
        if (setTokenState) {
          setTokenState(token);
        }

        toast.success('Admin Security Authentication Successful! 🛡️');

        // 🛠️ EXPLICIT REDIRECT TO ADMIN DASHBOARD / USERS DIRECTORY
        navigate('/admin-dashboard/users', { replace: true });
      }
    } catch (err) {
      console.error('Admin Login Failure:', err);
      const errorMessage =
        err.response?.data?.message || 'Invalid administrative credentials';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900 via-indigo-800 to-slate-900 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto text-3xl shadow-xl shadow-blue-900/20">
            <FiShield />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
              EduVerse Security Gateway
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Administrative Login
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted portal for System Administrators & Compliance Officers.
            </p>
          </div>
        </div>

        {/* Security Alert Badge */}
        <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
          <FiKey className="text-blue-400 shrink-0 text-base" />
          <span>Requires verified 256-bit Admin credentials and role clearance.</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Administrator Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="email"
                placeholder="admin@eduverse.com"
                {...register('email', {
                  required: 'Admin email address is required',
                })}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-[11px] mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••••••"
                {...register('password', {
                  required: 'Admin password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-[11px] mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            {submitting ? 'Verifying Credentials...' : 'Authenticate & Access Portal'}{' '}
            <FiArrowRight />
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500">
            EduVerse LMS v1.0.0 • Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
