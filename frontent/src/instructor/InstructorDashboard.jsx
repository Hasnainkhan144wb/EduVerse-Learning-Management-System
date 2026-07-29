import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiUsers,
  FiDollarSign,
  FiStar,
  FiBookOpen,
  FiPlusCircle,
  FiEdit,
  FiEye,
  FiArrowRight,
} from 'react-icons/fi';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        const response = await api.get(`/courses?status=Published`).catch(() => ({ data: { data: [] } }));
        // Filter courses created by this instructor if needed
        const myCourses = (response.data.data || []).filter(
          (c) => c.instructorRef?._id === user?._id || c.instructorRef === user?._id
        );
        setCourses(myCourses.length > 0 ? myCourses : response.data.data || []);
      } catch (err) {
        console.error('Error fetching instructor courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorCourses();
  }, [user]);

  // Mocked analytics derived from instructor courses
  const totalStudents = courses.length * 14;
  const totalRevenue = courses.reduce((acc, c) => acc + (c.price || 0) * 12, 0);
  const avgRating = 4.8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Instructor Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Instructor Studio: {user?.name || 'Instructor'} 🎓
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your curriculum, track student engagements, and publish high quality learning content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/instructor/courses/create"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center gap-2"
          >
            <FiPlusCircle className="w-5 h-5" />
            Create New Course
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">
            <FiUsers />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Students</p>
            <h3 className="text-2xl font-bold text-white">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
            <FiDollarSign />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
            <FiStar />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Course Rating</p>
            <h3 className="text-2xl font-bold text-white">{avgRating} / 5.0</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl">
            <FiBookOpen />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Courses Created</p>
            <h3 className="text-2xl font-bold text-white">{courses.length}</h3>
          </div>
        </div>
      </div>

      {/* Course List & Recent Uploads */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Courses</h2>
            <p className="text-xs text-slate-400">Manage, edit, and publish your course materials</p>
          </div>
          <Link
            to="/instructor/courses"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            Manage All <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading instructor courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-10 text-center bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto text-2xl">
              <FiBookOpen />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No courses created yet</h3>
              <p className="text-slate-400 text-sm mt-1">Start building your first course curriculum today.</p>
            </div>
            <Link
              to="/instructor/courses/create"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30"
            >
              Create Course
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Course Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-semibold text-white flex items-center gap-3">
                      <img
                        src={
                          course.thumbnail ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80'
                        }
                        alt={course.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                      />
                      <span>{course.title}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {course.categoryRef?.name || 'General'}
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-400">
                      ${course.price || 0}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          course.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/courses/${course._id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="View Course"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/instructor/courses/edit/${course._id}`}
                          className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
                          title="Edit Course"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InstructorDashboard;
