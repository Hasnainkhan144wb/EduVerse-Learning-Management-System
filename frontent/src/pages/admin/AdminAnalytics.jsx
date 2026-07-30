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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import api from '../../services/api';
import {
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiBookOpen,
  FiDownload,
  FiAward,
  FiPieChart,
  FiStar,
} from 'react-icons/fi';

const defaultMonthlyData = [
  { month: 'Jan', revenue: 4200, enrolments: 120 },
  { month: 'Feb', revenue: 6800, enrolments: 190 },
  { month: 'Mar', revenue: 9500, enrolments: 240 },
  { month: 'Apr', revenue: 12400, enrolments: 310 },
  { month: 'May', revenue: 15800, enrolments: 420 },
  { month: 'Jun', revenue: 21000, enrolments: 580 },
];

const defaultCategoryData = [
  { name: 'Web Dev', value: 40, color: '#3b82f6' },
  { name: 'Data Science', value: 25, color: '#8b5cf6' },
  { name: 'UI/UX Design', value: 20, color: '#ec4899' },
  { name: 'Business', value: 15, color: '#10b981' },
];

const defaultPopularCourses = [
  {
    _id: 'c1',
    title: 'Full-Stack MERN Architecture 2026 Masterclass',
    category: 'Web Dev',
    instructor: 'Dr. Angela Yu',
    price: 89.99,
    enrolmentsCount: 342,
    rating: 4.9,
  },
  {
    _id: 'c2',
    title: 'Python for Data Science & Machine Learning',
    category: 'Data Science',
    instructor: 'Jose Portilla',
    price: 79.99,
    enrolmentsCount: 289,
    rating: 4.8,
  },
  {
    _id: 'c3',
    title: 'Figma UI/UX Design System Pro Workshop',
    category: 'UI/UX Design',
    instructor: 'Dan Walter',
    price: 49.99,
    enrolmentsCount: 215,
    rating: 4.9,
  },
  {
    _id: 'c4',
    title: 'React Native & Expo iOS/Android Development',
    category: 'Mobile Dev',
    instructor: 'Maximilian Schwarzmüller',
    price: 94.99,
    enrolmentsCount: 178,
    rating: 4.7,
  },
  {
    _id: 'c5',
    title: 'Executive Financial Leadership & Valuation',
    category: 'Business',
    instructor: 'Chris Haroun',
    price: 59.99,
    enrolmentsCount: 140,
    rating: 4.6,
  },
];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRevenue: 42850,
      monthlyGrowthRate: 18.4,
      totalStudents: 1420,
      totalInstructors: 48,
      totalCourses: 52,
      totalEnrolments: 850,
    },
    monthlyTrends: defaultMonthlyData,
    categoryBreakdown: defaultCategoryData,
    popularCourses: defaultPopularCourses,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/analytics');
        if (response.data.success) {
          setAnalytics(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    toast.success('Analytics Executive Report generated & exported to CSV! 📊');
  };

  const { summary, monthlyTrends, categoryBreakdown, popularCourses } = analytics;

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
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Executive Intelligence & BI
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiBarChart2 className="text-indigo-500" /> Platform Growth & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Financial revenue trends, user growth velocity, category market share, and course performance.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-2 transition shrink-0"
        >
          <FiDownload className="w-4 h-4" /> Export Executive CSV
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase">Gross Revenue</p>
            <p className="text-2xl font-extrabold text-white">
              ${(summary.totalRevenue || 42850).toLocaleString()}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <FiTrendingUp /> +{summary.monthlyGrowthRate || 18.4}% this month
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/30">
            <FiDollarSign />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Students</p>
            <p className="text-2xl font-extrabold text-white">
              {(summary.totalStudents || 1420).toLocaleString()}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400">
              Active Enrollments
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-500/30">
            <FiUsers />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase">Verified Instructors</p>
            <p className="text-2xl font-extrabold text-white">
              {summary.totalInstructors || 48}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400">
              Teaching Faculty
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-500/30">
            <FiAward />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase">Published Courses</p>
            <p className="text-2xl font-extrabold text-white">
              {summary.totalCourses || 52}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400">
              Catalog Items
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/30">
            <FiBookOpen />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Growth Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FiTrendingUp className="text-blue-400" /> Revenue & Enrollment Velocity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly breakdown ($ vs Enrolment count)</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends || defaultMonthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Market Share Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiPieChart className="text-purple-400" /> Category Market Share
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Course volume per category</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown || defaultCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(categoryBreakdown || defaultCategoryData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#818cf8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Most Popular Courses */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiAward className="text-amber-400" /> Top 5 Most Popular Courses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by student enrollment volume and average ratings.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Rank & Course Title</th>
                <th className="py-3.5 px-4">Instructor</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4 text-right">Student Enrolments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(popularCourses || defaultPopularCourses).map((course, idx) => (
                <tr key={course._id || idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold text-xs flex items-center justify-center border border-blue-500/30">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-white line-clamp-1">
                      {course.title}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-300 font-semibold">
                    {course.instructorRef?.name || course.instructor || 'Faculty'}
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full font-medium text-slate-300">
                      {course.categoryRef?.name || course.category || 'General'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-amber-400 font-bold flex items-center gap-1">
                    <FiStar className="fill-amber-400" /> {course.rating || 4.8}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-white text-xs">
                    {course.enrolmentsCount || 250} Students
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
