import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import Footer from '../components/Footer';
import {
  FiBookOpen,
  FiFilter,
  FiStar,
  FiUser,
  FiLogOut,
  FiArrowRight,
} from 'react-icons/fi';

const BrowseCourses = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get('keyword') || searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const priceFilter = searchParams.get('price') || '';

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.append('status', 'Published');
        if (keyword) query.append('keyword', keyword);
        if (category) query.append('category', category);
        if (level) query.append('level', level);

        const [coursesRes, categoriesRes] = await Promise.all([
          api.get(`/courses?${query.toString()}`).catch(() => null),
          api.get('/categories').catch(() => null),
        ]);

        if (coursesRes && coursesRes.data) {
          let list = coursesRes.data.courses || coursesRes.data.data || (Array.isArray(coursesRes.data) ? coursesRes.data : []);
          if (priceFilter === 'free') {
            list = list.filter((c) => c.price === 0);
          } else if (priceFilter === 'paid') {
            list = list.filter((c) => c.price > 0);
          }
          setCourses(list);
        } else {
          setCourses([]);
        }

        if (categoriesRes && categoriesRes.data && categoriesRes.data.success) {
          setCategories(categoriesRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching course catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesData();
  }, [keyword, category, level, priceFilter]);

  const handleCategoryFilter = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleLevelFilter = (lvl) => {
    const params = new URLSearchParams(searchParams);
    if (lvl) {
      params.set('level', lvl);
    } else {
      params.delete('level');
    }
    setSearchParams(params);
  };

  const handlePriceFilter = (prc) => {
    const params = new URLSearchParams(searchParams);
    if (prc) {
      params.set('price', prc);
    } else {
      params.delete('price');
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <FiBookOpen className="w-5 h-5" />
            </div>
            EduVerse Catalog
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-slate-300 hover:text-white transition">
              Home
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'Instructor' ? '/instructor' : user?.role === 'Admin' ? '/admin' : '/student'}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <FiUser /> Dashboard
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 rounded-xl" title="Logout">
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-lg">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* CATALOG HEADER */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Course Catalog & Knowledge Base</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Discover accredited courses designed by expert instructors in Web Dev, AI, Design & Business.
          </p>

          <div className="max-w-xl mx-auto">
            <SearchBar
              onSearch={(val) => {
                const params = new URLSearchParams(searchParams);
                if (val) {
                  params.set('keyword', val);
                } else {
                  params.delete('keyword');
                  params.delete('search');
                }
                setSearchParams(params);
              }}
              placeholder="Search by course title, skill, or keyword..."
            />
          </div>
        </div>
      </div>

      {/* MAIN CATALOG BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 w-full">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiFilter className="text-indigo-400" /> Filter by Category
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                  !category ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryFilter(cat._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    category === cat._id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              Filter by Level
            </h3>
            <div className="space-y-1.5">
              {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleLevelFilter(lvl === 'All Levels' ? '' : lvl)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    (lvl === 'All Levels' && !level) || level === lvl
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              Pricing Options
            </h3>
            <div className="space-y-1.5">
              {[
                { label: 'All Courses', value: '' },
                { label: 'Free Courses', value: 'free' },
                { label: 'Paid Courses', value: 'paid' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePriceFilter(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    priceFilter === opt.value
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-xs">Loading course catalog...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <FiBookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Courses Found</h3>
              <p className="text-xs text-slate-400">
                Try adjusting your search keywords or filter settings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BrowseCourses;
