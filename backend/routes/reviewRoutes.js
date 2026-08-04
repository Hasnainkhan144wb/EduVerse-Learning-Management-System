const express = require('express');
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/course/:courseId', getCourseReviews);

module.exports = router;
