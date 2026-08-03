import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import {
  FiBookOpen,
  FiCode,
  FiBarChart2,
  FiLayout,
  FiBriefcase,
  FiCpu,
  FiVideo,
  FiFileText,
  FiHelpCircle,
  FiAward,
  FiZap,
  FiStar,
  FiArrowRight,
  FiCheckCircle,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';

const Home = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [popularCourses, setPopularCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch published courses for landing showcase
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoadingCourses(true);
        const res = await api.get(`/courses/published?t=${Date.now()}`);
        if (res.data) {
          const courseList = res.data.courses || res.data.data || (Array.isArray(res.data) ? res.data : []);
          setPopularCourses(courseList.slice(0, 6));
        }
      } catch (err) {
        console.error('Error loading landing page courses:', err);
        setPopularCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchLandingData();
  }, []);

  const categories = [
    { title: 'Web Development', count: '14+ Courses', icon: FiCode, color: 'from-blue-600 to-indigo-600' },
    { title: 'Data Science & AI', count: '10+ Courses', icon: FiCpu, color: 'from-purple-600 to-pink-600' },
    { title: 'UI/UX & Product Design', count: '8+ Courses', icon: FiLayout, color: 'from-amber-500 to-orange-600' },
    { title: 'Business & Analytics', count: '12+ Courses', icon: FiBarChart2, color: 'from-emerald-600 to-teal-600' },
    { title: 'Cloud & DevOps', count: '6+ Courses', icon: FiBriefcase, color: 'from-cyan-600 to-blue-600' },
  ];

  const features = [
    {
      title: 'HD Video Streaming',
      description: 'Crystal-clear video lessons with playback speed control and lesson progress tracking.',
      icon: FiVideo,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Resource Downloads & Code',
      description: 'Direct PDF attachments, source code files, and curated reading materials.',
      icon: FiFileText,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Quizzes & Assignments',
      description: 'Test your knowledge with instant auto-graded quizzes and instructor assignments.',
      icon: FiHelpCircle,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Accredited Certificates',
      description: 'Earn downloadable PDF certificates with unique verification IDs.',
      icon: FiAward,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* PUBLIC NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* High Visibility Logo */}
          <Link to="/" className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold tracking-tight shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
              Edu<span className="text-blue-400">Verse</span>
            </span>
          </Link>

          {/* Search Bar Component with Suggestions */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar placeholder="Search courses, instructors, or categories..." />
          </div>

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/courses"
              className="hidden sm:inline-block text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Browse Courses
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'Instructor' ? '/instructor' : user?.role === 'Admin' ? '/admin' : '/student'}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
                >
                  <FiUser /> Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400">
                <FiZap className="w-4 h-4 text-amber-400" />
                <span>Next-Gen Learning Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Master New Skills with{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  EduVerse
                </span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                Accelerate your career with accredited video courses, interactive quizzes, downloadable resources, and verified certificates.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/courses"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform hover:scale-105"
                >
                  Explore Catalog <FiArrowRight />
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm rounded-xl transition"
                >
                  Become an Instructor
                </Link>
              </div>

              <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-400" /> 100% Online Learning
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-400" /> Verified Certificates
                </div>
              </div>
            </motion.div>

            {/* Right Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/20">
                <div className="bg-slate-900 rounded-[22px] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        EV
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Full-Stack MERN Mastery</h4>
                        <p className="text-xs text-slate-400">Featured Academy Course</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                      Enrolling Now
                    </span>
                  </div>

                  <div className="h-48 rounded-2xl overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80"
                      alt="Coding Course"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl">
                        ▶
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="block font-bold text-white">24</span>
                      <span className="text-[10px] text-slate-400">Lessons</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="block font-bold text-white">4.9 ★</span>
                      <span className="text-[10px] text-slate-400">Rating</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="block font-bold text-emerald-400">$49.99</span>
                      <span className="text-[10px] text-slate-400">Price</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TOP CATEGORIES SECTION */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Explore Top Categories</h2>
            <p className="text-slate-400 text-sm">
              Build high-demand tech skills through structured learning paths.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate('/courses')}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition group cursor-pointer space-y-3"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white text-xl shadow-lg`}
                  >
                    <Icon />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">{cat.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR COURSES SHOWCASE */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Popular Published Courses</h2>
              <p className="text-slate-400 text-sm mt-1">
                Hand-picked courses taught by verified industry professionals.
              </p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
            >
              View Full Catalog <FiArrowRight />
            </Link>
          </div>

          {loadingCourses ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-xs">Loading courses showcase...</p>
            </div>
          ) : popularCourses.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
              No published courses found in catalog.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col group"
                >
                  <div className="h-44 bg-slate-950 relative overflow-hidden">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-blue-400 rounded-full border border-slate-700">
                      {course.level || 'Beginner'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <FiStar className="fill-amber-400" />
                        <span>{course.rating || 5.0}</span>
                      </div>
                      <div className="text-emerald-400 font-extrabold text-sm">
                        {course.price === 0 ? 'Free' : `$${course.price || 49.99}`}
                      </div>
                    </div>

                    <Link
                      to={`/courses/${course._id}`}
                      className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      View Course Details <FiArrowRight />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE EDUVERSE */}
      <section className="py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Built for World-Class Learning</h2>
            <p className="text-slate-400 text-sm">
              Engineered with modern LMS tools for students, instructors, and administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${feat.color}`}
                  >
                    <Icon />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Home;
