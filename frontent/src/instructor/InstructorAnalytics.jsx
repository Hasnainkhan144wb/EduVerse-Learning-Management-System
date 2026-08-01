import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiUsers,
  FiDollarSign,
  FiTarget,
  FiStar,
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const InstructorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRevenue: 0,
      totalStudents: 0,
      avgProgress: 0,
      coursesCount: 0,
      averageRating: 5.0,
    },
    monthlyRevenue: [],
    courseEnrollments: [],
    ratingsBreakdown: [],
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/instructor/analytics');
        if (res.data && res.data.success) {
          setAnalytics(res.data.analytics || res.data.data);
        }
      } catch (err) {
        console.error('Error fetching instructor analytics:', err);
        toast.error('Failed to load real-time analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const summary = analytics.summary || {};
  const monthlyData = analytics.monthlyRevenue || [];
  const courseData = (analytics.courseEnrollments || []).map((item) => ({
    course: item.title?.length > 20 ? `${item.title.substring(0, 18)}...` : item.title,
    students: item.studentCount,
    progress: item.avgProgress,
  }));

  const ratingsData = (analytics.ratingsBreakdown || []).map((r, index) => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    return {
      name: r.stars,
      value: r.count,
      color: colors[index % colors.length],
    };
  });

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-semibold">Loading real-time MongoDB analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Real-Time Analytics
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Instructor Revenue & Student Engagement Studio 📊
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time MongoDB analytics monitoring monthly revenue, course enrollment growth, student progress, and ratings.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">
            <FiDollarSign />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Gross Revenue</p>
            <h3 className="text-2xl font-bold text-white">${summary.totalRevenue?.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Student Enrolments</p>
            <h3 className="text-2xl font-bold text-white">{summary.totalStudents}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl">
            <FiTarget />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Student Progress</p>
            <h3 className="text-2xl font-bold text-white">{summary.avgProgress}%</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
            <FiStar />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Course Rating Score</p>
            <h3 className="text-2xl font-bold text-white">{summary.averageRating} ★</h3>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-emerald-400" />
              Monthly Sales & Revenue Growth ($ USD)
            </h3>
            <span className="text-xs text-slate-400">Live Database Pipeline</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
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

        {/* Rating Breakdown Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiPieChart className="text-purple-400" />
            Course Rating Distribution
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ratingsData.map((entry, index) => (
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

      {/* Course Enrolments Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FiBarChart2 className="text-blue-400" />
          Enrolment Distribution & Progress Rates by Course
        </h3>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseData}>
              <XAxis dataKey="course" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                }}
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Students Enrolled" />
              <Bar dataKey="progress" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Avg Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default InstructorAnalytics;
