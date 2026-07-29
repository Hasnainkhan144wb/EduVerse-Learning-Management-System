import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBookOpen,
  FiAward,
  FiHeart,
  FiPlayCircle,
  FiCheckCircle,
  FiArrowRight,
  FiTrendingUp,
} from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolments, setEnrolments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [enrolRes, certRes] = await Promise.all([
          api.get('/enrolments/my-courses').catch(() => ({ data: { data: [] } })),
          api.get('/certificates/my-certificates').catch(() => ({ data: { data: [] } })),
        ]);

        setEnrolments(enrolRes.data.data || []);
        setCertificates(certRes.data.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const completedCount = enrolments.filter((e) => e.progressPercentage === 100).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100">
            Student Workspace
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Learner'}! 👋
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Continue your learning journey. Track your progress, complete lessons, and earn certified achievements.
          </p>
        </div>

        {/* Abstract Background Design */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
            <FiBookOpen />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Enrolled Courses</p>
            <h3 className="text-2xl font-bold text-white">{enrolments.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Courses</p>
            <h3 className="text-2xl font-bold text-white">{completedCount}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl">
            <FiAward />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Certificates Earned</p>
            <h3 className="text-2xl font-bold text-white">{certificates.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-2xl">
            <FiHeart />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Wishlist Items</p>
            <h3 className="text-2xl font-bold text-white">{user?.wishlist?.length || 0}</h3>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiTrendingUp className="text-indigo-400" />
            In-Progress Courses
          </h2>
          <Link
            to="/student/courses"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading course progress...</p>
          </div>
        ) : enrolments.length === 0 ? (
          <div className="p-10 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto text-2xl">
              <FiBookOpen />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No courses enrolled yet</h3>
              <p className="text-slate-400 text-sm mt-1">Explore our catalog and enroll in courses to start learning.</p>
            </div>
            <Link
              to="/courses"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolments.map((enrolment) => {
              const course = enrolment.courseId || {};
              const progress = enrolment.progressPercentage || 0;

              return (
                <div
                  key={enrolment._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col group"
                >
                  <div className="relative h-44 bg-slate-800 overflow-hidden">
                    <img
                      src={
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-blue-400 rounded-full border border-slate-700">
                      {course.level || 'All Levels'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition line-clamp-1">
                        {course.title || 'Untitled Course'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {course.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Overall Completion</span>
                        <span className="text-indigo-400">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/course-player/${course._id}`}
                      className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <FiPlayCircle className="w-4 h-4" />
                      {progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiAward className="text-purple-400" />
            Your Earned Certificates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl">
                    <FiAward />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white truncate max-w-[180px]">
                      {cert.courseId?.title || 'Course Certificate'}
                    </h4>
                    <p className="text-[11px] text-slate-400">ID: {cert.certificateId}</p>
                  </div>
                </div>

                <a
                  href={`http://localhost:5000${cert.certificateUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold rounded-lg transition"
                >
                  Download PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;
