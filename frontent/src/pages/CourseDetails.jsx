import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getFileUrl } from '../utils/getFileUrl';
import {
  FiBookOpen,
  FiVideo,
  FiFileText,
  FiCheckCircle,
  FiStar,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiGlobe,
  FiChevronDown,
  FiChevronUp,
  FiBookmark,
  FiEdit3,
  FiTrash2,
  FiMessageSquare,
  FiAlertCircle,
} from 'react-icons/fi';

const CourseDetails = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Review System State
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [userReview, setUserReview] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Review Form Inputs
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1. Fetch Course & Enrolment Data
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        const courseData = response.data.data;
        setCourse(courseData);

        if (user && courseId) {
          const watchlist = user.watchlist || user.wishlist || [];
          const inWatchlist = watchlist.some(
            (item) => String(item._id || item) === String(courseId)
          );
          setIsBookmarked(inWatchlist);
        }

        // Expand sections by default
        const initExp = {};
        (courseData.sections || []).forEach((sec) => {
          initExp[sec._id] = true;
        });
        setExpandedSections(initExp);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  // 2. Fetch Reviews & Enrollment Status
  const fetchReviewsData = useCallback(async () => {
    try {
      const [reviewsRes, statusRes] = await Promise.all([
        api.get(`/reviews/course/${courseId}`).catch(() => null),
        api.get(`/courses/${courseId}/review-status`).catch(() => null),
      ]);

      if (reviewsRes && reviewsRes.data && reviewsRes.data.success) {
        setReviews(reviewsRes.data.reviews || reviewsRes.data.data || []);
        setAverageRating(reviewsRes.data.averageRating || 0);
        setTotalReviews(reviewsRes.data.totalReviews || 0);
        setRatingBreakdown(reviewsRes.data.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }

      if (statusRes && statusRes.data && statusRes.data.success) {
        setIsEnrolled(!!statusRes.data.isEnrolled);
        if (statusRes.data.userReview) {
          setUserReview(statusRes.data.userReview);
          setRatingInput(statusRes.data.userReview.rating || 5);
          setCommentInput(statusRes.data.userReview.comment || statusRes.data.userReview.review || '');
        } else if (reviewsRes?.data?.userReview) {
          setUserReview(reviewsRes.data.userReview);
          setRatingInput(reviewsRes.data.userReview.rating || 5);
          setCommentInput(reviewsRes.data.userReview.comment || reviewsRes.data.userReview.review || '');
        } else {
          setUserReview(null);
        }
      } else if (reviewsRes && reviewsRes.data) {
        setIsEnrolled(!!reviewsRes.data.isEnrolled);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
    fetchReviewsData();
  }, [fetchCourseData, fetchReviewsData]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Submit / Create Review Handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!ratingInput) {
      toast.error('Please select a star rating (1-5).');
      return;
    }
    if (!commentInput.trim()) {
      toast.error('Please write a review comment.');
      return;
    }

    try {
      setSubmittingReview(true);

      if (userReview && isEditingReview) {
        // Update Review
        const res = await api.put(`/reviews/${userReview._id}`, {
          rating: Number(ratingInput),
          comment: commentInput.trim(),
        });
        if (res.data && res.data.success) {
          toast.success('Review updated successfully!');
          setIsEditingReview(false);
          fetchReviewsData();
          fetchCourseData();
        }
      } else {
        // Create Review
        const res = await api.post('/reviews', {
          courseId,
          rating: Number(ratingInput),
          comment: commentInput.trim(),
        });
        if (res.data && res.data.success) {
          toast.success('Review submitted successfully!');
          fetchReviewsData();
          fetchCourseData();
        }
      }
    } catch (err) {
      console.error('Review submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete Review Handler
  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data && res.data.success) {
        toast.success('Review deleted successfully!');
        if (userReview && userReview._id === reviewId) {
          setUserReview(null);
          setIsEditingReview(false);
          setRatingInput(5);
          setCommentInput('');
        }
        fetchReviewsData();
        fetchCourseData();
      }
    } catch (err) {
      console.error('Review delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Course Details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Course Not Found</h2>
        <p className="text-slate-400 mb-6 text-sm">The course you requested does not exist or has been removed.</p>
        <Link to="/courses" className="px-6 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const totalLessonsCount = (course.sections || []).reduce(
    (acc, sec) => acc + (sec.lessons ? sec.lessons.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <span>EduVerse</span>
          </Link>

          <Link to="/courses" className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1">
            <FiArrowLeft /> Back to Catalog
          </Link>
        </div>
      </nav>

      {/* HERO HEADER */}
      <div className="bg-slate-900/80 border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-bold uppercase tracking-wider">
                {course.categoryRef?.name || 'General Category'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <FiGlobe /> {course.language || 'English'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <FiAward /> {course.level || 'Beginner'}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-300 text-base leading-relaxed">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(averageRating || course.averageRating || 4.8)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-extrabold text-sm ml-1">
                  {averageRating || course.averageRating || 4.8}
                </span>
                <span className="text-slate-400 font-medium">
                  ({totalReviews || course.totalReviews || reviews.length || 0} reviews)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <FiUser className="text-indigo-400" />
                <span>Instructor: {course.instructorRef?.name || 'EduVerse Faculty'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT BODY & STICKY CTA CARD */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Learning Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiCheckCircle className="text-emerald-400" /> What You Will Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                {course.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <FiCheckCircle className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                <p className="text-slate-400 text-xs mt-1">
                  {(course.sections || []).length} Sections • {totalLessonsCount} Lessons
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(course.sections || []).map((section, sIdx) => (
                <div
                  key={section._id || sIdx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section._id)}
                    className="w-full p-4 bg-slate-900/60 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <span>
                      Section {sIdx + 1}: {section.title}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{(section.lessons || []).length} Lessons</span>
                      {expandedSections[section._id] ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </button>

                  {expandedSections[section._id] && (
                    <div className="divide-y divide-slate-800/60 p-2">
                      {(section.lessons || []).map((lesson) => (
                        <div
                          key={lesson._id}
                          className="p-3.5 flex items-center justify-between text-xs text-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.type === 'pdf' ? (
                              <FiFileText className="text-indigo-400" />
                            ) : (
                              <FiVideo className="text-indigo-400" />
                            )}
                            <span>{lesson.title}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            {lesson.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COURSE RATING & REVIEW SYSTEM SECTION */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-8 shadow-2xl">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Student Feedback & Ratings
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Course Reviews</h2>
            </div>

            {/* OVERALL RATING & BREAKDOWN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
              {/* Average Score Box */}
              <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                <span className="text-5xl font-black text-white">{averageRating || '0.0'}</span>
                <div className="flex items-center my-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  Course Rating • {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>

              {/* Star Rating Distribution Bars */}
              <div className="md:col-span-2 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingBreakdown[stars] || 0;
                  const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-bold text-slate-300 flex items-center gap-1">
                        {stars} <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-slate-400 font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REVIEW SUBMISSION FORM / USER REVIEW CARD */}
            <div className="border-t border-slate-800 pt-6">
              {!user ? (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                  <FiAlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-slate-300 text-xs font-semibold">
                    Please log in as an enrolled student to rate and review this course.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    Log In to Review
                  </Link>
                </div>
              ) : user.role === 'Instructor' ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle className="text-indigo-400 shrink-0 w-5 h-5" />
                  <span>
                    Instructors can view student ratings and statistics for their courses but cannot submit or modify student reviews.
                  </span>
                </div>
              ) : !isEnrolled && user.role !== 'Admin' ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle className="shrink-0 w-5 h-5" />
                  <span>Only enrolled students can rate and review this course.</span>
                </div>
              ) : userReview && !isEditingReview ? (
                <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      Your Submitted Review
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingReview(true)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <FiEdit3 /> Edit
                      </button>
                      <button
                        onClick={() => handleReviewDelete(userReview._id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar
                          key={s}
                          className={`w-4 h-4 ${
                            s <= userReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white">{userReview.rating}.0 / 5.0</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    {userReview.comment || userReview.review}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Reviewed on {new Date(userReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                /* REVIEW FORM (Create or Edit) */
                <form onSubmit={handleReviewSubmit} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      {isEditingReview ? 'Edit Your Review' : 'Rate & Write a Review'}
                    </h3>
                    {isEditingReview && (
                      <button
                        type="button"
                        onClick={() => setIsEditingReview(false)}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  {/* Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Select Rating (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRatingInput(star)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <FiStar
                            className={`w-7 h-7 ${
                              star <= (hoverRating || ratingInput)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-amber-400">
                        {hoverRating || ratingInput} Star{(hoverRating || ratingInput) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Review Feedback:
                    </label>
                    <textarea
                      rows={3}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Share your experience with this course, instructor teaching style, and material quality..."
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-3.5 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingReview
                        ? 'Submitting...'
                        : isEditingReview
                        ? 'Update Review ✓'
                        : 'Submit Review ✓'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* REVIEWS LIST */}
            <div className="space-y-4 border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FiMessageSquare className="text-indigo-400" /> Student Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-950 rounded-2xl border border-slate-800">
                  No reviews submitted yet for this course. Be the first enrolled student to review!
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => {
                    const studentObj = rev.studentId || rev.student || {};
                    const isOwner = user && String(studentObj._id || rev.studentId) === String(user._id);
                    const isAdmin = user && user.role === 'Admin';

                    return (
                      <div
                        key={rev._id}
                        className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 transition hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                              {studentObj.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{studentObj.name || 'Anonymous Student'}</h4>
                              <p className="text-[10px] text-slate-400">
                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Review'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex text-amber-400 text-xs">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>

                            {(isOwner || isAdmin) && (
                              <button
                                onClick={() => handleReviewDelete(rev._id)}
                                className="text-red-400 hover:text-red-300 text-xs p-1 rounded hover:bg-red-500/10 transition"
                                title={isAdmin ? 'Delete Review (Admin Moderation)' : 'Delete Your Review'}
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {rev.comment || rev.review}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Instructor Bio */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white">About the Instructor</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                {course.instructorRef?.name?.charAt(0) || 'I'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {course.instructorRef?.name || 'Senior Instructor'}
                </h3>
                <p className="text-xs text-slate-400">EduVerse Certified Author & Subject Specialist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Sticky CTA Card */}
        <div>
          <div className="sticky top-24 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-800">
              <img
                src={getFileUrl(course.thumbnail || course.coverImage)}
                alt={course.title || 'Course Thumbnail'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Course Fee</span>
                <span className="text-3xl font-extrabold text-white">
                  {course.price > 0 ? `$${course.price}` : 'Free'}
                </span>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <FiCheckCircle /> Includes Lifetime Access & Verified PDF Certificate
              </p>
            </div>

            {user?.role === 'Instructor' || user?.role === 'Admin' ? (
              <button
                onClick={() => navigate(user?.role === 'Instructor' ? '/instructor/courses' : '/admin-dashboard')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                Instructor Studio • Manage Courses <FiArrowRight />
              </button>
            ) : isEnrolled ? (
              <Link
                to={`/course-player/${course._id}`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                Go to Course Player <FiArrowRight />
              </Link>
            ) : (
              <div className="space-y-2.5">
                <Link
                  to={isAuthenticated ? `/checkout/${course._id}` : '/login'}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  Enrol Now <FiArrowRight />
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user) {
                      toast.error('Please login to bookmark courses!');
                      return;
                    }
                    try {
                      const res = await api.post('/users/watchlist/toggle', { courseId });
                      if (res.data && res.data.success) {
                        setIsBookmarked(res.data.isBookmarked);
                        toast.success(res.data.message);
                      }
                    } catch (err) {
                      toast.error('Failed to update watchlist');
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isBookmarked
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <FiBookmark className={isBookmarked ? 'fill-indigo-400 text-indigo-400' : ''} />
                  {isBookmarked ? 'Saved to Watchlist' : 'Add to Watchlist'}
                </button>
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Access</span>
                <span className="font-semibold text-slate-200">Full Lifetime Access</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Certificate</span>
                <span className="font-semibold text-slate-200">Yes (PDF Download)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Modules</span>
                <span className="font-semibold text-slate-200">{totalLessonsCount} Lessons</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
