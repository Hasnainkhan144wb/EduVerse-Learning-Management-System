import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFolderPlus,
  FiVideo,
  FiFileText,
  FiHelpCircle,
  FiArrowLeft,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

const ManageLessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');

  // Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video',
    videoUrl: '',
    pdfUrl: '',
    notes: '',
    sourceCode: '',
  });

  const [expandedSections, setExpandedSections] = useState({});

  // Fetch course, sections, and lessons
  const fetchCourseCurriculum = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        const courseData = response.data.data;
        setCourse(courseData);
        setSections(courseData.sections || []);

        const initExpanded = {};
        (courseData.sections || []).forEach((sec) => {
          initExpanded[sec._id] = true;
        });
        setExpandedSections(initExpanded);
      }
    } catch (err) {
      console.error('Error loading course curriculum:', err);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseCurriculum();
  }, [fetchCourseCurriculum]);

  // Section CRUD Handlers
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionTitle('');
    setSectionModalOpen(true);
  };

  const handleOpenEditSection = (section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionModalOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    try {
      if (editingSection) {
        const response = await api.put(`/courses/sections/${editingSection._id}`, {
          title: sectionTitle,
        });
        if (response.data.success) {
          toast.success('Section title updated!');
          fetchCourseCurriculum();
        }
      } else {
        const response = await api.post(`/courses/${courseId}/sections`, {
          title: sectionTitle,
          order: sections.length + 1,
        });
        if (response.data.success) {
          toast.success('New section added to curriculum! 🎉');
          fetchCourseCurriculum();
        }
      }
      setSectionModalOpen(false);
    } catch (err) {
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section and all its lessons?')) {
      return;
    }
    try {
      const response = await api.delete(`/courses/sections/${sectionId}`);
      if (response.data.success) {
        toast.success('Section deleted');
        fetchCourseCurriculum();
      }
    } catch (err) {
      toast.error('Failed to delete section');
    }
  };

  // Lesson CRUD Handlers
  const handleOpenAddLesson = (sectionId) => {
    setSelectedSectionId(sectionId);
    setEditingLesson(null);
    setLessonForm({
      title: '',
      type: 'video',
      videoUrl: '',
      pdfUrl: '',
      notes: '',
      sourceCode: '',
    });
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson) => {
    setSelectedSectionId(lesson.sectionId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      videoUrl: lesson.videoUrl || '',
      pdfUrl: lesson.pdfUrl || '',
      notes: lesson.notes || '',
      sourceCode: lesson.sourceCode || '',
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }

    try {
      if (editingLesson) {
        const response = await api.put(`/courses/lessons/${editingLesson._id}`, lessonForm);
        if (response.data.success) {
          toast.success('Lesson updated successfully!');
          fetchCourseCurriculum();
        }
      } else {
        const response = await api.post(
          `/courses/sections/${selectedSectionId}/lessons`,
          lessonForm
        );
        if (response.data.success) {
          toast.success('Lesson added to section! 🚀');
          fetchCourseCurriculum();
        }
      }
      setLessonModalOpen(false);
    } catch (err) {
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const response = await api.delete(`/courses/lessons/${lessonId}`);
      if (response.data.success) {
        toast.success('Lesson removed');
        fetchCourseCurriculum();
      }
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };

  const toggleSectionExpand = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Course Curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Instructor Studio • Step 2
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Curriculum Studio: {course?.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize sections, upload video streams, attach PDF readings, and configure quiz & assignment tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/instructor/courses"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <FiArrowLeft /> Courses List
          </Link>
          <button
            onClick={handleOpenAddSection}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <FiFolderPlus /> Add Section
          </button>
        </div>
      </div>

      {/* Sections & Lessons Accordion List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              <FiFolderPlus />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Curriculum Sections Created Yet</h3>
              <p className="text-slate-400 text-sm mt-1">
                Start by creating your first course section module.
              </p>
            </div>
            <button
              onClick={handleOpenAddSection}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              <FiPlus /> Add Section
            </button>
          </div>
        ) : (
          sections.map((section, sIdx) => (
            <div
              key={section._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl"
            >
              {/* Section Header */}
              <div className="p-5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSectionExpand(section._id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                  >
                    {expandedSections[section._id] ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                      Section {sIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">{section.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddLesson(section._id)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <FiPlus /> Add Lesson
                  </button>
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                    title="Edit Section"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section._id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete Section"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons Item List */}
              {expandedSections[section._id] && (
                <div className="divide-y divide-slate-800/60 p-2">
                  {section.lessons && section.lessons.length > 0 ? (
                    section.lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="p-4 flex items-center justify-between hover:bg-slate-800/40 rounded-2xl transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center text-xl">
                            {lesson.type === 'pdf' ? (
                              <FiFileText />
                            ) : lesson.type === 'quiz' ? (
                              <FiHelpCircle />
                            ) : (
                              <FiVideo />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="uppercase text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {lesson.type}
                              </span>
                              {lesson.videoUrl && <span>Video URL Configured</span>}
                              {lesson.pdfUrl && <span>PDF Configured</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.type === 'quiz' && (
                            <Link
                              to={`/instructor/quizzes/create/${lesson._id}`}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                            >
                              <FiHelpCircle /> Configure Quiz
                            </Link>
                          )}
                          {lesson.type === 'assignment' && (
                            <Link
                              to={`/instructor/assignments/manage/${lesson._id}`}
                              className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                            >
                              <FiFileText /> Configure Assignment
                            </Link>
                          )}
                          <button
                            onClick={() => handleOpenEditLesson(lesson)}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit Lesson"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson._id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete Lesson"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-xs text-slate-400">
                      No lessons added to this section yet. Click "Add Lesson" above.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SECTION MODAL */}
      <AnimatePresence>
        {sectionModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingSection ? 'Edit Section Title' : 'Add Curriculum Section'}
                </h2>
                <button
                  onClick={() => setSectionModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Section Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section 1: Fundamentals & Getting Started"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSectionModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Section
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LESSON MODAL */}
      <AnimatePresence>
        {lessonModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson Module'}
                </h2>
                <button
                  onClick={() => setLessonModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Setting Up Node.js & Express Server"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lesson Content Type
                  </label>
                  <select
                    value={lessonForm.type}
                    onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="video">Video Stream Lesson</option>
                    <option value="pdf">PDF Document Reading</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="assignment">Assignment Task</option>
                  </select>
                </div>

                {lessonForm.type === 'video' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Video Stream URL (YouTube Embed / Vimeo / MP4 link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/embed/..."
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {lessonForm.type === 'pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      PDF Document Attachment URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/materials.pdf"
                      value={lessonForm.pdfUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lesson Summary & Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key concepts or reading instructions..."
                    value={lessonForm.notes}
                    onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Downloadable Resource / Source Code Link
                  </label>
                  <input
                    type="text"
                    placeholder="GitHub repo URL or code snippet"
                    value={lessonForm.sourceCode}
                    onChange={(e) => setLessonForm({ ...lessonForm, sourceCode: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setLessonModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLesson}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Lesson Module
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageLessons;
