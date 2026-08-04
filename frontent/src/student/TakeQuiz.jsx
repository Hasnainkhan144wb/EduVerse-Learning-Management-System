import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiClock,
  FiHelpCircle,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiArrowRight,
  FiRotateCcw,
  FiAward,
  FiPlay,
  FiSend,
  FiAlertTriangle,
} from 'react-icons/fi';

const TakeQuiz = ({ quizId: propQuizId, lessonId: propLessonId, onQuizCompleted }) => {
  const { quizId: paramQuizId } = useParams();
  const navigate = useNavigate();
  const quizId = propQuizId || paramQuizId;

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student Answers Object { questionId: selectedOptionIndex }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const startTimeRef = useRef(null);

  // Fetch quiz details
  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      let response;
      if (quizId) {
        response = await api.get(`/quizzes/${quizId}`);
      } else if (propLessonId) {
        response = await api.get(`/quizzes/lesson/${propLessonId}`);
      }

      if (response && response.data && response.data.success) {
        const qData = response.data.data;
        setQuiz(qData);

        if (qData.timeLimit && qData.timeLimit > 0) {
          setTimeLeftSeconds(qData.timeLimit * 60);
        }
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      toast.error(err.response?.data?.message || 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId, propLessonId]);

  // Timer tick effect
  useEffect(() => {
    if (!quizStarted || timeLeftSeconds === null || quizResult) return;

    if (timeLeftSeconds <= 0) {
      toast.error('⏰ Time limit reached! Auto-submitting quiz assessment...');
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeftSeconds, quizResult]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    startTimeRef.current = Date.now();
  };

  const handleOptionSelect = (questionId, optionIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || submitting) return;

    try {
      setSubmitting(true);
      const timeTakenSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const formattedAnswers = (quiz.questions || []).map((q) => ({
        questionId: q._id,
        selectedOptionIndex:
          selectedAnswers[q._id] !== undefined ? selectedAnswers[q._id] : -1,
      }));

      const response = await api.post(`/quizzes/${quiz._id}/submit`, {
        answers: formattedAnswers,
        timeTakenSeconds,
      });

      if (response.data && response.data.success) {
        const resData = response.data.data;
        setQuizResult(resData);

        if (resData.passed) {
          toast.success('🎉 Congratulations! You passed the assessment!');
          if (onQuizCompleted) onQuizCompleted();
        } else {
          toast.error('Quiz attempt score below passing threshold.');
        }
      }
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      toast.error(err.response?.data?.message || 'Failed to submit quiz attempt');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl text-white font-sans space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading Interactive Quiz Assessment...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-white font-sans space-y-3">
        <FiAlertTriangle className="text-amber-400 text-4xl mx-auto" />
        <h3 className="text-lg font-bold">Quiz Not Configured Yet</h3>
        <p className="text-slate-400 text-sm">The instructor has not attached questions to this quiz lesson.</p>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const passingLimit = quiz.passingPercentage || quiz.passingScore || 70;

  // VIEW 1: START QUIZ LANDING SCREEN
  if (!quizStarted && !quizResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 max-w-3xl mx-auto font-sans shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl">
            <FiHelpCircle />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Interactive Assessment
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">{quiz.title}</h2>
          </div>
        </div>

        {quiz.description && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-sm">
            <p className="font-semibold text-slate-400 text-xs uppercase mb-1">Instructions:</p>
            <p className="whitespace-pre-line">{quiz.description}</p>
          </div>
        )}

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Total Questions</span>
            <span className="text-xl font-extrabold text-white">{questions.length}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Passing Threshold</span>
            <span className="text-xl font-extrabold text-indigo-400">{passingLimit}%</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Time Limit</span>
            <span className="text-xl font-extrabold text-slate-200">
              {quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'No Limit'}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Attempts Limit</span>
            <span className="text-xl font-extrabold text-slate-200">
              {quiz.maxAttempts > 0 ? `${quiz.maxAttempts} Attempts` : 'Unlimited'}
            </span>
          </div>
        </div>

        {/* START BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleStartQuiz}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <FiPlay /> Start Assessment Now
          </button>
        </div>
      </motion.div>
    );
  }

  // VIEW 2: ACTIVE QUIZ STEPPER (1 Question at a Time)
  if (quizStarted && !quizResult && currentQuestion) {
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isAnswered = selectedAnswers[currentQuestion._id] !== undefined;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 max-w-3xl mx-auto font-sans shadow-2xl"
      >
        {/* Top Stepper Header & Timer */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">{quiz.title}</h3>
          </div>

          {timeLeftSeconds !== null && (
            <div className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-indigo-400 font-mono font-bold text-sm">
              <FiClock className="animate-pulse" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Box */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-lg font-bold text-white leading-snug">
              {currentQuestionIndex + 1}. {currentQuestion.questionText}
            </h4>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg shrink-0">
              {currentQuestion.marks || 1} Pt{(currentQuestion.marks || 1) > 1 ? 's' : ''}
            </span>
          </div>

          {/* Radio Button Options List */}
          <div className="space-y-3 pt-2">
            {(currentQuestion.options || []).map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentQuestion._id] === oIdx;

              return (
                <label
                  key={oIdx}
                  onClick={() => handleOptionSelect(currentQuestion._id, oIdx)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-md text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${currentQuestion._id}`}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(currentQuestion._id, oIdx)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-400 uppercase w-4">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirstQuestion}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <FiArrowLeft /> Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              <FiSend /> {submitting ? 'Evaluating...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              Next <FiArrowRight />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // VIEW 3: RESULTS & BREAKDOWN SCREEN
  if (quizResult) {
    const timeTakenMin = Math.floor((quizResult.timeTakenSeconds || 0) / 60);
    const timeTakenSec = (quizResult.timeTakenSeconds || 0) % 60;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 max-w-3xl mx-auto font-sans shadow-2xl"
      >
        {/* Pass/Fail Status Banner */}
        <div
          className={`p-6 rounded-2xl border text-center space-y-3 ${
            quizResult.passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold bg-slate-950 border border-current shadow-lg">
            {quizResult.passed ? '🏆' : '❌'}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {quizResult.passed ? 'Assessment Passed Successfully!' : 'Assessment Attempt Failed'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Required Passing Threshold: <span className="font-bold text-white">{quizResult.passingScore}%</span>
            </p>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Percentage Score</span>
            <span className="text-2xl font-extrabold text-indigo-400">
              {quizResult.scorePercentage}%
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Correct Answers</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {quizResult.correctAnswersCount} / {quizResult.totalQuestions}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Wrong Answers</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {quizResult.wrongAnswersCount}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Obtained Marks</span>
            <span className="text-xl font-extrabold text-slate-200">
              {quizResult.obtainedMarks} / {quizResult.totalMarks}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Result Status</span>
            <span className={`text-xl font-extrabold ${quizResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {quizResult.passed ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block font-medium">Time Taken</span>
            <span className="text-xl font-extrabold text-slate-200">
              {timeTakenMin}m {timeTakenSec}s
            </span>
          </div>
        </div>

        {/* Detailed Questions Review Breakdown */}
        {quizResult.breakdown && quizResult.breakdown.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
              Question-by-Question Review Breakdown
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {quizResult.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    item.isCorrect
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                      : 'bg-rose-500/5 border-rose-500/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white text-sm">
                      #{idx + 1}. {item.questionText}
                    </span>
                    {item.isCorrect ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <FiCheckCircle /> Correct
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <FiXCircle /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold block">Your Choice:</span>
                      <span className={item.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {item.selectedOptionText || 'No answer'}
                      </span>
                    </div>

                    {!item.isCorrect && (
                      <div>
                        <span className="text-slate-400 font-semibold block">Correct Answer:</span>
                        <span className="text-emerald-400 font-bold">{item.correctOptionText}</span>
                      </div>
                    )}
                  </div>

                  {item.explanation && (
                    <p className="text-slate-400 italic pt-1 border-t border-slate-800/60">
                      💡 {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retry / Back Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => {
              setQuizResult(null);
              setQuizStarted(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <FiRotateCcw /> Retake Assessment
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default TakeQuiz;
