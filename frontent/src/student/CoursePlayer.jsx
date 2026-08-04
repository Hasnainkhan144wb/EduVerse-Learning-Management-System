import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getEmbedUrl } from '../utils/videoEmbed';
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

  // Assignment Modal State
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const { register, handleSubmit, reset } = useForm();

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
    try {
      const response = await api.get(`/assignments/lesson/${lesson._id}`);
      if (response.data.success) {
        setAssignmentData(response.data.data.assignment);
        setAssignmentModalOpen(true);
      }
    } catch (err) {
      toast.error('No assignment instructions available.');
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
          {/* Media Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
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
                    onEnded={handleVideoEnded}
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
                    {activeLesson?.type === 'quiz'
                      ? 'This lesson is an interactive Quiz. Click below to start your attempt.'
                      : activeLesson?.type === 'assignment'
                      ? 'This lesson contains an Assignment project. Submit your work below.'
                      : 'Interactive media module ready for review.'}
                  </p>

                  {activeLesson?.type === 'quiz' && (
                    <button
                      onClick={() => handleOpenQuiz(activeLesson)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition"
                    >
                      Start Quiz Attempt
                    </button>
                  )}

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

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {assignmentModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase">
                    Assignment Submission
                  </span>
                  <h2 className="text-xl font-bold text-white">{assignmentData?.title}</h2>
                </div>
                <button
                  onClick={() => setAssignmentModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-white">Instructions:</p>
                <p>{assignmentData?.instructions}</p>
                <p className="text-amber-400 font-semibold mt-2">
                  Total Marks: {assignmentData?.totalMarks}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmitAssignment)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Upload Submission File (PDF / Doc / Zip)
                  </label>
                  <input
                    type="file"
                    {...register('file')}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Or Provide Submission File URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or GitHub URL"
                    {...register('fileUrl')}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
                >
                  <FiSend /> Submit Assignment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer;
