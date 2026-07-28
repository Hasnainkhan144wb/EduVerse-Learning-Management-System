const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Lesson = require('../models/Lesson');

// @desc    Create a quiz with questions
// @route   POST /api/quizzes
// @access  Private (Instructor/Admin)
const createQuiz = async (req, res, next) => {
  try {
    const { lessonId, title, description, passingScore, questions } = req.body;

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

    // Create Quiz record
    const quiz = await Quiz.create({
      lessonId,
      title,
      description: description || '',
      passingScore: passingScore || 70,
      questions: [],
    });

    // If questions array provided, create Question models
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const createdQuestions = await Promise.all(
        questions.map(async (q) => {
          return await Question.create({
            quizId: quiz._id,
            questionText: q.questionText,
            type: q.type || 'MCQ',
            options: q.options || [],
            correctAnswers: q.correctAnswers,
            explanation: q.explanation || '',
          });
        })
      );

      quiz.questions = createdQuestions.map((q) => q._id);
      await quiz.save();
    }

    // Update lesson type to quiz
    lesson.type = 'quiz';
    await lesson.save();

    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');

    res.status(201).json({
      success: true,
      data: populatedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz and questions by lesson ID
// @route   GET /api/quizzes/lesson/:lessonId
// @access  Private/Public
const getQuizByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const quiz = await Quiz.findOne({ lessonId }).populate({
      path: 'questions',
      select: '-correctAnswers', // Hide correct answers for student view
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this lesson',
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers & calculate auto-score
// @route   POST /api/quizzes/:quizId/submit
// @access  Private
const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, answer }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers array',
      });
    }

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const resultsBreakdown = [];

    quiz.questions.forEach((question) => {
      const studentSubmission = answers.find(
        (a) => a.questionId === question._id.toString()
      );
      const studentAns = studentSubmission ? studentSubmission.answer : null;
      let isCorrect = false;

      if (studentAns !== null && studentAns !== undefined) {
        if (question.type === 'MCQ' || question.type === 'TrueFalse') {
          // Compare strings or numbers directly
          isCorrect =
            String(studentAns).trim().toLowerCase() ===
            String(question.correctAnswers).trim().toLowerCase();
        } else if (question.type === 'FillBlank') {
          // Handle string array or exact string match
          if (Array.isArray(question.correctAnswers)) {
            isCorrect = question.correctAnswers.some(
              (ca) => String(ca).trim().toLowerCase() === String(studentAns).trim().toLowerCase()
            );
          } else {
            isCorrect =
              String(studentAns).trim().toLowerCase() ===
              String(question.correctAnswers).trim().toLowerCase();
          }
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      resultsBreakdown.push({
        questionId: question._id,
        questionText: question.questionText,
        type: question.type,
        studentAnswer: studentAns,
        correctAnswer: question.correctAnswers,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const scorePercentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    const passed = scorePercentage >= quiz.passingScore;

    res.status(200).json({
      success: true,
      data: {
        quizId: quiz._id,
        quizTitle: quiz.title,
        totalQuestions,
        correctCount,
        scorePercentage,
        passingScore: quiz.passingScore,
        passed,
        breakdown: resultsBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizByLesson,
  submitQuiz,
};
