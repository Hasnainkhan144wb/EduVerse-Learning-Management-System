import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiClock,
  FiTrendingUp,
  FiUser,
  FiFolder,
} from 'react-icons/fi';
import api from '../services/api';

const RECENT_SEARCHES = ['React Development', 'UI/UX Design', 'Machine Learning'];
const POPULAR_SEARCHES = ['Web Development', 'Python', 'JavaScript', 'MERN Stack', 'Flutter', 'Data Science'];

const SearchBar = ({ onSearch, placeholder = 'Search courses, instructors, or categories...', className = '' }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [matchingResults, setMatchingResults] = useState({ courses: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch live matching suggestions when user types
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchingResults({ courses: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const [coursesRes, categoriesRes] = await Promise.all([
          api.get(`/courses?keyword=${encodeURIComponent(searchTerm.trim())}&status=Published`).catch(() => null),
          api.get('/categories').catch(() => null),
        ]);

        const courses = (coursesRes?.data?.data || []).slice(0, 4);
        const allCategories = categoriesRes?.data?.data || [];
        const categories = allCategories
          .filter((cat) => cat.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 3);

        setMatchingResults({ courses, categories });
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectSearch = (term) => {
    setSearchTerm(term);
    setIsFocused(false);
    if (onSearch) {
      onSearch(term);
    } else {
      navigate(`/courses?search=${encodeURIComponent(term)}`);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSelectSearch(searchTerm.trim());
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <FiSearch className="w-5 h-5 text-slate-400" />
        </div>

        {/* Search Input Field - Premium Pill Shape (44-48px height) */}
        <input
          type="text"
          value={searchTerm}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full h-11 md:h-12 pl-11 pr-12 text-xs md:text-sm text-slate-100 bg-slate-950/80 border border-slate-800 rounded-full focus:outline-none focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 placeholder-slate-400 shadow-sm hover:border-slate-700 font-sans"
        />

        {/* Right Clear or Submit Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition"
              title="Clear"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-md shadow-blue-600/30"
              title="Search"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* SEARCH SUGGESTIONS DROPDOWN PANEL */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs text-slate-300 font-sans"
          >
            {/* Live Typing Matching Results */}
            {searchTerm.trim() ? (
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiSearch className="text-blue-400" /> Search Results for "{searchTerm}"
                  </span>
                  {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* Matching Courses */}
                {matchingResults.courses.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                      Courses
                    </span>
                    <div className="space-y-1">
                      {matchingResults.courses.map((course) => (
                        <div
                          key={course._id}
                          onClick={() => {
                            setIsFocused(false);
                            navigate(`/courses/${course._id}`);
                          }}
                          className="p-2.5 hover:bg-slate-800/80 rounded-xl cursor-pointer transition flex items-center gap-3 group"
                        >
                          <img
                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                            alt={course.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white group-hover:text-blue-400 transition truncate">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{course.categoryRef?.name || 'General'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FiUser className="w-3 h-3 text-slate-500" />
                                {course.instructorRef?.name || 'Instructor'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Categories */}
                {matchingResults.categories.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {matchingResults.categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            setIsFocused(false);
                            navigate(`/courses?category=${cat._id}`);
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-600/20 text-slate-200 hover:text-indigo-300 border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <FiFolder className="text-indigo-400" /> {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchingResults.courses.length === 0 && matchingResults.categories.length === 0 && !loading && (
                  <div className="p-4 text-center text-slate-500 space-y-1">
                    <p className="text-xs">Press Enter to search for "{searchTerm}"</p>
                  </div>
                )}
              </div>
            ) : (
              /* Default Suggestions: Recent & Popular Searches */
              <div className="p-4 space-y-4">
                {/* Recent Searches */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiClock className="text-slate-400" /> Recent Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {RECENT_SEARCHES.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearch(item)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full text-xs transition flex items-center gap-1.5"
                      >
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Searches */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiTrendingUp className="text-amber-400" /> Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearch(item)}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-full text-xs font-semibold transition"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
