import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBookOpen,
  FiClock,
  FiAward,
  FiCheckCircle,
  FiPlay,
  FiArrowRight,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/enrolments/my-courses').catch(() => null);
        if (response && response.data.success) {
          setEnrolments(response.data.data || []);
        } else {
          setEnrolments([]);
        }
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const completedCount = enrolments.filter((e) => e.progressPercentage === 100).length;
  const inProgressCount = enrolments.length - completedCount;
  const lastActiveEnrolment = enrolments.length > 0 ? enrolments[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Student Portal • Workspace
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Learner'}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your course progress, complete assignments, and earn verified certificates.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
        >
          Explore New Courses <FiArrowRight />
        </Link>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-500/30">
            <FiBookOpen />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Enrolled Courses</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{enrolments.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/30">
            <FiClock />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Hours Spent</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">34.5 hrs</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/30">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Completed Courses</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/30">
            <FiAward />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Quiz Avg. Score</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">88.5%</p>
          </div>
        </div>
      </div>

      {/* Continue Learning Feature Widget */}
      {lastActiveEnrolment && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Resume Active Course
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {lastActiveEnrolment.courseId?.title}
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Overall Completion</span>
                <span className="text-indigo-400 font-bold">
                  {lastActiveEnrolment.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-500"
                  style={{ width: `${lastActiveEnrolment.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <Link
            to={`/course-player/${lastActiveEnrolment.courseId?._id}`}
            className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
          >
            <FiPlay className="fill-white" /> Continue Learning
          </Link>
        </div>
      )}

      {/* Enrolled Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Your Enrolled Courses</h2>
          <Link to="/student/courses" className="text-xs font-bold text-indigo-400 hover:underline">
            View All ({enrolments.length})
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Loading active courses...</p>
          </div>
        ) : enrolments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <p className="text-slate-400 text-sm">No courses enrolled yet.</p>
            <Link to="/courses" className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolments.map((enrol) => {
              const course = enrol.courseId || {};
              const progress = enrol.progressPercentage || 0;

              return (
                <div
                  key={enrol._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition"
                >
                  <div className="relative h-40 bg-slate-800 overflow-hidden">
                    <img
                      src={
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>Progress</span>
                        <span className="text-indigo-400 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/course-player/${course._id}`}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl text-center transition flex items-center justify-center gap-1.5"
                    >
                      <FiPlay /> Resume Course
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
