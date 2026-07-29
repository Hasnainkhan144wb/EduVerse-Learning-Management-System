import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Expand reply box state: questionId -> replyText
  const [replyInputMap, setReplyInputMap] = useState({});
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions/instructor').catch(() => null);
      if (response && response.data.success) {
        setQuestions(response.data.data || []);
      } else {
        // Fallback mock questions for visual preview
        setQuestions([
          {
            _id: 'q1',
            studentId: {
              name: 'Michael Scott',
              email: 'michael.s@example.com',
              avatar: '',
            },
            courseId: { title: 'Full-Stack MERN Mastery' },
            lessonId: { title: 'Connecting Express to MongoDB Atlas' },
            questionText:
              'How do I securely manage DB connection strings inside Docker environment variables without leaking credentials?',
            status: 'Unanswered',
            createdAt: '2026-07-28T18:20:00.000Z',
            replies: [],
          },
          {
            _id: 'q2',
            studentId: {
              name: 'Rachel Green',
              email: 'rachel.g@example.com',
              avatar: '',
            },
            courseId: { title: 'UI/UX Design Masterclass' },
            lessonId: { title: 'Design Tokens & Color Grids' },
            questionText: 'Can we export Tailwind CSS v4 variables directly from Figma Dev Mode?',
            status: 'Answered',
            createdAt: '2026-07-25T11:15:00.000Z',
            replies: [
              {
                userId: 'inst1',
                userName: 'Dr. Sarah Jenkins',
                userRole: 'Instructor',
                replyText:
                  'Yes! You can use the official Figma Tailwind export plugin to map your color styles to @theme variables directly.',
                createdAt: '2026-07-25T14:00:00.000Z',
              },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching student questions:', err);
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
      const response = await api.post(`/questions/${questionId}/reply`, {
        replyText,
      });

      if (response.data.success) {
        toast.success('Reply submitted & notification sent to student! 📩');
        setReplyInputMap({ ...replyInputMap, [questionId]: '' });
        setExpandedReplyId(null);
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesTab = q.status === activeTab;
    const studentName = q.studentId?.name || '';
    const courseTitle = q.courseId?.title || '';
    const qText = q.questionText || '';

    const matchesSearch =
      studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      courseTitle.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      qText.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const unansweredCount = questions.filter((q) => q.status === 'Unanswered').length;
  const answeredCount = questions.filter((q) => q.status === 'Answered').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Instructor Studio • Discussion Forum
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiMessageSquare className="text-indigo-400" /> Q&A & Student Discussion Forum
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Answer student queries, clarify lesson concepts, and foster interactive learning.
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
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiClock /> Unanswered ({unansweredCount})
          </button>
          <button
            onClick={() => setActiveTab('Answered')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'Answered'
                ? 'bg-indigo-600 text-white shadow-md'
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
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Questions Card List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Loading student questions...</p>
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
                : 'No answered questions match your criteria.'}
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isReplying = expandedReplyId === q._id;

            return (
              <div
                key={q._id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                      {q.studentId?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{q.studentId?.name || 'Student'}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FiBookOpen className="text-indigo-400" />
                        <span>{q.courseId?.title || 'Course'}</span>
                        {q.lessonId?.title && <span>• {q.lessonId.title}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold border text-[10px] ${
                        q.status === 'Answered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    "{q.questionText}"
                  </p>
                </div>

                {/* Existing Replies List */}
                {q.replies && q.replies.length > 0 && (
                  <div className="space-y-3 pt-2 pl-4 border-l-2 border-indigo-600/40">
                    {q.replies.map((reply, rIdx) => (
                      <div key={rIdx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-400 flex items-center gap-1">
                            <FiCornerDownRight /> {reply.userName || 'Instructor'} ({reply.userRole})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-4">{reply.replyText}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Action / Box */}
                <div className="pt-2">
                  {!isReplying ? (
                    <button
                      onClick={() => setExpandedReplyId(q._id)}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <FiSend /> Reply to Student
                    </button>
                  ) : (
                    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <label className="block text-xs font-semibold text-slate-300">
                        Instructor Response
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Type your explanation or guidance here..."
                        value={replyInputMap[q._id] || ''}
                        onChange={(e) =>
                          setReplyInputMap({ ...replyInputMap, [q._id]: e.target.value })
                        }
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
                        >
                          <FiSend /> {submittingReply ? 'Sending Reply...' : 'Post Reply & Notify Student'}
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
