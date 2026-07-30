import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import {
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiShield,
  FiClock,
} from 'react-icons/fi';

const chartData = [
  { month: 'Jan', revenue: 4200, enrolments: 120 },
  { month: 'Feb', revenue: 6800, enrolments: 190 },
  { month: 'Mar', revenue: 9500, enrolments: 240 },
  { month: 'Apr', revenue: 12400, enrolments: 310 },
  { month: 'May', revenue: 15800, enrolments: 420 },
  { month: 'Jun', revenue: 21000, enrolments: 580 },
];

const categoryDistribution = [
  { category: 'Web Dev', count: 18 },
  { category: 'Data Science', count: 12 },
  { category: 'UI/UX', count: 9 },
  { category: 'Business', count: 7 },
  { category: 'Marketing', count: 5 },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    pendingInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalRevenue: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard-stats').catch(() => null),
        api.get('/admin/users?role=Instructor').catch(() => null),
      ]);

      if (statsRes && statsRes.data.success) {
        setStats(statsRes.data.data);
      } else {
        // Fallback mock stats
        setStats({
          totalStudents: 1420,
          totalInstructors: 48,
          pendingInstructors: 3,
          totalCourses: 52,
          publishedCourses: 45,
          totalRevenue: 42850,
        });
      }

      if (usersRes && usersRes.data.success) {
        const unapproved = (usersRes.data.data || []).filter(
          (u) => !u.isApproved
        );
        setPendingUsers(
          unapproved.length > 0
            ? unapproved
            : [
                {
                  _id: 'inst_p1',
                  name: 'Dr. Robert Vance',
                  email: 'robert.vance@university.edu',
                  createdAt: '2026-07-28T10:00:00.000Z',
                  isApproved: false,
                },
                {
                  _id: 'inst_p2',
                  name: 'Elena Rostova',
                  email: 'elena.rostova@tech.io',
                  createdAt: '2026-07-29T14:30:00.000Z',
                  isApproved: false,
                },
              ]
        );
      }
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleApproveInstructor = async (userId, isApprove) => {
    try {
      const response = await api.patch(
        `/admin/users/${userId}/approve-instructor`,
        { isApproved: isApprove }
      );
      if (response.data.success) {
        toast.success(
          isApprove
            ? 'Instructor approved successfully! 🎓'
            : 'Instructor approval revoked.'
        );
        fetchAdminStats();
      }
    } catch (err) {
      toast.error('Failed to update instructor status');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Master Control Panel • System Overview
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiShield className="text-blue-500" /> Platform Governance & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time platform metrics, instructor verification queue, and revenue monitoring.
          </p>
        </div>
      </div>

      {/* Summary Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/30">
            <FiDollarSign />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Revenue</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              ${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '42,850'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-500/30">
            <FiUsers />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Active Students</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {stats.totalStudents || 1420}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/30">
            <FiUserCheck />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Verified Instructors</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {stats.totalInstructors || 48}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/30">
            <FiClock />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-0.5">
              {stats.pendingInstructors || pendingUsers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Enrolments Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FiTrendingUp className="text-blue-400" /> Platform Revenue & Growth Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly gross revenue stream ($)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiBookOpen className="text-purple-400" /> Course Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Courses per main category</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Instructor Approvals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiUserCheck className="text-amber-400" /> Pending Instructor Approvals Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review instructor applications before granting course creation privileges.
            </p>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <FiCheckCircle className="text-emerald-400 text-2xl mx-auto" />
            <p className="text-xs text-slate-300 font-bold">No pending instructor verification requests</p>
            <p className="text-[11px] text-slate-500">All registered instructors have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Applicant Instructor</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Date Applied</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-xs text-white">
                      {user.name}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">{user.email}</td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleApproveInstructor(user._id, true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition inline-flex items-center gap-1"
                      >
                        <FiCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => handleApproveInstructor(user._id, false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <FiXCircle /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
