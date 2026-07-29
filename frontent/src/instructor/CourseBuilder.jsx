import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiBookOpen,
  FiPlus,
  FiArrowRight,
  FiArrowLeft,
  FiFolderPlus,
  FiVideo,
  FiHelpCircle,
  FiSave,
} from 'react-icons/fi';

const CourseBuilder = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [createdCourse, setCreatedCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Step 1 Form
  const { register: registerStep1, handleSubmit: handleSubmitStep1 } = useForm({
    defaultValues: {
      title: '',
      description: '',
      categoryRef: '',
      price: 0,
      level: 'Beginner',
      language: 'English',
      thumbnail: '',
    },
  });

  // Step 2 Form (Section addition)
  const [sectionTitle, setSectionTitle] = useState('');

  // Step 3 Form (Lesson addition)
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video',
    videoUrl: '',
    pdfUrl: '',
    notes: '',
    sourceCode: '',
  });

  // Step 4 Form (Quiz creation)
  const [quizForm, setQuizForm] = useState({
    lessonId: '',
    title: '',
    passingScore: 70,
  });
  const [questions, setQuestions] = useState([
    { questionText: '', type: 'MCQ', options: ['', ''], correctAnswers: '' },
  ]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Step 1: Create Course Basic Info
  const onSaveBasicInfo = async (data) => {
    try {
      setLoading(true);
      const response = await api.post('/courses', data);
      if (response.data.success) {
        setCreatedCourse(response.data.data);
        toast.success('Course created! Now add curriculum sections.');
        setCurrentStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Add Section
  const handleAddSection = async () => {
    if (!sectionTitle.trim() || !createdCourse) return;
    try {
      setLoading(true);
      const response = await api.post(`/courses/${createdCourse._id}/sections`, {
        title: sectionTitle,
        order: sections.length + 1,
      });

      if (response.data.success) {
        setSections([...sections, { ...response.data.data, lessons: [] }]);
        setSectionTitle('');
        toast.success('Section added successfully!');
      }
    } catch (err) {
      toast.error('Failed to add section');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add Lesson to Section
  const handleAddLesson = async () => {
    if (!selectedSectionId || !lessonForm.title.trim()) {
      toast.error('Please select a section and enter lesson title.');
      return;
    }
    try {
      setLoading(true);
      const response = await api.post(`/courses/sections/${selectedSectionId}/lessons`, {
        ...lessonForm,
        courseId: createdCourse._id,
      });

      if (response.data.success) {
        const newLesson = response.data.data;
        setSections((prev) =>
          prev.map((sec) =>
            sec._id === selectedSectionId
              ? { ...sec, lessons: [...(sec.lessons || []), newLesson] }
              : sec
          )
        );
        setLessonForm({
          title: '',
          type: 'video',
          videoUrl: '',
          pdfUrl: '',
          notes: '',
          sourceCode: '',
        });
        toast.success('Lesson added to section!');
      }
    } catch (err) {
      toast.error('Failed to add lesson');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Add Quiz
  const handleAddQuiz = async () => {
    if (!quizForm.lessonId || !quizForm.title) {
      toast.error('Please select a lesson and enter quiz title.');
      return;
    }
    try {
      setLoading(true);
      const response = await api.post('/quizzes', {
        ...quizForm,
        questions,
      });

      if (response.data.success) {
        toast.success('Quiz & questions configured!');
        // Final publication check
        await api.put(`/courses/${createdCourse._id}`, { status: 'Published' }).catch(() => {});
        toast.success('Course published successfully! 🎉');
        navigate('/instructor/courses');
      }
    } catch (err) {
      toast.error('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Instructor Studio
          </span>
          <h1 className="text-2xl font-extrabold text-white">Course Curriculum Builder</h1>
        </div>

        {/* Stepper Pill Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                currentStep === step
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : currentStep > step
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > step ? '✓' : step}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: BASIC COURSE INFO */}
      {currentStep === 1 && (
        <form
          onSubmit={handleSubmitStep1(onSaveBasicInfo)}
          className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6"
        >
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiBookOpen className="text-emerald-400" /> Step 1: Course Overview & Pricing
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Master Full-Stack Web Development with React & Node.js"
                {...registerStep1('title')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detailed outline of what students will master..."
                {...registerStep1('description')}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  required
                  {...registerStep1('categoryRef')}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Level
                </label>
                <select
                  {...registerStep1('level')}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Price ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 for Free"
                  {...registerStep1('price')}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                {...registerStep1('thumbnail')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            Save & Continue to Sections <FiArrowRight />
          </button>
        </form>
      )}

      {/* STEP 2: ADD SECTIONS */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiFolderPlus className="text-emerald-400" /> Step 2: Curriculum Sections
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Section 1: Introduction to React Fundamentals"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleAddSection}
              disabled={loading}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition"
            >
              <FiPlus /> Add Section
            </button>
          </div>

          {/* Section List */}
          <div className="space-y-3 pt-2">
            {sections.map((sec, idx) => (
              <div
                key={sec._id}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Section {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                </div>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Saved
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={sections.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              Continue to Add Lessons <FiArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: UPLOAD LESSONS */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiVideo className="text-emerald-400" /> Step 3: Add Lessons & Media Files
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Target Section *
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Section</option>
                {sections.map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    {sec.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Understanding React Hooks"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lesson Type
                </label>
                <select
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="video">Video Lesson</option>
                  <option value="pdf">PDF Material</option>
                  <option value="quiz">Quiz Assessment</option>
                  <option value="assignment">Assignment Task</option>
                </select>
              </div>
            </div>

            {lessonForm.type === 'video' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Video URL (YouTube / Vimeo / MP4 link)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/..."
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {lessonForm.type === 'pdf' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PDF Material Document URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={lessonForm.pdfUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lesson Notes / Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Key takeaways or summary notes..."
                value={lessonForm.notes}
                onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleAddLesson}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <FiPlus /> Save Lesson to Section
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              Configure Quizzes & Publish <FiArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CREATE QUIZ & PUBLISH */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiHelpCircle className="text-emerald-400" /> Step 4: Quiz Assessment & Course Launch
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Lesson for Quiz
              </label>
              <select
                value={quizForm.lessonId}
                onChange={(e) => setQuizForm({ ...quizForm, lessonId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Lesson</option>
                {sections.flatMap((s) => s.lessons || []).map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.title} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quiz Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. React Core Concepts Evaluation"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={quizForm.passingScore}
                  onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Questions builder */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-white">Quiz Questions</h3>
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <input
                    type="text"
                    placeholder={`Question ${idx + 1} text...`}
                    value={q.questionText}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx].questionText = e.target.value;
                      setQuestions(updated);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <input
                        key={oIdx}
                        type="text"
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].options[oIdx] = e.target.value;
                          setQuestions(updated);
                        }}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                      />
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Correct Option Answer (Exact String)"
                    value={q.correctAnswers}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx].correctAnswers = e.target.value;
                      setQuestions(updated);
                    }}
                    className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300"
                  />
                </div>
              ))}

              <button
                onClick={() =>
                  setQuestions([
                    ...questions,
                    { questionText: '', type: 'MCQ', options: ['', ''], correctAnswers: '' },
                  ])
                }
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl flex items-center gap-1 transition"
              >
                <FiPlus /> Add Question
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>
            <button
              onClick={handleAddQuiz}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 hover:scale-105 transition flex items-center gap-2"
            >
              <FiSave /> Save & Publish Course Live 🚀
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CourseBuilder;
