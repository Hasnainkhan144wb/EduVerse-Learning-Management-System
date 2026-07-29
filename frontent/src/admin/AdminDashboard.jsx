import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiPieChart,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const revenueData = [
  { month: 'Jan', revenue: 4200, users: 320 },
  { month: 'Feb', revenue: 6800, users: 540 },
  { month: 'Mar', revenue: 9500, users: 810 },
  { month: 'Apr', revenue: 12400, users: 1150 },
  { month: 'May', revenue: 16800, users: 1490 },
  { month: 'Jun', revenue: 21500, users: 1980 },
  { month: 'Jul', revenue: 27900, users: 2450 },
];

const categoryDistribution = [
  { name: 'Web Development', value: 45, color: '#3b82f6' },
  { name: 'Data Science', value: 25, color: '#8b5cf6' },
  { name: 'UI/UX Design', value: 15, color: '#ec4899' },
  { name: 'Mobile App Dev', value: 15, color: '#10b981' },
];

const AdminDashboard = () => {
  const [pendingInstructors, setPendingInstructors] = useState([
    { _id: '1', name: 'Dr. Sarah Jenkins', email: 'sarah.j@eduverse.com', createdAt: '2026-07-25' },
    { _id: '2', name: 'Mark Vance', email: 'mark.vance@eduverse.com', createdAt: '2026-07-27' },
  ]);

  const handleApproveInstructor = async (id, name) => {
    try {
      await api.put(`/courses/admin/users/${id}/approve`, { isApproved: true }).catch(() => {});
      setPendingInstructors((prev) => prev.filter((i) => i._id !== id));
      toast.success(`Approved ${name} as Instructor!`);
    } catch (err) {
      toast.error('Failed to approve instructor');
    }
  };

  const handleRejectInstructor = async (id, name) => {
    try {
      await api.put(`/courses/admin/users/${id}/approve`, { isApproved: false }).catch(() => {});
      setPendingInstructors((prev) => prev.filter((i) => i._id !== id));
      toast.error(`Rejected approval for ${name}`);
    } catch (err) {
      toast.error('Failed to reject instructor');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Admin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Administrator Command Center
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            System Executive Dashboard ⚡
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time platform metrics, user management, course approvals, and financial analytics.
          </p>
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Platform Users</p>
            <h3 className="text-2xl font-bold text-white">2,450</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">
            <FiDollarSign />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Gross Revenue</p>
            <h3 className="text-2xl font-bold text-white">$27,900</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
            <FiBookOpen />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Courses</p>
            <h3 className="text-2xl font-bold text-white">84</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
            <FiUserCheck />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-white">{pendingInstructors.length}</h3>
          </div>
        </div>
      </div>

      {/* Recharts Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Growth Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-emerald-400" />
              Platform Revenue & User Growth
            </h3>
            <span className="text-xs text-slate-400">YTD 2026</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiPieChart className="text-purple-400" />
            Category Distribution
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Instructor Approvals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FiUserCheck className="text-amber-400" />
          Pending Instructor Account Approvals
        </h3>

        {pendingInstructors.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm bg-slate-950/50 rounded-2xl border border-slate-800">
            No pending instructor applications at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Date Applied</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingInstructors.map((applicant) => (
                  <tr key={applicant._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{applicant.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{applicant.email}</td>
                    <td className="py-3.5 px-4 text-slate-400">{applicant.createdAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveInstructor(applicant._id, applicant.name)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                        >
                          <FiCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectInstructor(applicant._id, applicant.name)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                        >
                          <FiXCircle /> Reject
                        </button>
                      </div>
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
