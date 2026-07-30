const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/adminAuthController');
const {
  getDashboardStats,
  getPendingUsers,
  approveUserAccount,
  rejectUserAccount,
  getAdminNotifications,
  getPlatformAnalytics,
  getFinancialReport,
  getUsersReport,
  getCoursesReport,
  getSettings,
  updateSettings,
  getAdminUsers,
  updateUserRole,
  approveInstructor,
  deleteUser,
  getAdminCourses,
  updateCourseStatus,
  getAdminCategories,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public Isolated Admin Login Route
router.post('/login', adminLogin);

// Protected Admin Routes (Strictly Enforced by requireAdmin Middleware)
router.get('/dashboard-stats', requireAdmin, getDashboardStats);
router.get('/pending-users', requireAdmin, getPendingUsers);
router.get('/notifications', requireAdmin, getAdminNotifications);
router.get('/analytics', requireAdmin, getPlatformAnalytics);
router.get('/reports/financial', requireAdmin, getFinancialReport);
router.get('/reports/users', requireAdmin, getUsersReport);
router.get('/reports/courses', requireAdmin, getCoursesReport);
router.get('/settings', requireAdmin, getSettings);
router.put('/settings', requireAdmin, updateSettings);
router.get('/users', requireAdmin, getAdminUsers);
router.patch('/users/:id/role', requireAdmin, updateUserRole);
router.patch('/users/:id/approve', requireAdmin, approveUserAccount);
router.patch('/users/:id/approve-instructor', requireAdmin, approveInstructor);
router.patch('/users/:id/reject', requireAdmin, rejectUserAccount);
router.delete('/users/:id', requireAdmin, deleteUser);
router.get('/courses', requireAdmin, getAdminCourses);
router.patch('/courses/:id/status', requireAdmin, updateCourseStatus);
router.get('/categories', requireAdmin, getAdminCategories);

module.exports = router;
