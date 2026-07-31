import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';
import {
  FiBookOpen,
  FiSearch,
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
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
} from 'react-icons/fi';

const Home = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchTrendingCourses = async () => {
      try {
        const response = await api.get('/courses?status=Published&limit=6').catch(() => null);
        if (response && response.data.success) {
          setCourses(response.data.data);
        } else {
          // Fallback mock courses if DB has no published courses yet
          setCourses([
            {
              _id: 'c1',
              title: 'Full-Stack MERN Mastery: Node.js, Express & React',
              description: 'Build enterprise-grade web applications from scratch with modern MERN stack.',
              thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
              instructorRef: { name: 'Dr. Sarah Jenkins' },
              level: 'Beginner',
              price: 49.99,
              rating: 4.9,
            },
            {
              _id: 'c2',
              title: 'Python for Data Science & Machine Learning Bootcamp',
              description: 'Learn NumPy, Pandas, Scikit-Learn, and Neural Networks with hands-on projects.',
              thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
              instructorRef: { name: 'Alex Rivera' },
              level: 'Intermediate',
              price: 59.99,
              rating: 4.8,
            },
            {
              _id: 'c3',
              title: 'UI/UX Design Masterclass: Figma & Design Systems',
              description: 'Master modern interface design, wireframing, prototyping, and design tokens.',
              thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
              instructorRef: { name: 'Elena Rostova' },
              level: 'All Levels',
              price: 39.99,
              rating: 4.9,
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading trending courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchTrendingCourses();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/courses?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  const categories = [
    { title: 'Web Development', icon: FiCode, count: '320+ Courses', color: 'from-blue-600 to-indigo-600' },
    { title: 'Data Science & AI', icon: FiCpu, count: '180+ Courses', color: 'from-purple-600 to-pink-600' },
    { title: 'UI/UX Design', icon: FiLayout, count: '150+ Courses', color: 'from-amber-500 to-orange-600' },
    { title: 'Business & Analytics', icon: FiBriefcase, count: '210+ Courses', color: 'from-emerald-500 to-teal-600' },
  ];

  const features = [
    {
      title: 'HD Video Lectures',
      description: 'Stream crystal-clear video lessons with playback speed control and captions.',
      icon: FiVideo,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'PDF & Code Resources',
      description: 'Download lesson cheat-sheets, source code repositories, and slide decks.',
      icon: FiFileText,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Automated Quizzes',
      description: 'Test your retention with instant MCQ grading, feedback, and score reports.',
      icon: FiHelpCircle,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Verified Certificates',
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              EduVerse
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses, skills, topics..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </form>

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-4">
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
              <div className="relative z-10 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
                  alt="Students learning online"
                  className="w-full h-80 md:h-96 object-cover rounded-2xl"
                />

                {/* Floating Badge */}
                <div className="absolute bottom-8 left-8 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">
                    <FiAward />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Over 10,000+ Certificates</p>
                    <p className="text-[11px] text-slate-400">Issued to Students Worldwide</p>
                  </div>
                </div>
              </div>

              {/* Background Blur Effect */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES GRID */}
      <section className="py-16 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Explore Top Categories</h2>
            <p className="text-slate-400 text-sm">Discover courses tailored to in-demand technology and creative fields.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition group cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white text-2xl shadow-lg mb-4 group-hover:scale-110 transition`}
                  >
                    <Icon />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRENDING COURSES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Trending Courses</h2>
              <p className="text-slate-400 text-sm mt-1">Hand-picked courses from expert instructors</p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              View All Courses <FiArrowRight />
            </Link>
          </div>

          {loadingCourses ? (
            <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Loading courses...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    <img
                      src={
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
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
                        <span>4.9 (120 reviews)</span>
                      </div>
                      <span className="text-base font-extrabold text-white">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </span>
                    </div>

                    <Link
                      to={isAuthenticated ? `/course-player/${course._id}` : '/login'}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE EDUVERSE */}
      <section className="py-16 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Why Choose EduVerse?</h2>
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
