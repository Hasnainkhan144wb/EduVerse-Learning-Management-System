import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  FiArrowLeft,
  FiAward,
  FiX,
  FiSliders,
  FiMessageSquare,
} from 'react-icons/fi';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Core Course & Enrolment State
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  // Assignment Submission State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [modalError, setModalError] = useState('');

  // Real-Time Active Learning Time Tracking System
  const secondsBufferRef = useRef(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // 1. Fetch Course Details & Progress
  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`).catch(() => null),
        api.get(`/enrolments/course/${courseId}`).catch(() => null),
      ]);

      if (courseRes && courseRes.data) {
        const courseData = courseRes.data.course || courseRes.data.data || courseRes.data;
        setCourse(courseData);
        const secList = courseData.sections || [];
        setSections(secList);

        // Expand sections by default
        const initExpanded = {};
        secList.forEach((sec) => {
          initExpanded[sec._id] = true;
        });
        setExpandedSections(initExpanded);

        // Select first lesson by default if none active
        if (secList.length > 0 && secList[0].lessons && secList[0].lessons.length > 0) {
          setActiveLesson((prev) => prev || secList[0].lessons[0]);
        }
      }

      if (progressRes && progressRes.data && progressRes.data.success) {
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
    if (courseId) fetchCourseDetails();
  }, [courseId, fetchCourseDetails]);

  // 2. Real-Time Active Learning Tracker Effect
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

      if (isVisible && isFocused) {
        if (type === 'video') {
          if (isVideoPlaying) secondsBufferRef.current += 1;
        } else {
          secondsBufferRef.current += 1;
        }
      }

      if (secondsBufferRef.current >= 15) {
        flushTime();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') flushTime();
    };
    const handleBlur = () => flushTime();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      flushTime();
    };
  }, [courseId, activeLesson, isVideoPlaying]);

  // 3. Mark Lesson Complete Handler
  const handleMarkLessonComplete = async (lessonIdToComplete) => {
    const targetId = lessonIdToComplete || activeLesson?._id;
    if (!targetId) return;

    try {
      const res = await api.post('/enrolments/progress', {
        courseId,
        lessonId: targetId,
      });

      if (res.data && res.data.success) {
        toast.success('Lesson completed! Progress saved.');
        setCompletedLessons((prev) =>
          prev.includes(targetId) ? prev : [...prev, targetId]
        );

        if (res.data.data && res.data.data.progressPercentage !== undefined) {
          setProgressPercentage(res.data.data.progressPercentage);
        }
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      toast.error('Failed to update lesson progress.');
    }
  };

  // 4. Video Playback Speed Handler
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // 5. Submit Assignment Handler
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!selectedFile && !documentUrl.trim()) {
      setModalError('Please attach a document file or provide a valid solution URL.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('lessonId', activeLesson?._id);

      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('document', selectedFile);
      }
      if (documentUrl) {
        formData.append('solutionUrl', documentUrl);
        formData.append('documentUrl', documentUrl);
      }

      const res = await api.post('/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && (res.data.success || res.status === 200 || res.status === 201)) {
        toast.success(res.data.message || '🎉 Assignment submitted successfully!');
        setIsSubmitted(true);
        setShowSubmissionModal(false);
        setModalError('');
        setSelectedFile(null);
        setDocumentUrl('');
        handleMarkLessonComplete(activeLesson?._id);
      }
    } catch (err) {
      console.error('Assignment submission error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit assignment. Check server logs.';
      setModalError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // 6. Section Toggle Helper
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getLessonIcon = (type) => {
    const t = (type || 'video').toLowerCase();
    if (t === 'quiz') return <FiHelpCircle className="text-purple-400" />;
    if (t === 'assignment') return <FiEdit3 className="text-amber-400" />;
    if (t === 'pdf' || t === 'document') return <FiFileText className="text-emerald-400" />;
    return <FiPlayCircle className="text-indigo-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
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
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student')}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <FiArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div>
            <h1 className="text-base font-bold text-white line-clamp-1">
              {course?.title || 'EduVerse Course Player'}
            </h1>
            <p className="text-xs text-slate-400">
              Instructor: {course?.instructorRef?.name || course?.instructor?.name || 'EduVerse Faculty'}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR & CERTIFICATE */}
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

      {/* MAIN PLAYER GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* LEFT COLUMN: PRIMARY VIEWER & DISCUSSION */}
        <div className="lg:col-span-2 p-4 lg:p-6 space-y-6 overflow-y-auto border-r border-slate-800/80">
          {/* PRIMARY MAIN VIEWER CONTAINER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 md:p-7 space-y-6 flex flex-col justify-between">
            {/* TOP BAR: Lesson Type Badge, Title & Completion Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-2xl font-bold">
                  {activeLesson?.type?.toLowerCase() === 'assignment' ? '📝' : activeLesson?.type?.toLowerCase() === 'pdf' || activeLesson?.type?.toLowerCase() === 'document' ? '📄' : '🎥'}
                </span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {activeLesson?.type || 'Lesson'}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">{activeLesson?.title || 'Lesson Title'}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {activeLesson?.type?.toLowerCase() === 'video' && (
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
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
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

            {/* MEDIA / QUIZ / VIEWER CONTENT */}
            {activeLesson?.type?.toLowerCase() === 'assignment' ? (
              <div className="flex flex-col items-center justify-center p-6 md:p-10 text-center bg-slate-950 rounded-2xl border border-slate-800 shadow-inner min-h-[300px] space-y-4 w-full">
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
              </div>
            ) : activeLesson?.type?.toLowerCase() === 'quiz' || activeLesson?.contentType?.toLowerCase() === 'quiz' ? (
              <div className="w-full bg-slate-950 p-4 sm:p-6 min-h-[480px] rounded-2xl border border-slate-800">
                <TakeQuiz
                  lessonId={activeLesson._id}
                  onQuizCompleted={fetchCourseDetails}
                />
              </div>
            ) : activeLesson?.type?.toLowerCase() === 'pdf' || activeLesson?.type?.toLowerCase() === 'document' || activeLesson?.pdfUrl || activeLesson?.attachmentUrl ? (
              <div className="w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 p-4 rounded-2xl min-h-[500px] shadow-inner">
                {/* Document Top Bar with Download Option */}
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 p-3.5 rounded-xl mb-4 border border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">📄</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{activeLesson?.title || 'Document Lesson'}</h4>
                      <p className="text-xs text-slate-400">Interactive Reading Material</p>
                    </div>
                  </div>

                  {(activeLesson?.pdfUrl || activeLesson?.attachmentUrl || activeLesson?.url) && (
                    <a
                      href={getFileUrl(activeLesson.pdfUrl || activeLesson.attachmentUrl || activeLesson.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                    >
                      📥 Open / Download PDF ↗
                    </a>
                  )}
                </div>

                {/* EMBEDDED PDF IFRAME VIEWER */}
                {(activeLesson?.pdfUrl || activeLesson?.attachmentUrl || activeLesson?.url) ? (
                  <div className="w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
                    <iframe
                      src={`${getFileUrl(activeLesson.pdfUrl || activeLesson.attachmentUrl || activeLesson.url)}#toolbar=1`}
                      title={activeLesson?.title || 'Lesson Document'}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-3">
                      📄
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{activeLesson?.title}</h3>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl">
                {activeLesson?.type?.toLowerCase() === 'video' && activeLesson?.videoUrl ? (
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
                        handleMarkLessonComplete();
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
                  </div>
                )}
              </div>
            )}

            {/* MIDDLE BODY: Combined Description / Lesson Notes */}
            <div className="pt-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Lesson Notes & Summary</h4>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-xs md:text-sm leading-relaxed">
                {activeLesson?.notes || activeLesson?.description || 'No summary provided for this assignment.'}
              </div>
            </div>

            {/* BOTTOM ACTIONS: Download Brief & Submission Button */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              {(activeLesson?.attachmentUrl || activeLesson?.pdfUrl || activeLesson?.sourceCode) ? (
                <a
                  href={getFileUrl(activeLesson.attachmentUrl || activeLesson.pdfUrl || activeLesson.sourceCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-indigo-500/30 shadow-sm cursor-pointer"
                >
                  📥 Download Assignment Brief / Prompt ↗
                </a>
              ) : <div />}

              {activeLesson?.type?.toLowerCase() === 'assignment' && (
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl transition-all shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitted ? '✔ Resubmit Assignment' : '📤 Submit Assignment'}
                </button>
              )}
            </div>
          </div>

          {/* SUPPLEMENTARY DISCUSSION & RESOURCES SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex border-b border-slate-800 gap-6">
              <button
                onClick={() => setActiveTab('qna')}
                className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'qna' || activeTab === 'overview'
                    ? 'border-indigo-500 text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiMessageSquare className="text-amber-400" /> Q&A & Discussion
              </button>
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
            </div>

            {activeTab === 'source' && activeLesson?.sourceCode && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Source Code Reference</h4>
                  <p className="text-xs text-slate-400">External GitHub or repository resource link</p>
                </div>
                <a
                  href={activeLesson.sourceCode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition"
                >
                  View Code ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: COURSE CURRICULUM SIDEBAR */}
        <div className="p-4 lg:p-6 bg-slate-900/60 space-y-4 border-l border-slate-800/80 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base">Course Curriculum</h3>
            <span className="text-xs font-semibold text-slate-400">
              {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Lessons
            </span>
          </div>

          <div className="space-y-3">
            {sections.map((section, secIdx) => (
              <div key={section._id || secIdx} className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden">
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full p-3.5 bg-slate-900 hover:bg-slate-800/70 flex items-center justify-between text-left transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">
                      Module {secIdx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{section.title}</h4>
                  </div>
                  {expandedSections[section._id] ? (
                    <FiChevronUp className="text-slate-400" />
                  ) : (
                    <FiChevronDown className="text-slate-400" />
                  )}
                </button>

                {expandedSections[section._id] && (
                  <div className="p-2 space-y-1 bg-slate-955/60 border-t border-slate-800/60">
                    {section.lessons?.map((lesson) => {
                      const isCompleted = completedLessons.some(
                        (id) => String(id) === String(lesson._id)
                      );
                      const isActive = activeLesson?._id === lesson._id;

                      return (
                        <div
                          key={lesson._id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                            isActive
                              ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-bold'
                              : 'hover:bg-slate-800/50 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getLessonIcon(lesson.type)}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          {isCompleted && (
                            <FiCheckCircle className="text-emerald-400 w-4 h-4 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ASSIGNMENT SUBMISSION MODAL */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl relative z-[100000]">
            <button
              onClick={() => {
                setShowSubmissionModal(false);
                setModalError('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 font-bold"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Assignment Submission
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {activeLesson?.title || 'Submit Assignment'}
              </h3>
            </div>

            {/* VISIBLE IN-MODAL ERROR ALERT */}
            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-semibold flex items-center justify-between">
                <span>⚠️ {modalError}</span>
                <button
                  type="button"
                  onClick={() => setModalError('')}
                  className="text-red-400 hover:text-red-300 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              {/* Local File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Attach Solution File (PDF, DOCX, ZIP)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-2.5 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {/* Document / Solution URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Or Direct Document / Solution URL
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Submit Work ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
