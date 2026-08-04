const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizByLesson,
  getQuizById,
  submitQuiz,
  getQuizAnalytics,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Instructor', 'Admin'), createQuiz);
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.get('/:quizId', protect, getQuizById);
router.get('/:quizId/analytics', protect, authorize('Instructor', 'Admin'), getQuizAnalytics);
router.post('/:quizId/submit', protect, submitQuiz);

module.exports = router;
