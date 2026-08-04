const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');

// Helper to recalculate average rating and total review count on Course
const updateCourseRatingStats = async (courseId) => {
  const reviews = await Review.find({ courseId });
  const totalReviews = reviews.length;
  let averageRating = 0;

  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    averageRating = parseFloat((sum / totalReviews).toFixed(1));
  }

  await Course.findByIdAndUpdate(courseId, {
    averageRating,
    totalReviews,
  });

  return { averageRating, totalReviews };
};

// @desc    Submit a new course rating & review
// @route   POST /api/reviews
// @access  Private (Enrolled Students Only)
const createReview = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const userRole = req.user.role;
    const { courseId: bodyCourseId, course: rawCourse, rating, comment, review: bodyReview } = req.body;

    const courseId = bodyCourseId || rawCourse;
    const reviewText = comment || bodyReview;

    if (!courseId || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId, rating (1-5), and review text.',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5 stars.',
      });
    }

    // 1. Role Guard: Instructors & Admins cannot submit student reviews
    if (userRole === 'Instructor') {
      return res.status(403).json({
        success: false,
        message: 'Instructors cannot submit student reviews.',
      });
    }

    // 2. Enrolment Guard: Verify user is enrolled
    const enrolment = await Enrolment.findOne({
      $or: [
        { studentId: studentId, courseId: courseId },
        { student: studentId, course: courseId },
      ],
    });

    if (!enrolment && userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students can rate and review this course.',
      });
    }

    // 3. One Student = One Review Check
    const existingReview = await Review.findOne({ courseId, studentId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course.',
      });
    }

    const review = await Review.create({
      courseId,
      studentId,
      rating: Number(rating),
      comment: reviewText,
    });

    await updateCourseRatingStats(courseId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: review,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing review (Owner Student Only)
// @route   PUT /api/reviews/:id
// @access  Private (Review Owner Only)
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;
    const { rating, comment, review: bodyReview } = req.body;

    const reviewText = comment || bodyReview;

    let review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Security Check: Only the student owner can edit their review
    if (review.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to edit your own review.',
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5 stars.',
        });
      }
      review.rating = Number(rating);
    }

    if (reviewText !== undefined) {
      review.comment = reviewText;
    }

    await review.save();
    await updateCourseRatingStats(review.courseId);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      data: review,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a review (Owner Student or Admin Only)
// @route   DELETE /api/reviews/:id
// @access  Private (Owner Student or Admin)
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const isOwner = review.studentId.toString() === userId.toString();
    const isAdmin = userRole === 'Admin';

    // Instructors are forbidden from deleting reviews
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Instructors cannot delete student reviews. Only the review owner or an admin can delete a review.',
      });
    }

    const courseId = review.courseId;
    await Review.findByIdAndDelete(id);
    await updateCourseRatingStats(courseId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully!',
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a course with breakdown statistics
// @route   GET /api/courses/:courseId/reviews OR GET /api/reviews/course/:courseId
// @access  Public
const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ courseId })
      .populate('studentId', 'name avatar email')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = 0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      let sum = 0;
      reviews.forEach((r) => {
        const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        breakdown[rating] = (breakdown[rating] || 0) + 1;
        sum += r.rating || 0;
      });
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    // Check enrolment & user review status if user is authenticated
    let isEnrolled = false;
    let userReview = null;

    if (req.user) {
      const enrolment = await Enrolment.findOne({
        $or: [
          { studentId: req.user._id, courseId: courseId },
          { student: req.user._id, course: courseId },
        ],
      });
      isEnrolled = !!enrolment;

      userReview = reviews.find(
        (r) => r.studentId && r.studentId._id.toString() === req.user._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
      isEnrolled,
      userReview: userReview || null,
      data: reviews,
      reviews,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
};
