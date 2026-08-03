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
} from 'react-icons/fi';

const CreateQuiz = () => {
  const { lessonId: paramLessonId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(paramLessonId || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimit, setTimeLimit] = useState(15);
  const [loading, setLoading] = useState(false);

  // Questions Array
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswers: '0',
      explanation: '',
    },
  ]);

  // Load instructor's published courses
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
        console.error('Error fetching courses for quiz setup');
      }
    };
    fetchCourses();
  }, []);

  // Fetch sections & lessons whenever course selected
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
        console.error('Error fetching lessons');
      }
    };
    fetchCourseDetails();
  }, [selectedCourseId]);

  // Question manipulation handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        type: 'MCQ',
        options: ['', '', '', ''],
        correctAnswers: '0',
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;

    // Reset default options if type changes
    if (field === 'type') {
      if (value === 'MCQ') {
        updated[index].options = ['', '', '', ''];
        updated[index].correctAnswers = '0';
      } else if (value === 'TrueFalse') {
        updated[index].options = ['True', 'False'];
        updated[index].correctAnswers = 'True';
      } else if (value === 'FillBlank') {
        updated[index].options = [];
        updated[index].correctAnswers = '';
      }
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();

    if (!lessonId) {
      toast.error('Please select a lesson for this quiz');
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
      if (q.type === 'MCQ') {
        if (q.options.some((opt) => !opt.trim())) {
          toast.error(`All 4 options for Question ${i + 1} are required`);
          return;
        }
      } else if (q.type === 'FillBlank') {
        if (!q.correctAnswers.trim()) {
          toast.error(`Correct answer for Question ${i + 1} is required`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      const formattedQuestions = questions.map((q) => {
        if (q.type === 'MCQ') {
          const correctOptionText = q.options[parseInt(q.correctAnswers, 10)] || q.options[0];
          return {
            ...q,
            correctAnswers: correctOptionText,
          };
        }
        return q;
      });

      const payload = {
        lessonId,
        title,
        description,
        passingScore: Number(passingScore),
        questions: formattedQuestions,
      };

      const response = await api.post('/quizzes', payload);
      if (response.data.success) {
        toast.success('Quiz created & attached to lesson successfully! 🎯');
        navigate(-1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
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
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Assessment Creator
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Create Interactive Quiz</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build MCQs, True/False, and Fill-in-the-Blank questions with automated scoring.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmitQuiz} className="space-y-8">
        {/* QUIZ SETTINGS CARD */}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Attach to Lesson *</label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Lesson</option>
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
                placeholder="e.g. End of Section 1 Knowledge Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Instructions & Description</label>
              <textarea
                rows={2}
                placeholder="Instructions for students taking this test..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Passing Score Threshold ({passingScore}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC QUESTION BUILDER */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiHelpCircle className="text-indigo-400" /> Question Builder ({questions.length} Questions)
            </h2>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <FiPlus /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Question #{qIndex + 1}
                </span>

                <div className="flex items-center gap-3">
                  <select
                    value={q.type}
                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TrueFalse">True / False</option>
                    <option value="FillBlank">Fill in the Blank</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Remove Question"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Question Prompt *</label>
                <input
                  type="text"
                  required
                  placeholder={`Question ${qIndex + 1} text...`}
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* TYPE 1: MCQ OPTIONS */}
              {q.type === 'MCQ' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    MCQ Options & Select Correct Option
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={String(q.correctAnswers) === String(oIndex)}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswers', String(oIndex))}
                          className="accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TYPE 2: TRUE / FALSE */}
              {q.type === 'TrueFalse' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">Select Correct Statement</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name={`tf_${qIndex}`}
                        checked={q.correctAnswers === 'True'}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswers', 'True')}
                        className="accent-indigo-500 w-4 h-4"
                      />
                      True
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name={`tf_${qIndex}`}
                        checked={q.correctAnswers === 'False'}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswers', 'False')}
                        className="accent-indigo-500 w-4 h-4"
                      />
                      False
                    </label>
                  </div>
                </div>
              )}

              {/* TYPE 3: FILL IN THE BLANK */}
              {q.type === 'FillBlank' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Exact Correct Answer String *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Exact answer expected from student..."
                    value={q.correctAnswers}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswers', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Explanation Note */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Optional answer explanation / feedback note..."
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
        >
          <FiSave className="w-5 h-5" />
          {loading ? 'Saving Quiz Schema...' : 'Save & Publish Quiz Assessment'}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateQuiz;
