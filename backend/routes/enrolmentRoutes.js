const express = require('express');
const router = express.Router();
const {
  enrolStudent,
  getMyEnrolments,
  getEnrolmentProgress,
  markLessonComplete,
  trackLearningTime,
  getInstructorStudents,
} = require('../controllers/enrolmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/progress', protect, markLessonComplete);
router.post('/track-time', protect, trackLearningTime);
router.get('/my-courses', protect, getMyEnrolments);
router.get('/instructor/students', protect, authorize('Instructor', 'Admin'), getInstructorStudents);
router.get('/course/:courseId', protect, getEnrolmentProgress);
router.post('/:courseId', protect, enrolStudent);

module.exports = router;
