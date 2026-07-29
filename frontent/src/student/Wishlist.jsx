import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiHeart,
  FiTrash2,
  FiBookOpen,
  FiArrowRight,
  FiStar,
} from 'react-icons/fi';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.data.wishlist) {
        setWishlistItems(response.data.data.wishlist);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveWishlist = async (courseId) => {
    try {
      const response = await api.post('/auth/wishlist', { courseId });
      if (response.data.success) {
        toast.success('Course removed from wishlist');
        fetchWishlist();
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Student Portal • Saved Items
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiHeart className="text-pink-500 fill-pink-500" /> My Saved Wishlist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bookmark interesting courses to enrol in when you are ready.
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
          <p className="text-slate-400 text-xs">Loading saved wishlist items...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            <FiHeart />
          </div>
          <h3 className="text-lg font-bold text-white">Your Wishlist is Empty</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Browse our course catalog and click the heart icon to save courses to your personal wishlist.
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
          {wishlistItems.map((course) => (
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
                <button
                  onClick={() => handleRemoveWishlist(course._id)}
                  className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-red-600/90 text-slate-300 hover:text-white rounded-full transition shadow-md"
                  title="Remove from wishlist"
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

                <Link
                  to={`/checkout/${course._id}`}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition"
                >
                  Enrol Now <FiArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Wishlist;
