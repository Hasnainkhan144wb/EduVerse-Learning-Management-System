const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/adminAuthController');
const {
  getDashboardStats,
  getAdminUsers,
  approveInstructor,
  getAdminCourses,
  updateCourseStatus,
  getAdminCategories,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public Isolated Admin Login Route
router.post('/login', adminLogin);

// Protected Admin Routes (Strictly Enforced by requireAdmin Middleware)
router.get('/dashboard-stats', requireAdmin, getDashboardStats);
router.get('/users', requireAdmin, getAdminUsers);
router.patch('/users/:id/approve-instructor', requireAdmin, approveInstructor);
router.get('/courses', requireAdmin, getAdminCourses);
router.patch('/courses/:id/status', requireAdmin, updateCourseStatus);
router.get('/categories', requireAdmin, getAdminCategories);

module.exports = router;
