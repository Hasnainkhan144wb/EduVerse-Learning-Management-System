import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiBookmark,
  FiTrash2,
  FiBookOpen,
  FiArrowRight,
  FiStar,
} from 'react-icons/fi';

const Watchlist = () => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/watchlist');
      const list = res.data.wishlist || res.data.watchlist || res.data.data || [];
      setWatchlistItems(list.filter((c) => c !== null && c !== undefined && typeof c === 'object'));
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleToggleWatchlist = async (courseItem) => {
    // Extract exact string ID
    const targetCourseId =
      typeof courseItem === 'object' && courseItem !== null
        ? courseItem._id || courseItem.id
        : courseItem;

    if (!targetCourseId) return;

    // Optimistic UI Update
    setWatchlistItems((prev) =>
      prev.filter((item) => String(item._id || item) !== String(targetCourseId))
    );

    try {
      const response = await api.post('/users/watchlist/toggle', { courseId: targetCourseId });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Updated watchlist!');
      }
    } catch (error) {
      console.error('Remove Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update watchlist');
      fetchWatchlist();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto font-sans"
    >
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Student Portal • Personal Watchlist
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiBookmark className="text-indigo-400 fill-indigo-400" /> My Saved Watchlist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bookmark interesting courses to save them for later or enrol when ready.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
        >
          Explore Catalog <FiArrowRight />
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-xs font-medium">Loading your bookmarked courses...</p>
        </div>
      ) : watchlistItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            <FiBookmark />
          </div>
          <h3 className="text-lg font-bold text-white">Your Watchlist is Empty</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Browse our course catalog and click the bookmark button on any course to save it here.
          </p>
          <Link
            to="/courses"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlistItems.map((course) => (
            <div
              key={course._id || course.id || Math.random()}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition font-sans"
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWatchlist(course);
                  }}
                  className="absolute top-3 right-3 p-2.5 bg-slate-950/90 hover:bg-red-600/90 text-slate-300 hover:text-white rounded-full transition shadow-md cursor-pointer z-10"
                  title="Remove from Watchlist"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
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
                    <FiStar className="fill-amber-400" /> 4.9
                  </div>
                  <span className="text-base font-extrabold text-white">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={`/courses/${course._id}`}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition text-center"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/checkout/${course._id}`}
                    className="py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1 transition"
                  >
                    Enrol Now <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Watchlist;
