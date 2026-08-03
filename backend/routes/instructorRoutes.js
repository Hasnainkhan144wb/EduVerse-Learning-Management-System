const express = require('express');
const router = express.Router();
const {
  getInstructorDashboardStats,
  getInstructorAnalytics,
  getInstructorCourses,
} = require('../controllers/instructorController');
const { getInstructorStudents } = require('../controllers/enrolmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protected Instructor Routes
router.get(
  '/courses',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorCourses
);

router.get(
  '/dashboard-stats',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorDashboardStats
);

router.get(
  '/analytics',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorAnalytics
);

router.get(
  '/students',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorStudents
);

module.exports = router;
