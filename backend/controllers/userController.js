const User = require('../models/User');
const Enrolment = require('../models/Enrolment');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Update user profile (Name and Avatar)
// @route   PUT /api/users/profile OR PUT /api/auth/profile
// @access  Private (Student / Instructor / Admin)
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    if (req.body.name) {
      user.name = req.body.name.trim();
    }

    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    const updatedUser = await user.save();

    const userPayload = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status || 'Active',
      isApproved: updatedUser.isApproved,
      avatar: updatedUser.avatar,
      watchlist: updatedUser.watchlist || updatedUser.wishlist || [],
      wishlist: updatedUser.wishlist || updatedUser.watchlist || [],
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error('🔥 Error updating user profile:', error);
    if (typeof next === 'function') next(error);
    else return res.status(500).json({ success: false, message: error.message || 'Failed to update user profile' });
  }
};

// @desc    Toggle Bookmark / Watchlist (Add or Remove course)
// @route   POST /api/users/watchlist/toggle OR POST /api/users/wishlist/toggle
// @access  Private
const toggleWatchlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract courseId flexibly from any possible key format
    let courseId = req.body.courseId || req.body.id || req.body._id || req.body.course;

    // Handle case where object is passed directly
    if (typeof courseId === 'object' && courseId !== null) {
      courseId = courseId._id || courseId.id;
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Ensure wishlist and watchlist arrays exist
    if (!user.wishlist) user.wishlist = [];
    if (!user.watchlist) user.watchlist = [];

    const targetId = courseId.toString();

    const wishIndex = user.wishlist.findIndex(
      (item) => item && item.toString() === targetId
    );
    const watchIndex = user.watchlist.findIndex(
      (item) => item && item.toString() === targetId
    );

    let isBookmarked = false;

    if (wishIndex > -1) {
      user.wishlist.splice(wishIndex, 1);
      isBookmarked = false;
    } else {
      user.wishlist.push(targetId);
      isBookmarked = true;
    }

    if (watchIndex > -1 && !isBookmarked) {
      user.watchlist.splice(watchIndex, 1);
    } else if (isBookmarked && watchIndex === -1) {
      user.watchlist.push(targetId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      isBookmarked,
      wishlist: user.wishlist,
      watchlist: user.wishlist,
      data: user.wishlist,
      message: isBookmarked ? 'Course bookmarked!' : 'Course removed from bookmarks!',
    });
  } catch (error) {
    console.error('🔥 Toggle Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch User's Watchlist / Wishlist Courses (BULLETPROOF & POPULATE SAFE)
// @route   GET /api/users/watchlist OR GET /api/users/wishlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'instructorRef',
          select: 'name email avatar',
        },
      })
      .populate({
        path: 'watchlist',
        populate: {
          path: 'instructorRef',
          select: 'name email avatar',
        },
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const rawList = (user.wishlist && user.wishlist.length > 0)
      ? user.wishlist
      : (user.watchlist || []);

    // Clean list to ensure no deleted/null courses crash the array
    const cleanCourses = rawList.filter((item) => item && typeof item === 'object');

    return res.status(200).json({
      success: true,
      count: cleanCourses.length,
      wishlist: cleanCourses,
      watchlist: cleanCourses, // Dual key mapping for bulletproof frontend compatibility
      data: cleanCourses,
    });
  } catch (error) {
    console.error('🔥 Error in getWatchlist:', error);
    return res.status(200).json({
      success: true,
      count: 0,
      wishlist: [],
      watchlist: [],
      data: [],
      message: 'Error handled gracefully',
    });
  }
};

// @desc    Get Dynamic Real-Time Student Dashboard Overview Stats
// @route   GET /api/users/dashboard-stats OR GET /api/student/dashboard-stats
// @access  Private (Student)
const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch Enrolled Courses Count
    const enrolments = await Enrolment.find({
      $or: [{ studentId: studentId }, { student: studentId }],
    }).populate('courseId');

    const enrolledCount = enrolments.length;

    // 2. Completed Courses Count (progressPercentage === 100 or completedLessons count)
    const completedCount = enrolments.filter(
      (e) => (e.progressPercentage || e.progress || 0) >= 100 || e.isCompleted
    ).length;

    // 3. Dynamic Hours Spent Calculation
    // Calculate based on completed lessons or total course duration watched
    let totalMinutesSpent = 0;
    enrolments.forEach((enrol) => {
      const progressPercentage = enrol.progressPercentage || enrol.progress || 0;
      const course = enrol.courseId || enrol.course;
      const courseDurationMinutes = course?.totalDurationMinutes || 180; // Default 3 hrs per course if not specified
      totalMinutesSpent += (courseDurationMinutes * (progressPercentage / 100));

      if (enrol.completedLessons && enrol.completedLessons.length > 0) {
        totalMinutesSpent += enrol.completedLessons.length * 20; // 20 mins per completed lesson
      }
    });
    const hoursSpent = Math.max(0, parseFloat((totalMinutesSpent / 60).toFixed(1)));

    // 4. Dynamic Quiz Average Score Calculation
    const quizSubmissions = await QuizAttempt.find({
      $or: [{ studentId: studentId }, { student: studentId }],
    });

    let quizAvgScore = 0;

    if (quizSubmissions.length > 0) {
      const totalScorePercentage = quizSubmissions.reduce((acc, curr) => {
        let percentage = curr.scorePercentage;
        if (percentage === undefined || percentage === null) {
          if (curr.totalMarks && curr.totalMarks > 0) {
            percentage = (curr.obtainedMarks / curr.totalMarks) * 100;
          } else if (curr.totalQuestions && curr.totalQuestions > 0) {
            percentage = (curr.correctAnswersCount / curr.totalQuestions) * 100;
          } else {
            percentage = 0;
          }
        }
        return acc + percentage;
      }, 0);

      quizAvgScore = parseFloat((totalScorePercentage / quizSubmissions.length).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      stats: {
        enrolledCourses: enrolledCount,
        completedCourses: completedCount,
        hoursSpent,
        quizAvgScore,
      },
      data: {
        enrolledCourses: enrolledCount,
        completedCourses: completedCount,
        hoursSpent,
        quizAvgScore,
      },
    });
  } catch (error) {
    console.error('🔥 Error fetching student stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate student statistics',
    });
  }
};

module.exports = {
  updateUserProfile,
  toggleWatchlist,
  getWatchlist,
  getStudentDashboardStats,
};
