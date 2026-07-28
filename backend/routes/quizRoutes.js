const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizByLesson,
  submitQuiz,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Instructor', 'Admin'), createQuiz);
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/:quizId/submit', protect, submitQuiz);

module.exports = router;
