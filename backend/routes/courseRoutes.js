const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
const { getCourseReviews, getReviewStatus } = require('../controllers/reviewController');
const { protect, protectOptional, authorize } = require('../middleware/authMiddleware');
const { validateCourseInput } = require('../middleware/validateCourse');

// Storage configuration for course thumbnails
const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `thumbnail-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const handleCourseUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('🔥 Multer Error in Course Route:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    if (req.file) {
      req.body.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }
    next();
  });
};

// Public course routes
router.get('/published', getPublishedCourses);
router.get('/', getPublishedCourses || getCourses);
router.get('/:id', getCourseById);
router.get('/:courseId/reviews', protectOptional, getCourseReviews);
router.get('/:courseId/review-status', protectOptional, getReviewStatus);

// Instructor / Admin course CRUD routes with file upload support
router.post('/', protect, authorize('Instructor', 'Admin'), handleCourseUpload, validateCourseInput, createCourse);
router.put('/:id', protect, authorize('Instructor', 'Admin'), handleCourseUpload, validateCourseInput, updateCourse);
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
