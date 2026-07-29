import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiClock,
  FiHelpCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiAward,
  FiRotateCcw,
  FiSend,
} from 'react-icons/fi';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stepper state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: answerString }

  // Countdown timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const timerRef = useRef(null);

  // Evaluation Result state
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/quizzes/${quizId}`);
        if (response.data.success) {
          const quizData = response.data.data;
          setQuiz(quizData);

          // Initialize timer if timeLimit (minutes) exists
          if (quizData.timeLimit && quizData.timeLimit > 0) {
            setTimeLeftSeconds(quizData.timeLimit * 60);
          }
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        toast.error('Failed to load quiz questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  // Countdown timer tick
  useEffect(() => {
    if (timeLeftSeconds === null || quizResult) return;

    if (timeLeftSeconds <= 0) {
      toast.error('Time limit reached! Auto-submitting quiz...');
      handleSubmitQuiz();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeftSeconds, quizResult]);

  const handleAnswerSelect = (questionId, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const formattedAnswers = (quiz.questions || []).map((q) => ({
      questionId: q._id,
      answer: userAnswers[q._id] || '',
    }));

    try {
      setSubmitting(true);
      const response = await api.post(`/quizzes/${quiz._id}/submit`, {
        answers: formattedAnswers,
      });

      if (response.data.success) {
        setQuizResult(response.data.data);
        if (response.data.data.passed) {
          toast.success('Congratulations! You passed the quiz! 🏆');
        } else {
          toast.error('Quiz score below passing score limit.');
        }
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error(err.response?.data?.message || 'Failed to submit quiz attempt');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '--:--';
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Preparing Quiz Assessment...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Quiz Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 rounded-xl text-xs font-bold mt-4">
          Return Back
        </button>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
      >
        {/* Top Header & Timer */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              EduVerse Examination Engine
            </span>
            <h1 className="text-xl font-extrabold text-white">{quiz.title}</h1>
          </div>

          {timeLeftSeconds !== null && !quizResult && (
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-bold text-sm ${
                timeLeftSeconds < 120
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                  : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30'
              }`}
            >
              <FiClock /> {formatTime(timeLeftSeconds)}
            </div>
          )}
        </div>

        {!quizResult ? (
          /* ACTIVE QUIZ STEPPER */
          <div className="space-y-6">
            {/* Question Progress Tracker */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Progress
              </span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Prompt Card */}
            {currentQuestion ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-500/30">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <h3 className="text-base font-bold text-white leading-relaxed">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.options.map((opt, oIdx) => {
                      const isSelected = userAnswers[currentQuestion._id] === opt;
                      return (
                        <label
                          key={oIdx}
                          onClick={() => handleAnswerSelect(currentQuestion._id, opt)}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQuestion._id}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* True / False Selection */}
                {currentQuestion.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {['True', 'False'].map((tfVal) => {
                      const isSelected = userAnswers[currentQuestion._id] === tfVal;
                      return (
                        <button
                          key={tfVal}
                          onClick={() => handleAnswerSelect(currentQuestion._id, tfVal)}
                          className={`py-4 px-6 rounded-2xl border font-extrabold text-sm transition ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {tfVal}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the Blank Input */}
                {currentQuestion.type === 'fill_blank' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Type your answer below:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter answer string..."
                      value={userAnswers[currentQuestion._id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            ) : null}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <FiArrowLeft /> Previous
              </button>

              {!isLastQuestion ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
                >
                  Next <FiArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
                >
                  <FiSend /> {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* INSTANT RESULT SCORE CARD */
          <div className="space-y-6 text-center py-4">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-4xl font-extrabold border-2 shadow-2xl ${
                quizResult.passed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                  : 'bg-red-500/10 text-red-400 border-red-500/40'
              }`}
            >
              {quizResult.passed ? '🏆' : '❌'}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {quizResult.passed ? 'Quiz Passed Successfully!' : 'Quiz Attempt Failed'}
              </h2>
              <p className="text-xs text-slate-400">
                Passing limit score required: <span className="font-bold text-white">{quizResult.passingScore}%</span>
              </p>
            </div>

            {/* Scorecard Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Score</p>
                <p className="text-xl font-extrabold text-white">{quizResult.scorePercentage}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Earned Marks</p>
                <p className="text-xl font-extrabold text-indigo-400">{quizResult.obtainedMarks}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Marks</p>
                <p className="text-xl font-extrabold text-slate-300">{quizResult.totalMarks}</p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setQuizResult(null);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                  if (quiz.timeLimit) setTimeLeftSeconds(quiz.timeLimit * 60);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <FiRotateCcw /> Retake Quiz
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                Return to Course Player <FiArrowRight />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TakeQuiz;
