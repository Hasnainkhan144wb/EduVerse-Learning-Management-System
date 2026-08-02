const express = require('express');
const router = express.Router();
const {
  createQuestion,
  getStudentQuestions,
  getInstructorQuestions,
  replyQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createQuestion);
router.get('/student', protect, getStudentQuestions);
router.get('/instructor', protect, authorize('Instructor', 'Admin'), getInstructorQuestions);
router.patch('/:id/reply', protect, authorize('Instructor', 'Admin'), replyQuestion);
router.post('/:id/reply', protect, authorize('Instructor', 'Admin'), replyQuestion);

module.exports = router;
