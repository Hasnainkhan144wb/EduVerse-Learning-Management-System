const Course = require('../models/Course');
const Enrolment = require('../models/Enrolment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// @desc    Get dynamic instructor dashboard statistics & recent courses
// @route   GET /api/instructor/dashboard-stats
// @access  Private (Instructor / Admin Only)
const getInstructorDashboardStats = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // 1. Fetch courses created by this instructor
    const courses = await Course.find({
      $or: [{ instructorRef: instructorId }, { instructor: instructorId }],
    })
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
        return acc + count * (c.price || 0);
      }, 0);
    }

    // 4. Calculate Average Rating score from Review collection
    const ratingData = await Review.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    const courseRating = ratingData[0]?.avgRating
      ? ratingData[0].avgRating.toFixed(1)
      : '0.0';

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

// @desc    Get comprehensive real-time instructor analytics from MongoDB
// @route   GET /api/instructor/analytics
// @access  Private (Instructor / Admin Only)
const getInstructorAnalytics = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // Get all courses created by this instructor
    const courses = await Course.find({
      $or: [{ instructorRef: instructorId }, { instructor: instructorId }],
    }).select('_id title price level categoryRef');

    const courseIds = courses.map((c) => c._id);

    // If no courses found for instructor, return strict empty zero analytics
    if (courseIds.length === 0) {
      const emptyAnalytics = {
        summary: {
          totalRevenue: 0,
          totalStudents: 0,
          avgProgress: 0,
          coursesCount: 0,
          averageRating: 0.0,
        },
        monthlyRevenue: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
          (month) => ({ month, revenue: 0, sales: 0 })
        ),
        courseEnrollments: [],
        ratingsBreakdown: [
          { stars: '5 Stars ⭐', count: 0, percentage: 0 },
          { stars: '4 Stars ⭐', count: 0, percentage: 0 },
          { stars: '3 Stars ⭐', count: 0, percentage: 0 },
          { stars: '2 Stars ⭐', count: 0, percentage: 0 },
          { stars: '1 Star ⭐', count: 0, percentage: 0 },
        ],
      };
      return res.status(200).json({
        success: true,
        analytics: emptyAnalytics,
        data: emptyAnalytics,
      });
    }

    // 1. Monthly Revenue & Sales Aggregation from Payments
    const paymentsMonthly = await Payment.aggregate([
      { $match: { courseId: { $in: courseIds }, status: 'Completed' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalRevenue: { $sum: '$amount' },
          totalSales: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    paymentsMonthly.forEach((p) => {
      const monthIdx = p._id - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyMap[monthNames[monthIdx]] = { revenue: p.totalRevenue, sales: p.totalSales };
      }
    });

    const monthlyRevenue = monthNames.map((month) => ({
      month,
      revenue: monthlyMap[month]?.revenue || 0,
      sales: monthlyMap[month]?.sales || 0,
    }));

    // Total Revenue calculation from Payment collection
    const paymentTotalAgg = await Payment.aggregate([
      { $match: { courseId: { $in: courseIds }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    let totalRevenue = paymentTotalAgg[0]?.total || 0;

    // 2. Enrollments per Course & Average Progress
    const courseEnrollments = await Enrolment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: '$courseId',
          studentCount: { $sum: 1 },
          avgProgress: { $avg: '$progressPercentage' },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: { $ifNull: ['$courseDetails.title', 'Course'] },
          studentCount: 1,
          avgProgress: { $round: [{ $ifNull: ['$avgProgress', 0] }, 1] },
        },
      },
    ]);

    const formattedEnrollments = courseEnrollments.map((ce) => ({
      courseId: ce._id,
      title: ce.title,
      studentCount: ce.studentCount || 0,
      avgProgress: ce.avgProgress || 0,
    }));

    // If totalRevenue is 0, calculate revenue from enrolments * course price fallback
    if (totalRevenue === 0) {
      const countMap = {};
      formattedEnrollments.forEach((e) => {
        countMap[e.courseId?.toString()] = e.studentCount;
      });
      totalRevenue = courses.reduce((acc, c) => {
        const count = countMap[c._id.toString()] || 0;
        return acc + count * (c.price || 0);
      }, 0);
    }

    // Total enrolled students count
    const totalStudents = formattedEnrollments.reduce((acc, curr) => acc + curr.studentCount, 0);

    // Overall Average Progress percentage across all enrolled students
    const allEnrollmentsProgress = await Enrolment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: null, overallAvg: { $avg: '$progressPercentage' } } },
    ]);
    const overallAvgProgress = allEnrollmentsProgress[0]?.overallAvg
      ? Math.round(allEnrollmentsProgress[0].overallAvg)
      : 0;

    // 3. Ratings Breakdown & Average Rating Score
    const reviewsRating = await Review.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalReviewCount = 0;
    let sumRating = 0;

    reviewsRating.forEach((r) => {
      if (r._id >= 1 && r._id <= 5) {
        ratingCounts[r._id] = r.count;
        totalReviewCount += r.count;
        sumRating += r._id * r.count;
      }
    });

    const averageRatingScore = totalReviewCount > 0 ? (sumRating / totalReviewCount).toFixed(1) : '0.0';

    const ratingsBreakdown = [
      { stars: '5 Stars ⭐', count: ratingCounts[5], percentage: totalReviewCount ? Math.round((ratingCounts[5] / totalReviewCount) * 100) : 0 },
      { stars: '4 Stars ⭐', count: ratingCounts[4], percentage: totalReviewCount ? Math.round((ratingCounts[4] / totalReviewCount) * 100) : 0 },
      { stars: '3 Stars ⭐', count: ratingCounts[3], percentage: totalReviewCount ? Math.round((ratingCounts[3] / totalReviewCount) * 100) : 0 },
      { stars: '2 Stars ⭐', count: ratingCounts[2], percentage: totalReviewCount ? Math.round((ratingCounts[2] / totalReviewCount) * 100) : 0 },
      { stars: '1 Star ⭐', count: ratingCounts[1], percentage: totalReviewCount ? Math.round((ratingCounts[1] / totalReviewCount) * 100) : 0 },
    ];

    const analyticsObj = {
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalStudents,
        avgProgress: overallAvgProgress,
        coursesCount: courses.length,
        averageRating: parseFloat(averageRatingScore),
      },
      monthlyRevenue,
      courseEnrollments: formattedEnrollments,
      ratingsBreakdown,
    };

    res.status(200).json({
      success: true,
      analytics: analyticsObj,
      data: analyticsObj,
    });
  } catch (error) {
    console.error('🔥 Instructor Analytics Error:', error);
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message || 'Failed to fetch analytics' });
  }
};

module.exports = {
  getInstructorDashboardStats,
  getInstructorAnalytics,
};
