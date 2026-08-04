import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiStar, FiArrowRight, FiBookmark } from 'react-icons/fi';

import { getFileUrl } from '../utils/getFileUrl';

const CourseCard = ({ course, onWatchlistToggle }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (user && course) {
      const watchlist = user.watchlist || user.wishlist || [];
      const inWatchlist = watchlist.some(
        (item) => String(item._id || item) === String(course._id)
      );
      setIsBookmarked(inWatchlist);
    }
  }, [user, course]);

  const handleToggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to bookmark courses!');
      return;
    }

    try {
      const res = await api.post('/users/watchlist/toggle', { courseId: course._id });
      if (res.data && res.data.success) {
        setIsBookmarked(res.data.isBookmarked);
        toast.success(res.data.message || (res.data.isBookmarked ? 'Added to Watchlist!' : 'Removed from Watchlist!'));
        if (onWatchlistToggle) onWatchlistToggle(course._id, res.data.isBookmarked);
      }
    } catch (err) {
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col group relative"
    >
      <div className="h-44 bg-slate-950 relative overflow-hidden">
        <img
          src={getFileUrl(course.thumbnail || course.coverImage)}
          alt={course.title || 'Course Thumbnail'}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
          }}
        />

        {/* Level Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-blue-400 rounded-full border border-slate-700">
          {course.level || 'Beginner'}
        </div>

        {/* Interactive Bookmark / Watchlist Button */}
        <button
          onClick={handleToggleWatchlist}
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all text-sm hover:scale-110 ${
            isBookmarked
              ? 'bg-indigo-600 text-white border border-indigo-400 shadow-indigo-600/40'
              : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700'
          }`}
          title={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <FiBookmark className={isBookmarked ? 'fill-white' : ''} />
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
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <FiStar className="fill-amber-400 text-amber-400" />
            <span>{(course.averageRating !== undefined && course.averageRating !== null && course.averageRating > 0) ? course.averageRating : (course.rating || '4.8')}</span>
            <span className="text-slate-400 text-[11px] font-normal">
              ({course.totalReviews !== undefined ? course.totalReviews : (course.reviewsCount || 0)} Reviews)
            </span>
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
  );
};

export default CourseCard;
