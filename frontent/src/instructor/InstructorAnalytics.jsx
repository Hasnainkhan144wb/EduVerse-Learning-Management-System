import React from 'react';
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
  FiAward,
  FiTarget,
} from 'react-icons/fi';

const monthlyEarningsData = [
  { month: 'Jan', earnings: 1200, enrollments: 45 },
  { month: 'Feb', earnings: 2100, enrollments: 78 },
  { month: 'Mar', earnings: 3400, enrollments: 120 },
  { month: 'Apr', earnings: 4800, enrollments: 165 },
  { month: 'May', earnings: 6200, enrollments: 210 },
  { month: 'Jun', earnings: 8500, enrollments: 290 },
  { month: 'Jul', earnings: 11200, enrollments: 380 },
];

const courseEnrollmentData = [
  { course: 'React & Node Masterclass', students: 185 },
  { course: 'Full-Stack MERN Guide', students: 142 },
  { course: 'Tailwind CSS UI/UX', students: 98 },
  { course: 'Advanced TypeScript', students: 64 },
];

const quizPassRateData = [
  { name: 'Passed (Score >= 70%)', value: 78, color: '#10b981' },
  { name: 'Failed / Retake Required', value: 22, color: '#ef4444' },
];

const InstructorAnalytics = () => {
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
            Performance Analytics
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Instructor Revenue & Student Engagement Studio 📊
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time charts monitoring course sales, enrollment trends, and quiz completion analytics.
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
            <p className="text-xs text-slate-400 font-medium">YTD Revenue</p>
            <h3 className="text-2xl font-bold text-white">$11,200</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Student Enrolments</p>
            <h3 className="text-2xl font-bold text-white">489</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl">
            <FiTarget />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Completion Rate</p>
            <h3 className="text-2xl font-bold text-white">84.2%</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
            <FiAward />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Quiz Pass Avg</p>
            <h3 className="text-2xl font-bold text-white">78.0%</h3>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-emerald-400" />
              Monthly Earnings & Revenue ($ USD)
            </h3>
            <span className="text-xs text-slate-400">2026 Growth</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEarningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="earnings"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Pass Rate Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiPieChart className="text-purple-400" />
            Quiz Pass Rate Distribution
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={quizPassRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {quizPassRateData.map((entry, index) => (
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
          Enrolment Comparison by Course
        </h3>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseEnrollmentData}>
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
              <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default InstructorAnalytics;
