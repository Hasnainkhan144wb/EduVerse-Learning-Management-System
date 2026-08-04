import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FiHelpCircle,
  FiCheckCircle,
  FiClock,
  FiRepeat,
  FiSliders,
  FiEdit,
  FiCheck,
  FiAlertTriangle,
  FiBookOpen,
  FiAward,
} from 'react-icons/fi';

const InstructorQuizPreview = ({ lessonId, quizId: propQuizId, onClose }) => {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        let response;
        if (lessonId) {
          response = await api.get(`/quizzes/lesson/${lessonId}`);
        } else if (propQuizId) {
          response = await api.get(`/quizzes/${propQuizId}`);
        }

        if (response && response.data && response.data.success) {
          setQuiz(response.data.data);
        } else {
          setQuiz(null);
          setErrorMessage('No quiz has been configured for this lesson.');
        }
      } catch (err) {
        console.error('Error loading quiz for preview:', err);
        setQuiz(null);
        setErrorMessage('No quiz has been configured for this lesson.');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId || propQuizId) {
      fetchQuizData();
    } else {
      setLoading(false);
      setErrorMessage('No lesson ID provided for quiz preview.');
    }
  }, [lessonId, propQuizId]);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4 font-sans text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Fetching Saved Quiz Module...</p>
      </div>
    );
  }

  // IF QUIZ DOESN'T EXIST OR HAS NO QUESTIONS
  if (!quiz || errorMessage || !quiz.questions || quiz.questions.length === 0) {
    const targetLessonId = lessonId || quiz?.lessonId;

    return (
      <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-sans text-white">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto">
          <FiAlertTriangle />
        </div>
        <div>
          <h3 className="text-lg font-bold">No Quiz Configured</h3>
          <p className="text-slate-400 text-xs mt-1">
            No interactive quiz questions have been created for this lesson yet.
          </p>
        </div>

        {targetLessonId && (
          <div className="pt-2">
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate(`/instructor/quizzes/create/${targetLessonId}`);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-1.5 transition"
            >
              <FiEdit /> Configure Quiz Questions ↗
            </button>
          </div>
        )}
      </div>
    );
  }

  const questions = quiz.questions || [];
  const passingLimit = quiz.passingPercentage || quiz.passingScore || 70;
  const totalMarksSum = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white font-sans space-y-6">
      {/* QUIZ HEADER & METRICS SUMMARY CARD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-lg">
              <FiHelpCircle />
            </span>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Instructor Read-Only Preview
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{quiz.title}</h2>
            </div>
          </div>

          {lessonId && (
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate(`/instructor/quizzes/create/${lessonId}`);
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <FiEdit className="w-3.5 h-3.5" /> Edit Quiz
            </button>
          )}
        </div>

        {quiz.description && (
          <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
            <span className="font-semibold text-slate-400 block mb-0.5">Instructions:</span>
            {quiz.description}
          </p>
        )}

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block">Total Questions</span>
            <span className="text-base font-extrabold text-white">{questions.length}</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block">Passing Score</span>
            <span className="text-base font-extrabold text-indigo-400">{passingLimit}%</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block">Total Marks</span>
            <span className="text-base font-extrabold text-emerald-400">{totalMarksSum} Pts</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block">Time Limit</span>
            <span className="text-base font-extrabold text-slate-200">
              {quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'Unlimited'}
            </span>
          </div>
        </div>
      </div>

      {/* READ-ONLY QUESTIONS LIST */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <FiBookOpen className="text-indigo-400" /> Questions Breakdown ({questions.length})
        </h3>

        {questions.map((q, qIdx) => (
          <div
            key={q._id || qIdx}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 relative shadow-md"
          >
            {/* Question Header & Marks */}
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-sm font-bold text-white leading-snug">
                Question {qIdx + 1}: {q.questionText}
              </h4>
              <span className="text-[11px] font-extrabold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg shrink-0">
                {q.marks || 1} Pt{(q.marks || 1) > 1 ? 's' : ''}
              </span>
            </div>

            {/* 4 Options with Correct Answer Highlight */}
            <div className="space-y-2 pt-1">
              {(q.options || []).map((opt, oIdx) => {
                const isCorrect =
                  q.correctOption === oIdx ||
                  (q.correctAnswers &&
                    String(q.correctAnswers).trim().toLowerCase() === String(opt).trim().toLowerCase());

                return (
                  <div
                    key={oIdx}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium select-none ${
                      isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-400 uppercase w-4">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <FiCheckCircle className="shrink-0" /> ✓ Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional Explanation */}
            {q.explanation && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 italic flex items-start gap-1.5">
                <span className="not-italic text-amber-400">💡 Explanation:</span>
                <span>{q.explanation}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorQuizPreview;
