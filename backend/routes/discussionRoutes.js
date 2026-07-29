const express = require('express');
const router = express.Router();
const {
  getInstructorQuestions,
  replyQuestion,
  createQuestion,
} = require('../controllers/discussionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/instructor', protect, authorize('Instructor', 'Admin'), getInstructorQuestions);
router.post('/:id/reply', protect, authorize('Instructor', 'Admin'), replyQuestion);
router.post('/', protect, createQuestion);

module.exports = router;
