import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiUser,
  FiX,
  FiSend,
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    question: '',
  });

  const fetchQuestionsAndCourses = async () => {
    try {
      setLoading(true);
      const [questionsRes, enrolmentsRes] = await Promise.all([
        api.get('/questions/student').catch(() => null),
        api.get('/enrolments/my-courses').catch(() => null),
      ]);

      if (questionsRes && questionsRes.data && questionsRes.data.success) {
        setQuestions(questionsRes.data.data || []);
      }

      if (enrolmentsRes && enrolmentsRes.data && enrolmentsRes.data.success) {
        const list = (enrolmentsRes.data.data || []).map((e) => e.courseId).filter(Boolean);
        setEnrolledCourses(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, courseId: list[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching Q&A data:', err);
      toast.error('Failed to load Q&A discussions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndCourses();
  }, []);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.courseId) {
      return toast.error('Please select a Course for your question!');
    }
    if (!formData.title || !formData.title.trim()) {
      return toast.error('Please enter a Question Title!');
    }
    if (!formData.question || !formData.question.trim()) {
      return toast.error('Please type your Question details!');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/questions', formData);
      if (res.data && res.data.success) {
        toast.success('Question submitted to instructor!');
        setFormData({ courseId: enrolledCourses[0]?._id || '', title: '', question: '' });
        setModalOpen(false);
        fetchQuestionsAndCourses();
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      toast.error(err.response?.data?.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 font-sans"
    >
      {/* Header Banner - WPLMS Premium Blue Styling */}
      <div className="bg-gradient-to-r from-[#11337B] via-[#1346AF] to-indigo-900 border border-blue-800/60 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-blue-200 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            <FiMessageSquare className="text-amber-400" /> Student Q&A Forum
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            My Course Discussions & Queries 💬
          </h1>
          <p className="text-blue-100/80 text-sm max-w-xl">
            Ask questions directly to course instructors, track response statuses, and review expert answers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-xl shadow-amber-500/20 flex items-center gap-2 transition transform hover:scale-105"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" /> Ask New Question
        </button>
      </div>

      {/* Questions List View */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading your discussions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
            <FiMessageSquare />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Questions Asked Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Have a question about your lessons? Click "Ask New Question" to send your query directly to your course instructor.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            Ask Your First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              {/* Question Header & Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg shrink-0 border border-blue-500/30">
                    <FiBookOpen />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">
                      {item.course?.title || 'Enrolled Course'}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <FiClock className="w-3 h-3 text-slate-500" />
                      Posted on {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {item.isAnswered ? (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <FiCheckCircle /> Answered by Instructor
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <FiClock /> Pending Answer
                  </span>
                )}
              </div>

              {/* Question Body */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {item.question}
                </p>
              </div>

              {/* Instructor Response Thread */}
              {item.isAnswered && item.answer && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 bg-gradient-to-r from-[#11337B]/20 via-[#1346AF]/10 to-indigo-900/20 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                      {item.instructor?.avatar ? (
                        <img src={item.instructor.avatar} alt="Instructor" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <span>{item.instructor?.name || 'Instructor'} Response:</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed pl-8">
                    {item.answer}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Ask New Question Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden font-sans"
            >
              <div className="bg-gradient-to-r from-[#11337B] to-[#1346AF] p-5 flex items-center justify-between border-b border-blue-800/60">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiMessageSquare className="text-amber-400" /> Ask Instructor a Question
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitQuestion} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select Enrolled Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    required
                  >
                    {enrolledCourses.length === 0 ? (
                      <option value="">No enrolled courses found</option>
                    ) : (
                      enrolledCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Question Title / Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. How to resolve Async MongoDB connection error in Lesson 3?"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Detailed Question Text *
                  </label>
                  <textarea
                    rows={5}
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Describe your issue or concept question in detail..."
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || enrolledCourses.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FiSend /> Post Question
                      </>
                    )}
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

export default StudentQuestions;
