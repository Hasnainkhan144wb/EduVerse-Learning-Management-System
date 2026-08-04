import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiHelpCircle,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiArrowLeft,
  FiSave,
  FiSliders,
  FiList,
  FiCheckSquare,
  FiChevronUp,
  FiChevronDown,
  FiBarChart2,
  FiClock,
  FiRepeat,
  FiShuffle,
  FiAward,
  FiUserCheck,
  FiCopy,
} from 'react-icons/fi';

const CreateQuiz = () => {
  const { lessonId: paramLessonId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'analytics'
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(paramLessonId || '');
  const [existingQuizId, setExistingQuizId] = useState(null);

  // General Quiz Settings State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [timeLimit, setTimeLimit] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Dynamic Questions Array
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1,
      explanation: '',
    },
  ]);

  // Load instructor's courses list
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
        console.error('Error fetching instructor courses:', err);
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
          const allLessons = [];
          (response.data.data.sections || []).forEach((sec) => {
            (sec.lessons || []).forEach((les) => {
              allLessons.push(les);
            });
          });
          setLessons(allLessons);
          if (allLessons.length > 0 && !lessonId) {
            setLessonId(allLessons[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching course lessons:', err);
      }
    };
    fetchCourseDetails();
  }, [selectedCourseId]);

  // Load existing quiz details if lessonId is selected
  useEffect(() => {
    if (!lessonId) return;

    const fetchQuizByLesson = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/quizzes/lesson/${lessonId}`);
        if (response.data && response.data.success) {
          const qData = response.data.data;
          setExistingQuizId(qData._id);
          setTitle(qData.title || '');
          setDescription(qData.description || '');
          setPassingPercentage(qData.passingPercentage || qData.passingScore || 70);
          setTimeLimit(qData.timeLimit || 0);
          setMaxAttempts(qData.maxAttempts !== undefined ? qData.maxAttempts : 3);
          setShuffleQuestions(Boolean(qData.shuffleQuestions));
          setShuffleOptions(Boolean(qData.shuffleOptions));

          if (qData.questions && qData.questions.length > 0) {
            const formatted = qData.questions.map((q) => ({
              _id: q._id,
              questionText: q.questionText || '',
              options: q.options && q.options.length >= 2 ? q.options : ['', '', '', ''],
              correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0,
              marks: q.marks || 1,
              explanation: q.explanation || '',
            }));
            setQuestions(formatted);
          }

          // Fetch Analytics if existing quiz
          fetchQuizAnalytics(qData._id);
        }
      } catch (err) {
        // No quiz created yet for this lesson - reset form defaults
        setExistingQuizId(null);
        setTitle('');
        setDescription('');
        setPassingPercentage(70);
        setTimeLimit(15);
        setMaxAttempts(3);
        setShuffleQuestions(false);
        setShuffleOptions(false);
        setQuestions([
          {
            questionText: '',
            options: ['', '', '', ''],
            correctOption: 0,
            marks: 1,
            explanation: '',
          },
        ]);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizByLesson();
  }, [lessonId]);

  const fetchQuizAnalytics = async (qId) => {
    try {
      const response = await api.get(`/quizzes/${qId}/analytics`);
      if (response.data && response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching quiz analytics:', err);
    }
  };

  // Question handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('Quiz must contain at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index) => {
    const qToCopy = questions[index];
    const duplicated = {
      questionText: `${qToCopy.questionText} (Copy)`,
      options: [...(qToCopy.options || ['', '', '', ''])],
      correctOption: qToCopy.correctOption || 0,
      marks: qToCopy.marks || 1,
      explanation: qToCopy.explanation || '',
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
    toast.success(`Question #${index + 1} duplicated! 📋`);
  };

  const handleMoveQuestion = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;
    setQuestions(newQuestions);
  };

  const handleQuestionTextChange = (index, text) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctOption = oIndex;
    setQuestions(updated);
  };

  const handleMarksChange = (qIndex, marks) => {
    const updated = [...questions];
    updated[qIndex].marks = Math.max(1, Number(marks) || 1);
    setQuestions(updated);
  };

  const handleExplanationChange = (qIndex, exp) => {
    const updated = [...questions];
    updated[qIndex].explanation = exp;
    setQuestions(updated);
  };

  // Form Submission
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();

    if (!lessonId) {
      toast.error('Please select a lesson to attach this quiz');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      const validOptions = q.options.filter((opt) => opt.trim() !== '');
      if (validOptions.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 non-empty options`);
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        lessonId,
        courseId: selectedCourseId,
        title,
        description,
        passingPercentage: Number(passingPercentage),
        passingScore: Number(passingPercentage),
        timeLimit: Number(timeLimit),
        maxAttempts: Number(maxAttempts),
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        questions,
      };

      const response = await api.post('/quizzes', payload);
      if (response.data && response.data.success) {
        toast.success('Interactive Quiz saved & published to curriculum! 🎯');
        if (existingQuizId) {
          fetchQuizAnalytics(existingQuizId);
        } else if (response.data.data?._id) {
          setExistingQuizId(response.data.data._id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8 font-sans"
    >
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Assessment Creator • Interactive Quiz Studio
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Interactive Quiz Builder</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build single-answer MCQs, time-bound tests, attempt caps, and inspect student performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {existingQuizId && (
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'builder'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiList /> Quiz Builder
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiBarChart2 /> Analytics
              </button>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <FiArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* TAB 1: BUILDER */}
      {activeTab === 'builder' && (
        <form onSubmit={handleSubmitQuiz} className="space-y-8">
          {/* GENERAL CONFIGURATION CARD */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <FiSliders className="text-indigo-400" /> General Quiz Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Attach to Curriculum Lesson *
                </label>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Target Lesson</option>
                  {lessons.map((les) => (
                    <option key={les._id} value={les._id}>
                      {les.title} ({les.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quiz Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section 1 Knowledge Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instructions & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide instructions or background context for students before taking the quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* RULES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Passing Score</span>
                    <span className="text-indigo-400 font-bold">{passingPercentage}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(e.target.value)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <FiClock className="text-indigo-400" /> Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    placeholder="0 = Unlimited"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Set 0 for unlimited time</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <FiRepeat className="text-indigo-400" /> Maximum Attempts
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0 = Unlimited"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Set 0 for unlimited attempts</span>
                </div>
              </div>

              {/* TOGGLES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <FiShuffle className="text-indigo-400" /> Shuffle Questions order for each student
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <FiShuffle className="text-blue-400" /> Shuffle Answer Options for each question
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* DYNAMIC QUESTIONS MANAGER */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FiHelpCircle className="text-indigo-400" /> Questions List ({questions.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add unlimited single-answer questions with 4 editable options and correct answer selection.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                <FiPlus /> Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <motion.div
                  key={qIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 relative shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase">
                      Question #{qIdx + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(qIdx, 'up')}
                        disabled={qIdx === 0}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
                        title="Move Up"
                      >
                        <FiChevronUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(qIdx, 'down')}
                        disabled={qIdx === questions.length - 1}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
                        title="Move Down"
                      >
                        <FiChevronDown />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(qIdx)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg transition"
                        title="Duplicate Question"
                      >
                        <FiCopy />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition ml-1"
                        title="Delete Question"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Question Text & Marks */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Question Statement *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={`Enter question #${qIdx + 1} text...`}
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Marks / Weight
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={q.marks || 1}
                        onChange={(e) => handleMarksChange(qIdx, e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 4 Options with Radio Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Answer Options (Select radio button for the Correct Answer) *
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                            q.correctOption === oIdx
                              ? 'bg-indigo-600/10 border-indigo-500/50'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correctOption_${qIdx}`}
                            checked={q.correctOption === oIdx}
                            onChange={() => handleCorrectOptionChange(qIdx, oIdx)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-400 uppercase w-4">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="w-full bg-transparent text-sm text-white focus:outline-none"
                          />
                          {q.correctOption === oIdx && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Optional Explanation (Shown after submission)
                    </label>
                    <input
                      type="text"
                      placeholder="Why is this answer correct? Explain key concept..."
                      value={q.explanation || ''}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <FiPlus /> Add Another Question
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <FiSave /> {loading ? 'Saving Quiz...' : 'Save & Publish Interactive Quiz'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && existingQuizId && (
        <div className="space-y-6">
          {analyticsData ? (
            <>
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium">Total Student Attempts</span>
                  <p className="text-2xl font-extrabold text-white mt-1">
                    {analyticsData.totalAttempts}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium">Average Score</span>
                  <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                    {analyticsData.averageScore}%
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium">High / Low Score</span>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">
                    {analyticsData.highestScore}% /{' '}
                    <span className="text-rose-400">{analyticsData.lowestScore}%</span>
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium">Pass Rate / Fail Rate</span>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">
                    {analyticsData.passRate}% /{' '}
                    <span className="text-rose-400">{analyticsData.failRate}%</span>
                  </p>
                </div>
              </div>

              {/* Attempts Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiUserCheck className="text-indigo-400" /> Student Attempts History
                </h3>

                {analyticsData.attempts && analyticsData.attempts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3 rounded-l-xl">Student Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Marks</th>
                          <th className="p-3">Time Taken</th>
                          <th className="p-3">Result</th>
                          <th className="p-3 rounded-r-xl">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {analyticsData.attempts.map((att) => (
                          <tr key={att._id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-bold text-white">{att.studentName}</td>
                            <td className="p-3 text-slate-400">{att.studentEmail}</td>
                            <td className="p-3 font-extrabold text-indigo-300">
                              {att.scorePercentage}%
                            </td>
                            <td className="p-3 text-slate-300">
                              {att.obtainedMarks} / {att.totalMarks}
                            </td>
                            <td className="p-3 text-slate-400">
                              {Math.floor(att.timeTakenSeconds / 60)}m {att.timeTakenSeconds % 60}s
                            </td>
                            <td className="p-3">
                              {att.passed ? (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase text-[10px]">
                                  ✓ Passed
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold uppercase text-[10px]">
                                  ✕ Failed
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500">
                              {new Date(att.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No student attempts recorded for this quiz yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
              <p>Loading Quiz Analytics...</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CreateQuiz;
