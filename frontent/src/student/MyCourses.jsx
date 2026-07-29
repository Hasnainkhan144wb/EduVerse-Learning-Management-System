import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  FiBookOpen,
  FiPlay,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiArrowRight,
} from 'react-icons/fi';

const MyCourses = () => {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/enrolments/my-courses');
        if (response.data.success) {
          setEnrolments(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Student Portal • Enrolled Learning
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiBookOpen className="text-indigo-400" /> My Enrolled Courses
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Continue learning, watch video lectures, complete assignments, and earn accredited certificates.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
        >
          Browse Catalog <FiArrowRight />
        </Link>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Fetching your enrolled courses...</p>
        </div>
      ) : enrolments.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            <FiBookOpen />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">You haven't enrolled in any courses yet</h3>
            <p className="text-slate-400 text-xs mt-1">Explore our course catalog and start your learning journey today.</p>
          </div>
          <Link
            to="/courses"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolments.map((enrol) => {
            const course = enrol.courseId || {};
            const progress = enrol.progressPercentage || 0;

            return (
              <div
                key={enrol._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition"
              >
                <div className="relative h-48 bg-slate-800 overflow-hidden">
                  <img
                    src={
                      course.thumbnail ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-indigo-400 rounded-full border border-slate-700">
                    {progress}% Completed
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-2">
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/course-player/${course._id}`}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <FiPlay className="fill-white" /> Continue Learning
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default MyCourses;
