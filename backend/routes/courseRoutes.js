const express = require('express');
const router = express.Router();
const {
  getCourses,
  getPublishedCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCourseStatus,
  approveInstructor,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public course routes
router.get('/', getPublishedCourses || getCourses);
router.get('/:id', getCourseById);

// Instructor / Admin course CRUD routes
router.post('/', protect, authorize('Instructor', 'Admin'), createCourse);
router.put('/:id', protect, authorize('Instructor', 'Admin'), updateCourse);
router.delete('/:id', protect, authorize('Instructor', 'Admin'), deleteCourse);

// Section management routes
router.post('/:courseId/sections', protect, authorize('Instructor', 'Admin'), createSection);
router.put('/sections/:id', protect, authorize('Instructor', 'Admin'), updateSection);
router.delete('/sections/:id', protect, authorize('Instructor', 'Admin'), deleteSection);

// Lesson management routes
router.post('/sections/:sectionId/lessons', protect, authorize('Instructor', 'Admin'), createLesson);
router.put('/lessons/:id', protect, authorize('Instructor', 'Admin'), updateLesson);
router.delete('/lessons/:id', protect, authorize('Instructor', 'Admin'), deleteLesson);

// Admin approval routes
router.put('/:id/status', protect, authorize('Admin'), updateCourseStatus);
router.put('/admin/users/:id/approve', protect, authorize('Admin'), approveInstructor);

module.exports = router;
