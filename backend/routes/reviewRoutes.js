const express = require('express');
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getReviewStatus,
  getCourseReviews,
} = require('../controllers/reviewController');
const { protect, protectOptional } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/can-review/:courseId', protectOptional, getReviewStatus);
router.get('/review-status/:courseId', protectOptional, getReviewStatus);
router.get('/course/:courseId', protectOptional, getCourseReviews);

module.exports = router;
