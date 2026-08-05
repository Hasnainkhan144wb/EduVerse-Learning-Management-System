import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getFileUrl } from '../utils/getFileUrl';
import { formatLearningTime } from '../utils/formatLearningTime';
import {
  FiAward,
  FiCheckCircle,
  FiStar,
  FiClock,
  FiBookOpen,
  FiHelpCircle,
  FiEdit3,
  FiTrash2,
  FiArrowRight,
  FiUser,
  FiCalendar,
  FiX,
  FiPlus,
} from 'react-icons/fi';

const CompletedCourses = () => {
  const navigate = useNavigate();
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewModal, setReviewModal] = useState({
    open: false,
    courseId: null,
    courseTitle: '',
    reviewId: null,
    rating: 5,
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCompletedCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enrolments/completed');
      if (res.data && res.data.success) {
        setCompletedCourses(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching completed courses:', err);
      toast.error('Failed to load completed courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedCourses();
  }, []);

  const handleOpenReviewModal = (courseId, courseTitle, userReview = null) => {
    setReviewModal({
      open: true,
      courseId,
      courseTitle,
      reviewId: userReview?._id || null,
      rating: userReview?.rating || 5,
      comment: userReview?.comment || '',
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!reviewModal.comment || !reviewModal.comment.trim()) {
      toast.error('Please write your review feedback!');
      return;
    }

    try {
      setSubmittingReview(true);
      if (reviewModal.reviewId) {
        // Update existing review
        const res = await api.put(`/reviews/${reviewModal.reviewId}`, {
          rating: reviewModal.rating,
          comment: reviewModal.comment.trim(),
        });
        if (res.data && res.data.success) {
          toast.success('Course review updated successfully! 🎉');
          setReviewModal({ open: false, courseId: null, courseTitle: '', reviewId: null, rating: 5, comment: '' });
          fetchCompletedCourses();
        }
      } else {
        // Create new review
        const res = await api.post('/reviews', {
          courseId: reviewModal.courseId,
          rating: reviewModal.rating,
          reviewText: reviewModal.comment.trim(),
          comment: reviewModal.comment.trim(),
        });
        if (res.data && res.data.success) {
          toast.success('Course review submitted successfully! 🎉');
          setReviewModal({ open: false, courseId: null, courseTitle: '', reviewId: null, rating: 5, comment: '' });
          fetchCompletedCourses();
        }
      }
    } catch (err) {
      console.error('Save review error:', err);
      toast.error(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete your review for "${courseTitle}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data && res.data.success) {
        toast.success('Review deleted successfully!');
        fetchCompletedCourses();
      }
    } catch (err) {
      console.error('Delete review error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Student Portal • Learning Achievements
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiAward className="text-emerald-400" /> My Completed Courses ({completedCourses.length})
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review your 100% completed courses, manage submitted ratings, and view earned certificates.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0"
        >
          <FiBookOpen /> Browse Catalog
        </Link>
      </div>

      {/* Completed Courses List */}
      {loading ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Loading completed courses...</p>
        </div>
      ) : completedCourses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mx-auto border border-indigo-500/20">
            <FiAward />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Completed Courses Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Complete your enrolled courses to unlock certificates, submit reviews, and track your learning achievements.
            </p>
          </div>
          <Link
            to="/courses"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg inline-flex items-center gap-2"
          >
            Browse Courses <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {completedCourses.map((item) => {
            const course = item.course;
            return (
              <div
                key={item._id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col lg:flex-row"
              >
                {/* Course Thumbnail */}
                <div className="lg:w-80 h-48 lg:h-auto bg-slate-950 relative overflow-hidden shrink-0">
                  <img
                    src={getFileUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> 100% Completed
                    </span>
                  </div>
                </div>

                {/* Content & Details Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    {/* Category & Level Badges */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider">
                        {course.categoryName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
                        {course.level || 'All Levels'}
                      </span>
                    </div>

                    {/* Course Title */}
                    <Link
                      to={`/courses/${course._id}`}
                      className="text-lg md:text-xl font-extrabold text-white hover:text-indigo-400 transition block line-clamp-2"
                    >
                      {course.title}
                    </Link>

                    {/* Instructor Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden">
                        {course.instructorAvatar ? (
                          <img src={course.instructorAvatar} alt={course.instructorName} className="w-full h-full object-cover" />
                        ) : (
                          <FiUser className="w-3 h-3" />
                        )}
                      </div>
                      <span>Instructor: <strong className="text-slate-200">{course.instructorName}</strong></span>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <FiCalendar className="text-emerald-400" /> Completed Date
                        </span>
                        <p className="font-extrabold text-slate-200">{formatDate(item.completionDate)}</p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <FiClock className="text-indigo-400" /> Total Time
                        </span>
                        <p className="font-extrabold text-slate-200">{formatLearningTime(item.totalSecondsSpent)}</p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <FiBookOpen className="text-blue-400" /> Lessons
                        </span>
                        <p className="font-extrabold text-slate-200">{item.completedLessonsCount} / {item.totalLessonsCount}</p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <FiHelpCircle className="text-purple-400" /> Quiz Avg Score
                        </span>
                        <p className="font-extrabold text-slate-200">{item.quizStats?.avgScore || 0}%</p>
                      </div>
                    </div>

                    {/* Certificate Status Bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
                      <div className="flex items-center gap-2">
                        <FiAward className={`w-4 h-4 ${item.certificate?.available ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className="font-semibold text-slate-300">
                          Certificate Status:
                          <strong className={item.certificate?.available ? 'text-amber-400 ml-1' : 'text-slate-500 ml-1'}>
                            {item.certificate?.available ? 'Available' : 'Not Available'}
                          </strong>
                        </span>
                      </div>
                      {item.certificate?.available && (
                        <button
                          onClick={() => navigate('/student/certificates')}
                          className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-[11px] transition flex items-center gap-1"
                        >
                          <FiAward /> View Certificate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student Review Section */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Course Rating & Review</span>
                      <span className="text-slate-400 font-semibold lowercase">
                        Overall Course Rating: ★ {course.averageRating || 5.0} ({course.totalReviews || 0})
                      </span>
                    </h4>

                    {item.userReview ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= item.userReview.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-extrabold text-white ml-1.5">
                              ({item.userReview.rating}/5)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenReviewModal(course._id, course.title, item.userReview)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                            >
                              <FiEdit3 /> Edit Review
                            </button>
                            <button
                              onClick={() => handleDeleteReview(item.userReview._id, course.title)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                              title="Delete Review"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          "{item.userReview.comment}"
                        </p>

                        <p className="text-[10px] text-slate-500">
                          Reviewed on: {formatDate(item.userReview.createdAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <p className="text-xs text-slate-300 font-medium">
                          You haven't submitted a review for this course yet.
                        </p>
                        <button
                          onClick={() => handleOpenReviewModal(course._id, course.title, null)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition flex items-center gap-1.5 shrink-0"
                        >
                          <FiStar className="fill-white" /> Write Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission & Edit Modal */}
      <AnimatePresence>
        {reviewModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <FiStar className="text-amber-400 fill-amber-400" />
                  {reviewModal.reviewId ? 'Edit Your Review' : 'Write Course Review'}
                </h3>
                <button
                  onClick={() => setReviewModal({ open: false, courseId: null, courseTitle: '', reviewId: null, rating: 5, comment: '' })}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Share your rating and feedback for <strong className="text-white">{reviewModal.courseTitle}</strong>.
              </p>

              <form onSubmit={handleSaveReview} className="space-y-4">
                {/* Rating Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Overall Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewModal((prev) => ({ ...prev, rating: star }))}
                        className="p-1 transition transform hover:scale-110 focus:outline-none"
                      >
                        <FiStar
                          className={`w-7 h-7 ${
                            star <= reviewModal.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-amber-400 ml-2">
                      {reviewModal.rating} / 5
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Review Feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your learning experience, what you liked, and tips for future learners..."
                    value={reviewModal.comment}
                    onChange={(e) => setReviewModal((prev) => ({ ...prev, comment: e.target.value }))}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModal({ open: false, courseId: null, courseTitle: '', reviewId: null, rating: 5, comment: '' })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition"
                  >
                    {submittingReview ? 'Submitting...' : reviewModal.reviewId ? 'Update Review ✓' : 'Submit Review ✓'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompletedCourses;
