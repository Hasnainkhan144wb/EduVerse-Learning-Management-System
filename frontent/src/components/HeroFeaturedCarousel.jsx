import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getFileUrl } from '../utils/getFileUrl';

const HeroFeaturedCarousel = () => {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. FETCH PUBLISHED COURSES FOR SLIDESHOW
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/courses/published');
        const list = res.data?.courses || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (list.length > 0) {
          setFeaturedCourses(list);
        }
      } catch (err) {
        console.error('Failed to load slideshow courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 2. AUTO-ROTATE SLIDE EVERY 4 SECONDS
  useEffect(() => {
    if (featuredCourses.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredCourses.length);
    }, 4000); // 4 Seconds per slide

    return () => clearInterval(interval);
  }, [featuredCourses.length]);

  const activeCourse = featuredCourses[currentIndex];

  if (loading) {
    return (
      <div className="w-full h-[380px] bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl flex flex-col items-center justify-center text-slate-400 font-semibold animate-pulse space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading Featured Academy Showcase...</p>
      </div>
    );
  }

  if (!activeCourse) return null;

  const categoryName =
    activeCourse.categoryRef?.name ||
    activeCourse.category?.name ||
    activeCourse.category ||
    'Featured Academy Course';

  const totalLessons =
    activeCourse.lessonsCount ||
    (activeCourse.sections
      ? activeCourse.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)
      : 0) ||
    12;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/20">
        <div
          onClick={() => navigate(`/courses/${activeCourse._id}`)}
          className="bg-slate-900 rounded-[22px] p-6 space-y-5 cursor-pointer transition-all duration-300 hover:bg-slate-900/90 group"
        >
          {/* TOP CARD HEADER */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-600/40">
                EV
              </div>
              <div>
                <h3 className="font-bold text-white text-sm md:text-base leading-tight group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {activeCourse.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 truncate max-w-[180px]">
                  {categoryName}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shadow-sm shrink-0">
              Enrolling Now
            </span>
          </div>

          {/* THUMBNAIL / MEDIA CONTAINER WITH AUTO SLIDE & FADE */}
          <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeCourse._id}
                initial={{ opacity: 0.4, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.4, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                src={getFileUrl(activeCourse.thumbnail || activeCourse.coverImage)}
                alt={activeCourse.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </AnimatePresence>

            {/* PLAY / VIEW OVERLAY BADGE */}
            <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                ▶
              </div>
            </div>

            {/* SLIDESHOW NAVIGATION DOTS */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {featuredCourses.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* STATS FOOTER GRID */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-800">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="block font-bold text-white text-sm">{totalLessons}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Lessons</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="block font-bold text-amber-400 text-sm">
                {activeCourse.averageRating || activeCourse.rating || '4.9'} ★
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Rating</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="block font-bold text-emerald-400 text-sm">
                {activeCourse.price > 0 ? `$${activeCourse.price}` : 'Free'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Price</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroFeaturedCarousel;
