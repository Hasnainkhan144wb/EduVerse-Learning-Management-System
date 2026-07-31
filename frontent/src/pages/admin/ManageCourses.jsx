import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  FiBookOpen,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiEye,
  FiX,
} from 'react-icons/fi';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [previewCourse, setPreviewCourse] = useState(null);

  const fetchAdminCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/courses').catch(() => null);
      if (response && response.data && response.data.success) {
        setCourses(response.data.data);
      } else {
        const fallbackRes = await api.get('/admin/courses');
        if (fallbackRes.data && fallbackRes.data.success) {
          setCourses(fallbackRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error loading admin courses:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminCourses();
  }, [fetchAdminCourses]);

  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      const targetStatus = currentStatus === 'Published' ? 'Unpublished' : 'Published';

      const response = await api.patch(`/admin/courses/${courseId}/status`, {
        status: targetStatus,
      });

      if (response.data && response.data.success) {
        toast.success(`Course successfully ${targetStatus.toLowerCase()}! 🎓`);
        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c._id === courseId
              ? { ...c, status: targetStatus, isPublished: targetStatus === 'Published' }
              : c
          )
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course status');
    }
  };

  const handleRejectCourse = async (courseId) => {
    try {
      const response = await api.patch(`/admin/courses/${courseId}/status`, {
        status: 'Rejected',
      });

      if (response.data && response.data.success) {
        toast.success('Course status updated to Rejected.');
        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c._id === courseId ? { ...c, status: 'Rejected', isPublished: false } : c
          )
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to permanently delete this course?')) {
      return;
    }
    try {
      const response = await api.delete(`/courses/${courseId}`);
      if (response.data && response.data.success) {
        toast.success('Course deleted successfully');
        fetchAdminCourses();
      }
    } catch (err) {
      toast.error('Failed to delete course');
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructorRef?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 font-sans"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Curriculum Moderation
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiBookOpen className="text-blue-500" /> Platform Course Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review instructor submissions, publish courses to public catalog, or unpublish/reject content.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by course title or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FiFilter className="text-slate-500" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Unpublished">Unpublished / Draft</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Loading platform courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FiBookOpen className="text-slate-600 text-3xl mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No courses match your query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Category & Price</th>
                  <th className="py-3.5 px-4">Status Badge</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCourses.map((course) => {
                  const isPublished = course.status === 'Published';
                  const isRejected = course.status === 'Rejected';

                  return (
                    <tr key={course._id} className="hover:bg-slate-800/40 transition">
                      {/* Title & Thumbnail */}
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150'}
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-800 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-xs text-white line-clamp-1">
                            {course.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {course.sections?.length || 0} Sections • {course.level || 'All Levels'}
                          </p>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-semibold text-slate-200">
                          {course.instructorRef?.name || course.instructorName || 'Instructor'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {course.instructorRef?.email || ''}
                        </p>
                      </td>

                      {/* Category & Price */}
                      <td className="py-4 px-4 text-xs">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full font-medium text-slate-300">
                          {course.categoryRef?.name || course.category || 'General'}
                        </span>
                        <p className="text-emerald-400 font-bold mt-1">
                          {course.isFree ? 'Free' : `$${course.price || 49.99}`}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isRejected
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {course.status || 'Draft'}
                        </span>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => setPreviewCourse(course)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                          title="Preview Curriculum"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {/* Toggle Publish / Unpublish Button */}
                        {isPublished ? (
                          <button
                            onClick={() => handleTogglePublish(course._id, course.status)}
                            className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold rounded-xl border border-red-500/30 transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <FiXCircle /> Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(course._id, course.status)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition inline-flex items-center gap-1"
                          >
                            <FiCheckCircle /> Publish
                          </button>
                        )}

                        {!isPublished && !isRejected && (
                          <button
                            onClick={() => handleRejectCourse(course._id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1"
                          >
                            <FiXCircle /> Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition"
                          title="Delete Course"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CURRICULUM PREVIEW MODAL */}
      <AnimatePresence>
        {previewCourse && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Course Curriculum Inspection
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {previewCourse.title}
                  </h2>
                </div>
                <button
                  onClick={() => setPreviewCourse(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
                  <p className="text-slate-300 leading-relaxed">{previewCourse.description}</p>
                  <div className="flex items-center gap-4 text-slate-400 pt-2 border-t border-slate-800">
                    <span>Instructor: <strong className="text-white">{previewCourse.instructorRef?.name || 'N/A'}</strong></span>
                    <span>Level: <strong className="text-white">{previewCourse.level || 'All'}</strong></span>
                    <span>Price: <strong className="text-emerald-400">${previewCourse.price || 49.99}</strong></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Curriculum Sections & Lessons
                  </h4>
                  {(previewCourse.sections || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No sections created yet.</p>
                  ) : (
                    previewCourse.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                      >
                        <p className="font-bold text-slate-200">{sec.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {(sec.lessons || []).length} lessons
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  onClick={() => setPreviewCourse(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  Close Inspection
                </button>
                {previewCourse.status !== 'Published' ? (
                  <button
                    onClick={() => {
                      handleTogglePublish(previewCourse._id, previewCourse.status);
                      setPreviewCourse(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
                  >
                    <FiCheckCircle /> Publish Course
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleTogglePublish(previewCourse._id, previewCourse.status);
                      setPreviewCourse(null);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition"
                  >
                    <FiXCircle /> Unpublish Course
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageCourses;
