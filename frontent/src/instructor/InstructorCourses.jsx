import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiBookOpen,
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiFileText,
  FiPlus,
} from 'react-icons/fi';

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/instructor/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.courses || res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading instructor courses:', err);
      toast.error(err.response?.data?.message || 'Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/courses/${courseId}`);
      if (res.data && res.data.success) {
        toast.success(`Course "${title}" removed successfully!`);
        fetchCourses();
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      toast.error(err.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            My Course Catalog
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Courses ({courses.length})</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage, publish, and update video curriculum for your created courses.
          </p>
        </div>
        <button
          onClick={() => navigate('/instructor/courses/create')}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
        >
          <FiPlusCircle className="w-4 h-4" /> + Create New Course
        </button>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Loading your courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mx-auto border border-indigo-500/20">
            <FiBookOpen />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Courses Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              You haven't built any courses in your studio portfolio. Get started by creating your first course today!
            </p>
          </div>
          <button
            onClick={() => navigate('/instructor/courses/create')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
          >
            <FiPlus /> Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col justify-between group"
            >
              {/* Thumbnail Header */}
              <div className="h-44 bg-slate-950 relative overflow-hidden">
                <img
                  src={
                    course.thumbnail ||
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80'
                  }
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      course.status === 'Published'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {course.status || 'Draft'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-blue-400">
                      {course.categoryRef?.name || 'General'}
                    </span>
                    <span>{course.level || 'Beginner'}</span>
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                </div>

                {/* Pricing & Enrolled Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <FiUsers className="text-indigo-400" />
                    <span>{course.enrolledStudentsCount || 0} Students</span>
                  </div>
                  <div className="text-emerald-400 font-extrabold text-sm">
                    {course.price === 0 ? 'Free' : `$${course.price || 49.99}`}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => navigate(`/instructor/courses/${course._id}/lessons`)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <FiFileText /> Manage Lessons & Curriculum
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/instructor/courses/edit/${course._id}`)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <FiEdit /> Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id, course.title)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition border border-rose-500/20"
                      title="Delete Course"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default InstructorCourses;
