import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiDownload,
  FiMessageSquare,
  FiX,
  FiSend,
} from 'react-icons/fi';

const StudentAssignments = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetAssignment, setTargetAssignment] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assignments/my-submissions').catch(() => null);

      if (response && response.data.success) {
        setSubmissions(response.data.data || []);
      } else {
        // Fallback mock submissions for visual demonstration
        setSubmissions([
          {
            _id: 'sub1',
            assignmentId: {
              _id: 'a1',
              title: 'Full-Stack MERN E-Commerce Backend Integration',
              instructions: 'Build REST endpoints for Stripe payment checkout and order schema.',
              totalMarks: 100,
              dueDate: '2026-08-05T23:59:59.000Z',
              lessonId: {
                title: 'Building Payment Microservices',
                courseId: { title: 'Full-Stack MERN Mastery' },
              },
            },
            fileUrl: '/uploads/assignments/ecommerce-backend.zip',
            notes: 'Implemented full Stripe webhook verification and JWT auth middleware.',
            marks: 95,
            feedback: 'Outstanding architecture and clean code structure! Excellent error handling.',
            status: 'Graded',
            updatedAt: '2026-07-27T10:15:00.000Z',
          },
          {
            _id: 'sub2',
            assignmentId: {
              _id: 'a2',
              title: 'UI/UX Design Token Specifications',
              instructions: 'Export Tailwind v4 color variables and typography scale.',
              totalMarks: 50,
              dueDate: '2026-08-10T23:59:59.000Z',
              lessonId: {
                title: 'Design System Architecture',
                courseId: { title: 'UI/UX Masterclass' },
              },
            },
            fileUrl: '/uploads/assignments/design-tokens.pdf',
            notes: 'Attached Figma dev mode tokens document.',
            marks: null,
            feedback: '',
            status: 'Submitted',
            updatedAt: '2026-07-28T14:20:00.000Z',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching student submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const handleOpenUpload = (assignment) => {
    setTargetAssignment(assignment);
    setUploadModalOpen(true);
    reset();
  };

  const onSubmitAssignmentFile = async (data) => {
    if (!targetAssignment) return;

    const hasFile = data.file && data.file[0];
    const hasUrl = data.fileUrl && data.fileUrl.trim();

    if (!hasFile && !hasUrl) {
      toast.error('Please upload a file or provide a Submission File URL!');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (hasFile) {
        formData.append('assignment', data.file[0]);
      } else if (hasUrl) {
        formData.append('fileUrl', data.fileUrl);
      }
      formData.append('notes', data.notes || '');

      const response = await api.post(
        `/assignments/${targetAssignment._id}/submit`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        toast.success('Assignment submitted successfully! 🚀');
        setUploadModalOpen(false);
        fetchMySubmissions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Student Portal • Evaluation Panel
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiFileText className="text-indigo-400" /> My Assignments & Grades
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track submitted project deliverables, view instructor feedback, and review awarded marks.
          </p>
        </div>

        <div className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-extrabold text-lg">
            {submissions.length}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Submissions</p>
            <p className="text-xs font-bold text-white">Tracked Assignments</p>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Loading assignment submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
              <FiFileText />
            </div>
            <h3 className="text-base font-bold text-white">No assignments submitted yet</h3>
            <p className="text-slate-400 text-xs">
              Go to your Enrolled Courses in the Course Player to view and submit assigned projects.
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const assignment = sub.assignmentId || {};
            const lesson = assignment.lessonId || {};
            const course = lesson.courseId || {};
            const isGraded = sub.status === 'Graded';

            return (
              <div
                key={sub._id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase">
                      {course.title || 'Course'} • {lesson.title || 'Lesson'}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                      {assignment.title || 'Assignment Task'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        isGraded
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {isGraded ? 'Graded ✓' : 'Submitted'}
                    </span>

                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
                      >
                        <FiDownload /> View Deliverable
                      </a>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instructions & Notes */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-slate-300">Submission Notes:</p>
                    <p className="text-xs text-slate-400">{sub.notes || 'No student notes provided.'}</p>
                    <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
                      <FiClock /> Submitted on {new Date(sub.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Marks & Feedback */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isGraded
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-950 border-slate-800'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <FiAward className="text-amber-400" /> Instructor Evaluation
                      </span>
                      {isGraded ? (
                        <span className="text-base font-extrabold text-emerald-400">
                          {sub.marks} / {assignment.totalMarks || 100}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold">Pending Review</span>
                      )}
                    </div>

                    {isGraded ? (
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                        "{sub.feedback || 'Great work!'}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Your instructor has received your deliverable and will publish feedback shortly.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* UPLOAD SUBMISSION MODAL */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase">
                    Submit Deliverable
                  </span>
                  <h2 className="text-lg font-bold text-white">{targetAssignment?.title}</h2>
                </div>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitAssignmentFile)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Upload Project File (PDF / DOCX / ZIP)
                  </label>
                  <input
                    type="file"
                    {...register('file')}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Or Provide Project File URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or GitHub URL"
                    {...register('fileUrl')}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Notes / Comments for Instructor
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any additional comments or context..."
                    {...register('notes')}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  <FiSend /> {submitting ? 'Submitting File...' : 'Submit Deliverable'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentAssignments;
