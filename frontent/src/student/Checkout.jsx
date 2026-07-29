import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
} from 'react-icons/fi';

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserState } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/courses/${courseId}`);
        if (response.data.success) {
          setCourse(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching course for checkout:', err);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleConfirmEnrolment = async () => {
    try {
      setProcessing(true);
      const response = await api.post(`/enrolments/${courseId}`);

      if (response.data.success) {
        toast.success('Successfully enrolled in course! 🎉');

        // Update user state locally
        if (user) {
          const updatedEnrolled = [...(user.enrolledCourses || []), courseId];
          updateUserState({ ...user, enrolledCourses: updatedEnrolled });
        }

        navigate(`/course-player/${courseId}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrolment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Checkout Details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Invalid Course</h2>
        <Link to="/courses" className="px-6 py-2 bg-indigo-600 rounded-xl text-xs font-bold mt-4">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Checkout & Course Enrolment</h1>
              <p className="text-xs text-slate-400">Complete your enrolment to access instant video lessons</p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Course Summary Card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                course.thumbnail ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80'
              }
              alt={course.title}
              className="w-16 h-16 rounded-xl object-cover border border-slate-800"
            />
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                {course.categoryRef?.name || 'General Course'}
              </span>
              <h3 className="text-base font-bold text-white leading-tight">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Instructor: {course.instructorRef?.name || 'EduVerse'}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Total Price</p>
            <p className="text-2xl font-extrabold text-white">
              {course.price > 0 ? `$${course.price}` : 'FREE'}
            </p>
          </div>
        </div>

        {/* Guarantee Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2">
            <FiShield className="text-emerald-400 text-lg shrink-0" />
            <span>Secure 256-bit Encryption</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2">
            <FiCheckCircle className="text-indigo-400 text-lg shrink-0" />
            <span>Instant Course Access</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2">
            <FiBookOpen className="text-purple-400 text-lg shrink-0" />
            <span>PDF Certificate Included</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirmEnrolment}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform hover:scale-[1.01]"
        >
          {processing ? 'Processing Enrolment...' : 'Confirm Enrolment & Start Learning'} <FiArrowRight />
        </button>
      </motion.div>
    </div>
  );
};

export default Checkout;
