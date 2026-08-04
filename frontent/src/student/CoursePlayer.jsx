import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getEmbedUrl } from '../utils/videoEmbed';
import { getFileUrl } from '../utils/getFileUrl';
import TakeQuiz from './TakeQuiz';
import {
  FiPlayCircle,
  FiFileText,
  FiHelpCircle,
  FiEdit3,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiArrowLeft,
  FiAward,
  FiX,
  FiCode,
  FiSend,
  FiCheck,
  FiSliders,
  FiMessageSquare,
} from 'react-icons/fi';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const videoRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Playback Speed State
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tab & Accordion state
  const [activeTab, setActiveTab] = useState('overview'); // overview, pdf, notes, source, qna
  const [expandedSections, setExpandedSections] = useState({});

  // Q&A Discussion Tab State
  const [qnaQuestions, setQnaQuestions] = useState([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [newQTitle, setNewQTitle] = useState('');
  const [newQText, setNewQText] = useState('');
  const [postingQ, setPostingQ] = useState(false);

  // Quiz Modal State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Assignment Submission Modal State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  // Real-Time Active Learning Time Tracking System
  const secondsBufferRef = useRef(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  useEffect(() => {
    if (!courseId || !activeLesson) return;

    const flushTime = async () => {
      const secondsToFlush = secondsBufferRef.current;
      if (secondsToFlush > 0) {
        secondsBufferRef.current = 0;
        try {
          await api.post('/enrolments/track-time', {
            courseId,
            lessonId: activeLesson._id,
            lessonType: activeLesson.type || 'video',
            secondsSpent: secondsToFlush,
          });
        } catch (err) {
          secondsBufferRef.current += secondsToFlush;
        }
      }
    };

    const intervalId = setInterval(() => {
      const isVisible = document.visibilityState === 'visible';
      const isFocused = document.hasFocus ? document.hasFocus() : true;
      const type = (activeLesson.type || 'video').toLowerCase();

      // Active condition: Tab visible & window focused
      if (isVisible && isFocused) {
        if (type === 'video') {
          if (isVideoPlaying) {
            secondsBufferRef.current += 1;
          }
        } else {
          // PDF, assignment, reading: active reading time
          secondsBufferRef.current += 1;
        }
      }

      // Flush accumulated active time to MongoDB every 15 seconds
      if (secondsBufferRef.current >= 15) {
        flushTime();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        flushTime();
      }
    };

    const handleBlur = () => {
      flushTime();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      flushTime();
    };
  }, [courseId, activeLesson, isVideoPlaying]);

  // Load course details & enrolment progress
  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`).catch(() => null),
        api.get(`/enrolments/course/${courseId}`).catch(() => null),
      ]);

      if (courseRes && courseRes.data.success) {
        const courseData = courseRes.data.data;
        setCourse(courseData);
        setSections(courseData.sections || []);

        // Expand all sections by default
        const initExpanded = {};
        (courseData.sections || []).forEach((sec) => {
          initExpanded[sec._id] = true;
        });
        setExpandedSections(initExpanded);

        // Select first lesson by default
        if (courseData.sections && courseData.sections.length > 0) {
          const firstSec = courseData.sections[0];
          if (firstSec.lessons && firstSec.lessons.length > 0) {
            setActiveLesson(firstSec.lessons[0]);
          }
        }
      }

      if (progressRes && progressRes.data.success) {
        const enrolment = progressRes.data.data;
        setCompletedLessons(enrolment.completedLessons || []);
        setProgressPercentage(enrolment.progressPercentage || 0);
      }
    } catch (err) {
      console.error('Failed to load course player:', err);
      toast.error('Failed to load course content.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Check assignment status when activeLesson changes
  useEffect(() => {
    if (activeLesson?.type?.toLowerCase() === 'assignment') {
      const checkAssignmentStatus = async () => {
        try {
          const res = await api.get(`/assignments/lesson/${activeLesson._id}`);
          if (res.data && res.data.success && res.data.data.submission) {
            setIsSubmitted(true);
            const sub = res.data.data.submission;
            setDocumentUrl(sub.fileUrl || '');
          } else {
            setIsSubmitted(false);
            setDocumentUrl('');
            setSelectedFile(null);
          }
        } catch (err) {
          setIsSubmitted(false);
          setDocumentUrl('');
          setSelectedFile(null);
        }
      };
      checkAssignmentStatus();
    }
  }, [activeLesson]);

  // Fetch Q&A questions for this course
  const fetchLessonQnA = useCallback(async () => {
    if (!courseId) return;
    try {
      setQnaLoading(true);
      const res = await api.get('/questions/student');
      if (res.data && res.data.success) {
        const filtered = (res.data.data || []).filter(
          (q) => (q.course?._id || q.course) === courseId
        );
        setQnaQuestions(filtered);
      }
    } catch (err) {
      console.error('Error fetching Q&A for course player:', err);
    } finally {
      setQnaLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'qna') {
      fetchLessonQnA();
    }
  }, [activeTab, fetchLessonQnA]);

  const handlePostLessonQuestion = async (e) => {
    e.preventDefault();
    if (!newQTitle.trim() || !newQText.trim()) {
      return toast.error('Please enter both title and question text');
    }
    try {
      setPostingQ(true);
      const res = await api.post('/questions', {
        courseId,
        lessonId: activeLesson?._id || null,
        title: newQTitle,
        question: newQText,
      });
      if (res.data && res.data.success) {
        toast.success('Question submitted to course instructor!');
        setNewQTitle('');
        setNewQText('');
        fetchLessonQnA();
      }
    } catch (err) {
      console.error('Error posting question:', err);
      toast.error(err.response?.data?.message || 'Failed to submit question');
    } finally {
      setPostingQ(false);
    }
  };

  // Handle Playback speed changes
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toggle section accordion
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Mark lesson as complete (or toggle)
  const handleMarkLessonComplete = async (targetLessonId) => {
    const targetId = targetLessonId || (activeLesson ? activeLesson._id : null);
    if (!targetId) return;

    try {
      const response = await api.post('/enrolments/progress', {
        courseId,
        lessonId: targetId,
      });

      if (response.data.success) {
        const enrolment = response.data.data;
        setCompletedLessons(enrolment.completedLessons || []);
        setProgressPercentage(enrolment.progressPercentage || 0);
        toast.success('Progress updated successfully! 🎉');
      }
    } catch (err) {
      toast.error('Failed to update lesson progress');
    }
  };

  // Auto completion on video finish
  const handleVideoEnded = () => {
    if (activeLesson) {
      toast.success('Video finished! Progress saved.');
      handleMarkLessonComplete(activeLesson._id);
    }
  };

  // Trigger Quiz Modal
  const handleOpenQuiz = async (lesson) => {
    try {
      const response = await api.get(`/quizzes/lesson/${lesson._id}`);
      if (response.data.success) {
        setQuizData(response.data.data);
        setQuizAnswers({});
        setQuizResult(null);
        setQuizModalOpen(true);
      }
    } catch (err) {
      toast.error('No quiz available for this lesson.');
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    const formattedAnswers = Object.keys(quizAnswers).map((qId) => ({
      questionId: qId,
      answer: quizAnswers[qId],
    }));

    try {
      setSubmittingQuiz(true);
      const response = await api.post(`/quizzes/${quizData._id}/submit`, {
        answers: formattedAnswers,
      });

      if (response.data.success) {
        setQuizResult(response.data.data);
        if (response.data.data.passed) {
          toast.success('Congratulations! You passed the quiz! 🏆');
          handleMarkLessonComplete(activeLesson?._id);
        } else {
          toast.error('Quiz score below passing threshold. Try again!');
        }
      }
    } catch (err) {
      toast.error('Error submitting quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Trigger Assignment Modal
  const handleOpenAssignment = async (lesson) => {
    setShowSubmissionModal(true);
  };

  // Submit Assignment Handler (Form submission)
  const handleAssignmentSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeLesson) return;

    const targetUrl = documentUrl || (selectedFile ? selectedFile.name : '');
    if (!targetUrl && !selectedFile) {
      toast.error('Please attach a document file or enter a direct document link.');
      return;
    }

    try {
      setUploading(true);
      const response = await api.post('/assignments/submit', {
        courseId,
        lessonId: activeLesson._id,
        solutionUrl: targetUrl,
        fileUrl: targetUrl,
        comments: selectedFile ? `Attached File: ${selectedFile.name}` : 'Document Link Submission',
      });

      if (response.data && response.data.success) {
        toast.success('Assignment document submitted successfully! 🚀');
        setIsSubmitted(true);
        setShowSubmissionModal(false);
        handleMarkLessonComplete(activeLesson._id);
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assignment document');
    } finally {
      setUploading(false);
    }
  };

  // Submit Assignment Handler
  const onSubmitAssignment = async (data) => {
    if (!assignmentData) return;
    try {
      const formData = new FormData();
      if (data.file && data.file[0]) {
        formData.append('assignment', data.file[0]);
      } else if (data.fileUrl) {
        formData.append('fileUrl', data.fileUrl);
      }
      formData.append('notes', data.notes || '');

      const response = await api.post(
        `/assignments/${assignmentData._id}/submit`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        toast.success('Assignment submitted successfully! 🚀');
        setAssignmentModalOpen(false);
        reset();
        handleMarkLessonComplete(activeLesson?._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'quiz':
        return <FiHelpCircle className="text-purple-400" />;
      case 'assignment':
        return <FiEdit3 className="text-amber-400" />;
      case 'pdf':
        return <FiFileText className="text-emerald-400" />;
      default:
        return <FiPlayCircle className="text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Course Workspace...</p>
        </div>
      </div>
    );
  }

  const isActiveCompleted =
    activeLesson &&
    completedLessons.some((id) => String(id) === String(activeLesson._id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/student"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white line-clamp-1">
              {course?.title || 'EduVerse Course Player'}
            </h1>
            <p className="text-xs text-slate-400">
              Instructor: {course?.instructorRef?.name || 'EduVerse Faculty'}
            </p>
          </div>
        </div>

        {/* Progress Bar & Certificate Button */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Progress: <span className="text-indigo-400 font-bold">{progressPercentage}%</span>
            </span>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {progressPercentage === 100 && (
            <Link
              to="/student/certificates"
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition"
            >
              <FiAward className="w-4 h-4" /> Certificate
            </Link>
          )}
        </div>
      </header>

      {/* Main Player Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left Column: Player & Tabbed Content */}
        <div className="lg:col-span-2 p-4 lg:p-6 space-y-6 overflow-y-auto border-r border-slate-800/80">
          {/* Media / Quiz Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {activeLesson?.type?.toLowerCase() === 'assignment' ? (
              <div className="flex flex-col items-center justify-center p-6 md:p-10 text-center bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl min-h-[380px] space-y-4 w-full">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto shadow-inner">
                  📝
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Assignment Project Task
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    {activeLesson?.title || 'Assignment Task'}
                  </h3>
                </div>

                <p className="text-slate-300 text-sm max-w-lg leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {activeLesson?.description || activeLesson?.notes || 'This lesson contains an Assignment project. Submit your work below.'}
                </p>

                {(activeLesson?.attachmentUrl || activeLesson?.pdfUrl) && (
                  <a
                    href={activeLesson.attachmentUrl || activeLesson.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    📥 Download Assignment Brief / Prompt ↗
                  </a>
                )}

                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-amber-600/30 flex items-center gap-2 text-sm"
                >
                  {isSubmitted ? '✔ Resubmit Assignment' : '📤 Submit Assignment'}
                </button>
              </div>
            ) : activeLesson?.type?.toLowerCase() === 'quiz' || activeLesson?.contentType?.toLowerCase() === 'quiz' ? (
              <div className="w-full bg-slate-950 p-4 sm:p-6 min-h-[500px]">
                <TakeQuiz
                  lessonId={activeLesson._id}
                  onQuizCompleted={fetchCourseDetails}
                />
              </div>
            ) : activeLesson?.type?.toLowerCase() === 'pdf' || activeLesson?.type?.toLowerCase() === 'document' || activeLesson?.pdfUrl || activeLesson?.attachmentUrl ? (
              <div className="w-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-3xl min-h-[550px] shadow-2xl">
                {/* Document Top Bar with Download Option */}
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">📄</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{activeLesson?.title || 'Document Lesson'}</h4>
                      <p className="text-xs text-slate-400">Interactive Reading Material</p>
                    </div>
                  </div>

                  {/* Download Link */}
                  {(activeLesson?.pdfUrl || activeLesson?.attachmentUrl || activeLesson?.url) && (
                    <a
                      href={getFileUrl(activeLesson.pdfUrl || activeLesson.attachmentUrl || activeLesson.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                    >
                      📥 Open / Download PDF ↗
                    </a>
                  )}
                </div>

                {/* EMBEDDED PDF IFRAME VIEWER */}
                {(activeLesson?.pdfUrl || activeLesson?.attachmentUrl || activeLesson?.url) ? (
                  <div className="w-full h-[550px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
                    <iframe
                      src={`${getFileUrl(activeLesson.pdfUrl || activeLesson.attachmentUrl || activeLesson.url)}#toolbar=1`}
                      title={activeLesson?.title || 'Lesson Document'}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  /* Fallback if no document file uploaded */
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-3">
                      📄
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{activeLesson?.title}</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {activeLesson?.description || activeLesson?.notes || 'No attached document file was provided for this lesson.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {activeLesson?.type === 'video' && activeLesson?.videoUrl ? (
                  activeLesson.videoUrl.includes('youtube') || activeLesson.videoUrl.includes('vimeo') || activeLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={getEmbedUrl(activeLesson.videoUrl)}
                      title={activeLesson?.title || 'Lesson Video'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={getEmbedUrl(activeLesson.videoUrl)}
                      controls
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => {
                        setIsVideoPlaying(false);
                        handleVideoEnded();
                      }}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto text-3xl">
                      {getLessonIcon(activeLesson?.type)}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {activeLesson?.title || 'Select a lesson'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {activeLesson?.type === 'assignment'
                        ? 'This lesson contains an Assignment project. Submit your work below.'
                        : 'Interactive media module ready for review.'}
                    </p>

                    {activeLesson?.type === 'assignment' && (
                      <button
                        onClick={() => handleOpenAssignment(activeLesson)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar Under Player */}
            <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {activeLesson?.type || 'Lesson'}
                </span>
                <h2 className="text-lg font-bold text-white line-clamp-1">
                  {activeLesson?.title || 'Lesson Title'}
                </h2>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Playback Speed Controls */}
                {activeLesson?.type === 'video' && (
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <FiSliders className="text-indigo-400" />
                    <span className="text-slate-400 text-[11px] font-semibold">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                          playbackSpeed === spd
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleMarkLessonComplete(activeLesson?._id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition ${
                    isActiveCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  }`}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  {isActiveCompleted ? 'Completed ✓' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>

          {/* Resource Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex border-b border-slate-800 gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview & Notes
              </button>
              {activeLesson?.pdfUrl && (
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition ${
                    activeTab === 'pdf'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PDF Study Guide
                </button>
              )}
              {activeLesson?.sourceCode && (
                <button
                  onClick={() => setActiveTab('source')}
                  className={`pb-3 text-sm font-semibold border-b-2 transition ${
                    activeTab === 'source'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Source Code & Attachments
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTab('qna');
                  fetchLessonQnA();
                }}
                className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'qna'
                    ? 'border-blue-500 text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiMessageSquare className="text-amber-400" /> Q&A & Discussion
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                <h3 className="text-base font-bold text-white">Lesson Notes & Summary</h3>
                <p>{activeLesson?.notes || 'No detailed notes provided for this lesson.'}</p>
              </div>
            )}

            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiFileText className="text-emerald-400" /> Embedded PDF Reader
                  </h3>
                  <a
                    href={activeLesson?.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <FiDownload /> Download PDF
                  </a>
                </div>
                <div className="w-full h-96 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <iframe
                    src={activeLesson?.pdfUrl}
                    title="PDF Viewer"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {activeTab === 'source' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiCode className="text-indigo-400" /> Lesson Attachments & Source Code
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeLesson?.sourceCode || '');
                      toast.success('Code snippet copied!');
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                  >
                    Copy Snippet
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto">
                  {activeLesson?.sourceCode || '// No source code attachments provided for this lesson.'}
                </pre>
              </div>
            )}

            {activeTab === 'qna' && (
              <div className="space-y-6">
                {/* Ask Question Form */}
                <form onSubmit={handlePostLessonQuestion} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <FiMessageSquare className="text-blue-400" /> Ask Question for "{activeLesson?.title || 'Lesson'}"
                  </h4>
                  <input
                    type="text"
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    placeholder="Question subject / title..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <textarea
                    rows={3}
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Describe your issue or code problem in detail..."
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={postingQ}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <FiSend /> {postingQ ? 'Submitting...' : 'Post Question'}
                    </button>
                  </div>
                </form>

                {/* Course Questions List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Discussion Threads ({qnaQuestions.length})
                  </h4>
                  {qnaLoading ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Loading Q&A discussions...
                    </div>
                  ) : qnaQuestions.length === 0 ? (
                    <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-500">
                      No questions asked for this course yet. Be the first to ask!
                    </div>
                  ) : (
                    qnaQuestions.map((q) => (
                      <div key={q._id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white">{q.title}</h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.isAnswered
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {q.isAnswered ? 'Answered ✓' : 'Pending Answer'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{q.question}</p>
                        {q.isAnswered && q.answer && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 bg-blue-950/30 p-3 rounded-xl border border-blue-500/20 space-y-1">
                            <span className="text-[11px] font-bold text-blue-300 block">
                              Instructor Reply:
                            </span>
                            <p className="text-xs text-slate-200">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Curriculum Accordion with Interactive Checkboxes */}
        <div className="bg-slate-900/90 border-l border-slate-800/80 p-4 lg:p-6 overflow-y-auto space-y-4">
          <h2 className="text-base font-bold text-white mb-2">Course Curriculum</h2>

          {sections.length === 0 ? (
            <p className="text-xs text-slate-400">No sections available yet.</p>
          ) : (
            sections.map((section, sIndex) => (
              <div
                key={section._id}
                className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40"
              >
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full p-3.5 bg-slate-800/60 hover:bg-slate-800 flex items-center justify-between text-left transition"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                      Section {sIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{section.title}</h3>
                  </div>
                  {expandedSections[section._id] ? (
                    <FiChevronUp className="text-slate-400" />
                  ) : (
                    <FiChevronDown className="text-slate-400" />
                  )}
                </button>

                {expandedSections[section._id] && (
                  <div className="divide-y divide-slate-800/50">
                    {section.lessons && section.lessons.length > 0 ? (
                      section.lessons.map((lesson) => {
                        const isSelected = activeLesson?._id === lesson._id;
                        const isLessonCompleted = completedLessons.some(
                          (id) => String(id) === String(lesson._id)
                        );

                        return (
                          <div
                            key={lesson._id}
                            className={`p-3.5 flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-indigo-600/15 border-l-4 border-indigo-500 text-white'
                                : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            <div
                              onClick={() => setActiveLesson(lesson)}
                              className="flex items-center gap-3 cursor-pointer flex-1"
                            >
                              <span className="text-lg">{getLessonIcon(lesson.type)}</span>
                              <div>
                                <h4 className="text-xs font-semibold line-clamp-1">
                                  {lesson.title}
                                </h4>
                                <span className="text-[10px] text-slate-500 uppercase">
                                  {lesson.type}
                                </span>
                              </div>
                            </div>

                            {/* Interactive Completion Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkLessonComplete(lesson._id);
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isLessonCompleted
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : 'border-slate-700 hover:border-slate-500 text-slate-500'
                              }`}
                              title={isLessonCompleted ? 'Marked Completed' : 'Mark Complete'}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-3 text-xs text-slate-500">No lessons in this section.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* QUIZ MODAL */}
      <AnimatePresence>
        {quizModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase">
                    Quiz Assessment
                  </span>
                  <h2 className="text-xl font-bold text-white">{quizData?.title}</h2>
                </div>
                <button
                  onClick={() => setQuizModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {!quizResult ? (
                <div className="space-y-6">
                  {quizData?.questions && quizData.questions.length > 0 ? (
                    quizData.questions.map((q, idx) => (
                      <div key={q._id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                        <h3 className="text-sm font-semibold text-white">
                          Q{idx + 1}. {q.questionText}
                        </h3>

                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                                  quizAnswers[q._id] === opt
                                    ? 'bg-purple-600/20 border-purple-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q._id}`}
                                  value={opt}
                                  checked={quizAnswers[q._id] === opt}
                                  onChange={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [q._id]: opt }))
                                  }
                                  className="text-purple-600 focus:ring-0"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No questions loaded.</p>
                  )}

                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
                  >
                    <FiSend /> {submittingQuiz ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                </div>
              ) : (
                /* QUIZ RESULT FEEDBACK */
                <div className="space-y-6 text-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold ${
                      quizResult.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {quizResult.passed ? '✓' : '✕'}
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-white">
                      {quizResult.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Score: <span className="font-bold text-white">{quizResult.scorePercentage}%</span> (Passing score: {quizResult.passingScore}%)
                    </p>
                  </div>

                  <button
                    onClick={() => setQuizModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Close Result
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSION MODAL */}
      <AnimatePresence>
        {showSubmissionModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition font-bold"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Submit Solution
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">Submit Assignment Document</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload your completed assignment file (PDF, DOCX, ZIP).
                </p>
              </div>

              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                {/* FILE UPLOAD DROPZONE */}
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-950 hover:bg-amber-500/5 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.rar"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setDocumentUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-3xl mb-2">📁</span>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedFile ? selectedFile.name : 'Click or Drag document here'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, Word Documents (.docx), or ZIP archives (Max 20MB)
                    </p>
                  </div>
                </div>

                {/* DIRECT DOCUMENT LINK FALLBACK */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Or Direct File / Drive Link *
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../my-assignment.pdf"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* SUBMIT BUTTONS */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowSubmissionModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile && !documentUrl}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
                  >
                    <FiSend /> {uploading ? 'Uploading...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer;
