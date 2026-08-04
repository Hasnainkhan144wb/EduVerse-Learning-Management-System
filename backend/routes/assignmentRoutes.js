const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createAssignment,
  getAssignmentByLesson,
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  gradeSubmission,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Storage configuration for assignments
const assignmentsDir = path.join(__dirname, '../uploads/assignments');
if (!fs.existsSync(assignmentsDir)) {
  fs.mkdirSync(assignmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Fail-safe upload middleware accepting 'file' or any field name cleanly
const handleAssignmentUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('🔥 Multer Error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    // Set req.file to first file if req.files exists
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/', protect, authorize('Instructor', 'Admin'), createAssignment);
router.get('/my-submissions', protect, getMySubmissions);
router.get('/lesson/:lessonId', protect, getAssignmentByLesson);
router.post('/submit', protect, handleAssignmentUpload, submitAssignment);
router.post(
  '/:assignmentId/submit',
  protect,
  handleAssignmentUpload,
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
