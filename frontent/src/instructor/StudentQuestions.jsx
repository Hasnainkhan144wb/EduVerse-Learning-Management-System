import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiBookOpen,
  FiCornerDownRight,
  FiSearch,
} from 'react-icons/fi';

const StudentQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Unanswered'); // 'Unanswered' or 'Answered'
  const [searchKeyword, setSearchKeyword] = useState('');

  // Reply box state: questionId -> replyText
  const [replyInputMap, setReplyInputMap] = useState({});
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions/instructor').catch(() => null);
      if (response && response.data && response.data.success) {
        setQuestions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching student questions:', err);
      toast.error('Failed to load questions from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSendReply = async (questionId) => {
    const replyText = replyInputMap[questionId];
    if (!replyText || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSubmittingReply(true);
      const response = await api.patch(`/questions/${questionId}/reply`, {
        answer: replyText,
        replyText,
      });

      if (response.data && response.data.success) {
        toast.success('Reply submitted & updated on student dashboard! 📩');
        setReplyInputMap({ ...replyInputMap, [questionId]: '' });
        setExpandedReplyId(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const isAns = Boolean(q.isAnswered || q.status === 'Answered');
    const matchesTab = activeTab === 'Answered' ? isAns : !isAns;

    const studentName = q.student?.name || q.studentId?.name || '';
    const courseTitle = q.course?.title || q.courseId?.title || '';
    const qTitle = q.title || '';
    const qText = q.question || q.questionText || '';

    const matchesSearch =
      studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      courseTitle.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      qTitle.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      qText.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const unansweredCount = questions.filter((q) => !q.isAnswered && q.status !== 'Answered').length;
  const answeredCount = questions.filter((q) => q.isAnswered || q.status === 'Answered').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8 font-sans"
    >
      {/* Banner Header - WPLMS Theme Blue Header */}
      <div className="bg-gradient-to-r from-[#11337B] via-[#1346AF] to-indigo-900 border border-blue-800/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 text-blue-200 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Instructor Studio • Discussion Forum
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiMessageSquare className="text-amber-400" /> Student Q&A & Discussion Dashboard 💬
          </h1>
          <p className="text-blue-100/80 text-sm mt-1">
            Answer student queries, clarify lesson concepts, and foster interactive learning across your courses.
          </p>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('Unanswered')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'Unanswered'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiClock /> Unanswered ({unansweredCount})
          </button>
          <button
            onClick={() => setActiveTab('Answered')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'Answered'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiCheckCircle /> Answered ({answeredCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search questions or students..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Questions Card List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Loading student questions from database...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
              <FiMessageSquare />
            </div>
            <h3 className="text-base font-bold text-white">No {activeTab.toLowerCase()} questions found</h3>
            <p className="text-slate-400 text-xs">
              {activeTab === 'Unanswered'
                ? 'Great job! You have answered all pending student questions.'
                : 'No answered questions match your filter criteria.'}
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isReplying = expandedReplyId === q._id;
            const studentObj = q.student || q.studentId || {};
            const courseObj = q.course || q.courseId || {};
            const lessonObj = q.lesson || q.lessonId || {};

            return (
              <div
                key={q._id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30 overflow-hidden shrink-0">
                      {studentObj.avatar ? (
                        <img src={studentObj.avatar} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        studentObj.name?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{studentObj.name || 'Student'}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FiBookOpen className="text-blue-400" />
                        <span>{courseObj.title || 'Course'}</span>
                        {lessonObj.title && <span>• {lessonObj.title}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold border text-[10px] ${
                        q.isAnswered || q.status === 'Answered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {q.isAnswered || q.status === 'Answered' ? 'Answered ✓' : 'Pending Answer'}
                    </span>
                  </div>
                </div>

                {/* Question Subject & Details */}
                <div className="space-y-2">
                  {q.title && <h3 className="text-base font-bold text-white">{q.title}</h3>}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {q.question || q.questionText}
                    </p>
                  </div>
                </div>

                {/* Existing Reply */}
                {(q.answer || (q.replies && q.replies.length > 0)) && (
                  <div className="space-y-3 pt-2 pl-4 border-l-2 border-blue-500/40">
                    <div className="bg-gradient-to-r from-[#11337B]/30 to-indigo-900/30 p-4 rounded-2xl border border-blue-500/20 space-y-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-blue-300 flex items-center gap-1">
                          <FiCornerDownRight /> Instructor Answer:
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(q.updatedAt || q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {q.answer || (q.replies && q.replies[0]?.replyText)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reply Action Form */}
                <div className="pt-2">
                  {!isReplying ? (
                    <button
                      onClick={() => setExpandedReplyId(q._id)}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <FiSend /> {q.isAnswered ? 'Edit Answer' : 'Reply to Student'}
                    </button>
                  ) : (
                    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <label className="block text-xs font-bold text-slate-300">
                        Instructor Response / Explanation
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Type your detailed explanation or answer for the student..."
                        value={replyInputMap[q._id] !== undefined ? replyInputMap[q._id] : (q.answer || '')}
                        onChange={(e) =>
                          setReplyInputMap({ ...replyInputMap, [q._id]: e.target.value })
                        }
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedReplyId(null)}
                          className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(q._id)}
                          disabled={submittingReply}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition"
                        >
                          <FiSend /> {submittingReply ? 'Submitting Reply...' : 'Post Reply & Notify Student'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default StudentQuestions;
