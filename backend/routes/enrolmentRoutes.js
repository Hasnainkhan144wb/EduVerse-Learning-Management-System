const express = require('express');
const router = express.Router();
const {
  enrolStudent,
  getMyEnrolments,
  getEnrolmentProgress,
  markLessonComplete,
} = require('../controllers/enrolmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/progress', protect, markLessonComplete);
router.get('/my-courses', protect, getMyEnrolments);
router.get('/course/:courseId', protect, getEnrolmentProgress);
router.post('/:courseId', protect, enrolStudent);

module.exports = router;
