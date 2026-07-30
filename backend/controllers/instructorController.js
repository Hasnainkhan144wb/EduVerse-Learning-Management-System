const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Get dynamic instructor dashboard statistics & recent courses
// @route   GET /api/instructor/dashboard-stats
// @access  Private (Instructor / Admin Only)
const getInstructorDashboardStats = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // 1. Fetch courses created by this instructor
    const courses = await Course.find({ instructorRef: instructorId })
      .populate('categoryRef', 'name')
      .sort({ createdAt: -1 });

    const courseIds = courses.map((c) => c._id);

    // 2. Aggregate unique enrolled students across instructor's courses
    const uniqueStudents = await Enrolment.distinct('studentId', {
      courseId: { $in: courseIds },
    });

    // 3. Aggregate total revenue from Payment collection or calculate from enrolments
    const payments = await Payment.aggregate([
      { $match: { courseId: { $in: courseIds }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    let totalRevenue = payments[0]?.total || 0;

    // Fallback: If no payment objects recorded, calculate via enrolments * course price
    if (totalRevenue === 0 && courseIds.length > 0) {
      const enrolmentCounts = await Enrolment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]);

      const countMap = {};
      enrolmentCounts.forEach((e) => {
        countMap[e._id.toString()] = e.count;
      });

      totalRevenue = courses.reduce((acc, c) => {
        const count = countMap[c._id.toString()] || 0;
        return acc + count * (c.price || 49.99);
      }, 0);
    }

    // 4. Calculate Average Rating score from Review collection
    const ratingData = await Review.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    const courseRating = ratingData[0]?.avgRating
      ? ratingData[0].avgRating.toFixed(1)
      : '5.0';

    // 5. Build enrollment map for course table display
    const enrolmentCountsAll = await Enrolment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);
    const enrolmentMap = {};
    enrolmentCountsAll.forEach((item) => {
      enrolmentMap[item._id.toString()] = item.count;
    });

    const coursesWithStats = courses.map((course) => {
      const plain = course.toObject();
      plain.enrolledStudentsCount = enrolmentMap[course._id.toString()] || 0;
      return plain;
    });

    const statsObj = {
      totalStudents: uniqueStudents.length,
      totalRevenue: Math.round(totalRevenue),
      courseRating,
      coursesCreated: courses.length,
    };

    res.status(200).json({
      success: true,
      stats: statsObj,
      data: statsObj,
      courses: coursesWithStats,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstructorDashboardStats,
};
