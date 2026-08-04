import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getFileUrl } from '../utils/getFileUrl';
import {
  FiFileText,
  FiPlus,
  FiCheckCircle,
  FiArrowLeft,
  FiDownload,
  FiUser,
  FiCalendar,
  FiAward,
  FiMessageSquare,
  FiSend,
  FiSearch,
} from 'react-icons/fi';

const ManageAssignments = () => {
  const { lessonId: paramLessonId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'create'

  // Courses & Lessons selection
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(paramLessonId || '');

  // Assignment Creation Form State
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Submissions State
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading form state map: submissionId -> { marks, feedback }
  const [gradingState, setGradingState] = useState({});

  // Load instructor courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/instructor/courses');
        if (response.data.success) {
          const list = response.data.courses || response.data.data || [];
          setCourses(list);
          if (list.length > 0 && !selectedCourseId) {
            setSelectedCourseId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching courses');
      }
    };
    fetchCourses();
  }, []);

  // Fetch lessons when course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchCourseDetails = async () => {
      try {
        const response = await api.get(`/courses/${selectedCourseId}`);
        if (response.data.success) {
          const assignmentLessons = [];
          (response.data.data.sections || []).forEach((sec) => {
            (sec.lessons || []).forEach((les) => {
              if (les.type === 'assignment') {
                assignmentLessons.push(les);
              }
            });
          });
          setLessons(assignmentLessons);
          if (assignmentLessons.length > 0 && !lessonId) {
            setLessonId(assignmentLessons[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading course lessons');
      }
    };
    fetchCourseDetails();
  }, [selectedCourseId]);

  // Fetch assignment & student submissions when lesson selected
  const fetchAssignmentData = useCallback(async () => {
    if (!lessonId) return;

    // Type check safety: Do NOT call assignment API if target lesson is a Quiz!
    const targetLes = lessons.find((l) => String(l._id) === String(lessonId));
    if (targetLes && targetLes.type !== 'assignment') {
      setAssignment(null);
      setSubmissions([]);
      return;
    }

    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/assignments/lesson/${lessonId}`).catch(() => null);
      if (res && res.data.success) {
        const assignObj = res.data.data.assignment;
        setAssignment(assignObj);

        // Fetch submissions for this assignment
        const subRes = await api.get(`/assignments/${assignObj._id}/submissions`);
        if (subRes.data.success) {
          setSubmissions(subRes.data.data || []);

          // Initialize grading state
          const initialGrading = {};
          (subRes.data.data || []).forEach((sub) => {
            initialGrading[sub._id] = {
              marks: sub.marks !== undefined ? sub.marks : assignObj.totalMarks,
              feedback: sub.feedback || '',
            };
          });
          setGradingState(initialGrading);
        }
      } else {
        setAssignment(null);
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  // Assignment Creation Submit
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!lessonId) {
      toast.error('Please select a target lesson');
      return;
    }
    if (!title.trim() || !instructions.trim()) {
      toast.error('Assignment title and detailed instructions are required');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        lessonId,
        title,
        instructions,
        totalMarks: Number(totalMarks),
        dueDate: dueDate || null,
      };

      const response = await api.post('/assignments', payload);
      if (response.data.success) {
        toast.success('Assignment created & attached to lesson! 📝');
        setActiveTab('submissions');
        fetchAssignmentData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  // Grade Submission Action
  const handleGradeSubmission = async (submissionId) => {
    const gradeData = gradingState[submissionId];
    if (!gradeData) return;

    try {
      const response = await api.put(`/assignments/submissions/${submissionId}/grade`, {
        marks: Number(gradeData.marks),
        feedback: gradeData.feedback,
        status: 'Graded',
      });

      if (response.data.success) {
        toast.success('Student submission graded & feedback submitted! ✅');
        fetchAssignmentData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade submission');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Instructor Studio • Assignments
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Assignment & Grading Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create project tasks, review student file submissions, award marks, and provide feedback.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      {/* Course & Lesson Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Lesson</label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Lesson Module</option>
              {lessons.map((les) => (
                <option key={les._id} value={les._id}>
                  {les.title} ({les.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            + Create Assignment
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMISSIONS REVIEW & GRADING PANEL */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {!assignment ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                <FiFileText />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Assignment Created for this Lesson</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Click "+ Create Assignment" to set up a project task for students.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
              >
                Create Assignment
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assignment Specs Summary Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Current Task Specification
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{assignment.title}</h2>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">
                    {assignment.instructions}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-slate-400 text-[10px]">Total Marks</p>
                    <p className="font-extrabold text-indigo-400 text-sm">{assignment.totalMarks}</p>
                  </div>
                  {assignment.dueDate && (
                    <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <p className="text-slate-400 text-[10px]">Due Date</p>
                      <p className="font-extrabold text-white text-xs">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submissions List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiUser className="text-indigo-400" /> Student Submissions ({submissions.length})
                </h3>

                {loadingSubmissions ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-slate-400 text-xs">Fetching student submissions...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800">
                    No student submissions received for this assignment yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub) => {
                      const currentGrade = gradingState[sub._id] || { marks: 0, feedback: '' };
                      const submissionFile = sub.documentUrl || sub.solutionUrl || sub.fileUrl;

                      return (
                        <div
                          key={sub._id}
                          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4"
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                                {sub.studentId?.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {sub.studentId?.name || 'Student'}
                                </h4>
                                <p className="text-xs text-slate-400">{sub.studentId?.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">
                                Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold border text-[11px] ${
                                  sub.status === 'Graded'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                          </div>

                          {/* Student Submission File & Notes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-1">
                                Submitted File / Link
                              </p>
                              {submissionFile ? (
                                <a
                                  href={getFileUrl(submissionFile)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                                >
                                  <FiDownload /> Download Submitted Document ({sub.notes || sub.studentNotes || 'Attached File'})
                                </a>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No document file attached for this submission.</p>
                              )}
                            </div>

                            {sub.notes && (
                              <div>
                                <p className="text-xs font-semibold text-slate-400 mb-1">
                                  Student Remarks / Notes
                                </p>
                                <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                  {sub.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Instructor Grading Inputs */}
                          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <FiAward className="text-indigo-400" /> Evaluation & Grading
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  Marks Awarded (Out of {assignment.totalMarks})
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={assignment.totalMarks}
                                  value={currentGrade.marks !== null && currentGrade.marks !== undefined ? currentGrade.marks : ''}
                                  onChange={(e) =>
                                    setGradingState({
                                      ...gradingState,
                                      [sub._id]: {
                                        ...currentGrade,
                                        marks: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  Instructor Feedback / Comments
                                </label>
                                <input
                                  type="text"
                                  placeholder="Great work! Well formatted code and clean documentation..."
                                  value={currentGrade.feedback !== null && currentGrade.feedback !== undefined ? currentGrade.feedback : ''}
                                  onChange={(e) =>
                                    setGradingState({
                                      ...gradingState,
                                      [sub._id]: {
                                        ...currentGrade,
                                        feedback: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => handleGradeSubmission(sub._id)}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition"
                            >
                              <FiSend /> Grade & Submit Feedback
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENT CREATION FORM */}
      {activeTab === 'create' && (
        <form
          onSubmit={handleCreateAssignment}
          className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6"
        >
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiFileText className="text-indigo-400" /> New Assignment Specification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assignment Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Build a REST API with Authentication & Role-Based Access Control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Detailed Instructions & Project Requirements *
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe project goals, expected file deliverables (PDF/ZIP), and submission guidelines..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Total Marks / Weightage
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {creating ? 'Creating Assignment...' : 'Save & Publish Assignment Task'}
          </button>
        </form>
      )}
    </motion.div>
  );
};

export default ManageAssignments;
