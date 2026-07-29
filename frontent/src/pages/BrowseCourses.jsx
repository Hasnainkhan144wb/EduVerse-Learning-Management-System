import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBookOpen,
  FiSearch,
  FiFilter,
  FiStar,
  FiUser,
  FiLogOut,
  FiArrowRight,
  FiDollarSign,
} from 'react-icons/fi';

const BrowseCourses = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const priceFilter = searchParams.get('price') || '';

  const [searchInput, setSearchInput] = useState(keyword);

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

        if (coursesRes && coursesRes.data.success) {
          let list = coursesRes.data.data || [];
          if (priceFilter === 'free') {
            list = list.filter((c) => c.price === 0);
          } else if (priceFilter === 'paid') {
            list = list.filter((c) => c.price > 0);
          }
          setCourses(list);
        } else {
          setCourses([]);
        }

        if (categoriesRes && categoriesRes.data.success) {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchParams.set('keyword', searchInput);
    } else {
      searchParams.delete('keyword');
    }
    setSearchParams(searchParams);
  };

  const handleCategoryFilter = (catId) => {
    if (category === catId) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleLevelFilter = (lvl) => {
    if (level === lvl) {
      searchParams.delete('level');
    } else {
      searchParams.set('level', lvl);
    }
    setSearchParams(searchParams);
  };

  const handlePriceFilter = (prc) => {
    if (priceFilter === prc) {
      searchParams.delete('price');
    } else {
      searchParams.set('price', prc);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span>EduVerse</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/courses" className="text-xs font-bold text-indigo-400">
              Explore Catalog
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'Instructor' ? '/instructor' : user?.role === 'Admin' ? '/admin' : '/student'}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <FiUser /> Dashboard
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 rounded-xl">
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

          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by course title, skill, or keyword..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CATALOG BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
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
              <FiFilter className="text-indigo-400" /> Filter by Skill Level
            </h3>
            <div className="space-y-1.5">
              {['Beginner', 'Intermediate', 'Advanced', 'All Levels'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleLevelFilter(lvl)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    level === lvl ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiDollarSign className="text-indigo-400" /> Price Filter
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => handlePriceFilter('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                  !priceFilter ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => handlePriceFilter('free')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                  priceFilter === 'free' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Free Courses
              </button>
              <button
                onClick={() => handlePriceFilter('paid')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                  priceFilter === 'paid' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Paid Premium Courses
              </button>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Fetching catalog courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto text-2xl">
                <FiBookOpen />
              </div>
              <h3 className="text-lg font-bold text-white">No courses match your search criteria</h3>
              <p className="text-slate-400 text-xs">Try clearing filters or searching with another keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition"
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
                        <span>4.9 (95)</span>
                      </div>
                      <span className="text-base font-extrabold text-white">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/courses/${course._id}`}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl text-center transition"
                      >
                        Details
                      </Link>
                      <Link
                        to={isAuthenticated ? `/checkout/${course._id}` : '/login'}
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl text-center shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1"
                      >
                        Enrol Now <FiArrowRight />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourses;
