const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const Lesson = require('../models/Lesson');
const Enrolment = require('../models/Enrolment');

// @desc    Create or Update a Quiz with questions
// @route   POST /api/quizzes
// @access  Private (Instructor/Admin)
const createQuiz = async (req, res, next) => {
  try {
    const {
      lessonId,
      courseId,
      title,
      description,
      passingPercentage,
      passingScore,
      timeLimit,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      questions,
    } = req.body;

    if (!lessonId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lessonId and title for the quiz',
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const finalPassingPercentage =
      passingPercentage !== undefined ? Number(passingPercentage) : (passingScore !== undefined ? Number(passingScore) : 70);

    // Find existing quiz for lesson or create new
    let quiz = await Quiz.findOne({ lessonId });

    if (quiz) {
      quiz.title = title;
      quiz.description = description || '';
      quiz.passingPercentage = finalPassingPercentage;
      quiz.passingScore = finalPassingPercentage;
      quiz.timeLimit = timeLimit !== undefined ? Number(timeLimit) : 0;
      quiz.maxAttempts = maxAttempts !== undefined ? Number(maxAttempts) : 3;
      quiz.shuffleQuestions = Boolean(shuffleQuestions);
      quiz.shuffleOptions = Boolean(shuffleOptions);
      if (courseId || lesson.courseId) {
        quiz.courseId = courseId || lesson.courseId;
      }
    } else {
      quiz = new Quiz({
        lessonId,
        courseId: courseId || lesson.courseId,
        title,
        description: description || '',
        passingPercentage: finalPassingPercentage,
        passingScore: finalPassingPercentage,
        timeLimit: timeLimit !== undefined ? Number(timeLimit) : 0,
        maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 3,
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        questions: [],
      });
    }

    await quiz.save();

    // Remove existing questions for this quiz to replace with clean list
    await QuizQuestion.deleteMany({ quizId: quiz._id });

    // Process questions array if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const createdQuestions = await Promise.all(
        questions.map(async (q, index) => {
          // Process options array
          let cleanOptions = [];
          if (Array.isArray(q.options)) {
            cleanOptions = q.options.map((opt) => String(opt).trim()).filter((opt) => opt !== '');
          }
          if (cleanOptions.length < 2) {
            cleanOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
          }

          let correctIdx = 0;
          if (q.correctOption !== undefined && q.correctOption !== null && !isNaN(q.correctOption)) {
            correctIdx = Number(q.correctOption);
          } else if (q.correctAnswers !== undefined && q.correctAnswers !== null) {
            const parsed = parseInt(q.correctAnswers, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < cleanOptions.length) {
              correctIdx = parsed;
            } else {
              const matchedIdx = cleanOptions.findIndex(
                (opt) => opt.toLowerCase() === String(q.correctAnswers).trim().toLowerCase()
              );
              if (matchedIdx !== -1) correctIdx = matchedIdx;
            }
          }

          if (correctIdx < 0 || correctIdx >= cleanOptions.length) {
            correctIdx = 0;
          }

          return await QuizQuestion.create({
            quizId: quiz._id,
            questionText: q.questionText || `Question ${index + 1}`,
            options: cleanOptions,
            correctOption: correctIdx,
            correctAnswers: cleanOptions[correctIdx] || '',
            marks: q.marks !== undefined ? Math.max(1, Number(q.marks)) : 1,
            explanation: q.explanation || '',
            order: index + 1,
          });
        })
      );

      quiz.questions = createdQuestions.map((q) => q._id);
      await quiz.save();
    }

    // Ensure lesson type is quiz
    lesson.type = 'quiz';
    await lesson.save();

    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');

    res.status(200).json({
      success: true,
      message: 'Quiz configured successfully',
      data: populatedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz and questions by lesson ID
// @route   GET /api/quizzes/lesson/:lessonId
// @access  Private
const getQuizByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?._id;
    const isInstructorOrAdmin =
      req.user?.role === 'Instructor' || req.user?.role === 'Admin';

    const quiz = await Quiz.findOne({ lessonId }).populate('questions');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this lesson',
      });
    }

    // Fetch previous user attempts if student
    let attempts = [];
    if (userId) {
      attempts = await QuizAttempt.find({ quizId: quiz._id, studentId: userId }).sort(
        '-createdAt'
      );
    }

    const quizObj = quiz.toObject();

    // If student, sanitize correct options and explanations to prevent cheating in inspector
    if (!isInstructorOrAdmin) {
      quizObj.questions = (quizObj.questions || []).map((q) => {
        const { correctOption, correctAnswers, explanation, ...studentQuestion } = q;
        return studentQuestion;
      });
    }

    // Attach student attempts metadata
    const userAttemptsCount = attempts.length;
    const bestAttempt = attempts.reduce(
      (best, current) =>
        !best || current.scorePercentage > best.scorePercentage ? current : best,
      null
    );
    const hasPassed = attempts.some((att) => att.passed);

    res.status(200).json({
      success: true,
      data: {
        ...quizObj,
        userAttemptsCount,
        remainingAttempts:
          quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - userAttemptsCount) : 'Unlimited',
        hasPassed,
        bestAttempt,
        attempts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz details by quiz ID
// @route   GET /api/quizzes/:quizId
// @access  Private
const getQuizById = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const isInstructorOrAdmin =
      req.user?.role === 'Instructor' || req.user?.role === 'Admin';

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const quizObj = quiz.toObject();
    if (!isInstructorOrAdmin) {
      quizObj.questions = (quizObj.questions || []).map((q) => {
        const { correctOption, correctAnswers, explanation, ...studentQuestion } = q;
        return studentQuestion;
      });
    }

    res.status(200).json({
      success: true,
      data: quizObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers, calculate score, record attempt & update enrolment progress
// @route   POST /api/quizzes/:quizId/submit
// @access  Private (Student/Enrolled User)
const submitQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId || req.body.quizId;
    const { answers, timeTakenSeconds } = req.body; // answers: [{ questionId, selectedOptionIndex }]
    const userId = req.user._id;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide quizId for submission',
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid answers array',
      });
    }

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Check maximum attempts limit
    if (quiz.maxAttempts > 0) {
      const attemptCount = await QuizAttempt.countDocuments({
        quizId: quiz._id,
        studentId: userId,
      });
      if (attemptCount >= quiz.maxAttempts) {
        return res.status(400).json({
          success: false,
          message: `Maximum attempt limit (${quiz.maxAttempts}) reached for this quiz.`,
        });
      }
    }

    let totalMarks = 0;
    let obtainedMarks = 0;
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;
    const userAnswersList = [];

    quiz.questions.forEach((question) => {
      const qMarks = question.marks || 1;
      totalMarks += qMarks;

      const submission = answers.find(
        (a) => String(a.questionId) === String(question._id)
      );

      let selectedIdx = -1;
      let selectedText = 'No answer provided';

      if (submission !== undefined && submission !== null) {
        if (typeof submission.selectedOptionIndex === 'number') {
          selectedIdx = submission.selectedOptionIndex;
        } else if (typeof submission.answer === 'number') {
          selectedIdx = submission.answer;
        } else if (typeof submission.answer === 'string') {
          const parsed = parseInt(submission.answer, 10);
          if (!isNaN(parsed)) {
            selectedIdx = parsed;
          } else {
            selectedIdx = (question.options || []).findIndex(
              (opt) => opt.toLowerCase() === String(submission.answer).trim().toLowerCase()
            );
          }
        }
      }

      if (selectedIdx >= 0 && question.options[selectedIdx] !== undefined) {
        selectedText = question.options[selectedIdx];
      }

      const isCorrect = selectedIdx === question.correctOption;

      if (isCorrect) {
        correctAnswersCount++;
        obtainedMarks += qMarks;
      } else {
        wrongAnswersCount++;
      }

      userAnswersList.push({
        questionId: question._id,
        questionText: question.questionText,
        selectedOptionIndex: selectedIdx,
        selectedOptionText: selectedText,
        correctOptionIndex: question.correctOption,
        correctOptionText: question.options[question.correctOption] || '',
        isCorrect,
        marksObtained: isCorrect ? qMarks : 0,
        explanation: question.explanation || '',
      });
    });

    const totalQuestions = quiz.questions.length;
    const scorePercentage =
      totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const passingThreshold = quiz.passingPercentage || quiz.passingScore || 70;
    const passed = scorePercentage >= passingThreshold;

    // Record attempt in DB
    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: userId,
      lessonId: quiz.lessonId,
      courseId: quiz.courseId,
      totalQuestions,
      correctAnswersCount,
      wrongAnswersCount,
      obtainedMarks,
      totalMarks,
      scorePercentage,
      passingScore: passingThreshold,
      passed,
      timeTakenSeconds: timeTakenSeconds || 0,
      userAnswers: userAnswersList,
    });

    // Auto update student course enrolment completedLessons if passed
    if (passed && quiz.lessonId) {
      try {
        const lesson = await Lesson.findById(quiz.lessonId);
        const courseIdToUse = quiz.courseId || (lesson ? lesson.courseId : null);

        if (courseIdToUse) {
          const enrolment = await Enrolment.findOne({
            student: userId,
            course: courseIdToUse,
          });

          if (enrolment) {
            const lessonIdStr = String(quiz.lessonId);
            if (!enrolment.completedLessons.map(String).includes(lessonIdStr)) {
              enrolment.completedLessons.push(quiz.lessonId);
              await enrolment.save();
            }
          }
        }
      } catch (err) {
        console.error('Error updating enrolment progress on quiz pass:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: passed
        ? 'Congratulations! You passed the quiz! 🏆'
        : 'Quiz attempt completed. Score below passing threshold.',
      data: {
        attemptId: attempt._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        totalQuestions,
        correctAnswersCount,
        wrongAnswersCount,
        obtainedMarks,
        totalMarks,
        scorePercentage,
        passingScore: passingThreshold,
        passed,
        timeTakenSeconds: attempt.timeTakenSeconds,
        breakdown: userAnswersList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get instructor analytics for a quiz
// @route   GET /api/quizzes/:quizId/analytics
// @access  Private (Instructor/Admin)
const getQuizAnalytics = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const attempts = await QuizAttempt.find({ quizId })
      .populate('studentId', 'name email avatar')
      .sort('-createdAt');

    const totalAttempts = attempts.length;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let passedCount = 0;

    if (totalAttempts > 0) {
      const totalScore = attempts.reduce((acc, att) => acc + att.scorePercentage, 0);
      averageScore = Math.round(totalScore / totalAttempts);
      highestScore = Math.max(...attempts.map((att) => att.scorePercentage));
      lowestScore = Math.min(...attempts.map((att) => att.scorePercentage));
      passedCount = attempts.filter((att) => att.passed).length;
    }

    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    const failRate = totalAttempts > 0 ? 100 - passRate : 0;

    res.status(200).json({
      success: true,
      data: {
        quizTitle: quiz.title,
        totalQuestions: (quiz.questions || []).length,
        passingPercentage: quiz.passingPercentage || quiz.passingScore,
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
        passedCount,
        failedCount: totalAttempts - passedCount,
        passRate,
        failRate,
        attempts: attempts.map((att) => ({
          _id: att._id,
          studentName: att.studentId?.name || 'Unknown Student',
          studentEmail: att.studentId?.email || '',
          scorePercentage: att.scorePercentage,
          obtainedMarks: att.obtainedMarks,
          totalMarks: att.totalMarks,
          passed: att.passed,
          timeTakenSeconds: att.timeTakenSeconds,
          date: att.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizByLesson,
  getQuizById,
  submitQuiz,
  getQuizAnalytics,
};
