const express = require('express');
const router = express.Router();
const { getInstructorDashboardStats } = require('../controllers/instructorController');
const { getInstructorStudents } = require('../controllers/enrolmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protected Instructor Routes
router.get(
  '/dashboard-stats',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorDashboardStats
);

router.get(
  '/students',
  protect,
  authorize('Instructor', 'Admin'),
  getInstructorStudents
);

module.exports = router;
