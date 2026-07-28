const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignmentByLesson,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

router.post('/', protect, authorize('Instructor', 'Admin'), createAssignment);
router.get('/lesson/:lessonId', protect, getAssignmentByLesson);
router.post(
  '/:assignmentId/submit',
  protect,
  uploadSingle('assignment'),
  submitAssignment
);
router.get(
  '/:assignmentId/submissions',
  protect,
  authorize('Instructor', 'Admin'),
  getAssignmentSubmissions
);
router.put(
  '/submissions/:submissionId/grade',
  protect,
  authorize('Instructor', 'Admin'),
  gradeSubmission
);

module.exports = router;
