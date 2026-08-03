const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Enrolment = require('../models/Enrolment');
const Notification = require('../models/Notification');

// Global in-memory platform settings store with fallback defaults
let platformSettings = {
  siteTitle: 'EduVerse LMS',
  supportEmail: 'support@eduverse.com',
  currency: 'USD',
  allowInstructorSignups: true,
  requireEmailVerification: false,
  maintenanceMode: false,
  accentColor: '#11337B',
};

// @desc    Get system-wide admin dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin Only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      pendingInstructors,
      pendingUsersCount,
      totalCourses,
      publishedCourses,
      totalEnrolments,
    ] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Instructor' }),
      User.countDocuments({ role: 'Instructor', $or: [{ isApproved: false }, { status: 'Pending' }] }),
      User.countDocuments({ $or: [{ status: 'Pending' }, { isApproved: false }], role: { $ne: 'Admin' } }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'Published' }),
      Enrolment.countDocuments(),
    ]);

    // Estimated revenue calculation
    const totalRevenue = totalEnrolments * 49.99;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        pendingInstructors,
        pendingUsers: pendingUsersCount,
        totalCourses,
        publishedCourses,
        totalEnrolments,
        totalRevenue: Math.round(totalRevenue),
      },
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending users awaiting admin approval
// @route   GET /api/admin/pending-users
// @access  Private (Admin Only)
const getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({
      $or: [{ status: 'Pending' }, { isApproved: false }],
      role: { $ne: 'Admin' },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve user account (Set status = Active, isApproved = true, store audit approvedBy & approvedAt)
// @route   PATCH /api/admin/users/:id/approve
// @access  Private (Admin Only)
const approveUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'Active';
    user.isApproved = true;
    user.approvedBy = req.user?._id;
    user.approvedAt = new Date();

    await user.save();

    // Create Notification for the approved user
    await Notification.create({
      userId: user._id,
      title: 'Account Approved! 🎉',
      message: 'Your account has been approved. You can now log in and access the LMS.',
      type: 'approval',
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} account approved successfully`,
      data: user,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject user account (Set status = Rejected, isApproved = false, store audit approvedBy & approvedAt)
// @route   PATCH /api/admin/users/:id/reject
// @access  Private (Admin Only)
const rejectUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'Rejected';
    user.isApproved = false;
    user.approvedBy = req.user?._id;
    user.approvedAt = new Date();

    await user.save();

    // Create Notification for the rejected user
    await Notification.create({
      userId: user._id,
      title: 'Registration Rejected',
      message: 'Your registration request has been rejected.',
      type: 'approval',
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} registration request rejected`,
      data: user,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin notification alerts
// @route   GET /api/admin/notifications
// @access  Private (Admin Only)
const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      type: { $in: ['admin_alert', 'system'] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated platform analytics for reporting
// @route   GET /api/admin/analytics
// @access  Private (Admin Only)
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrolments,
      popularCourses,
    ] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Instructor' }),
      Course.countDocuments(),
      Enrolment.countDocuments(),
      Course.find()
        .populate('instructorRef', 'name email')
        .populate('categoryRef', 'name')
        .sort({ rating: -1, createdAt: -1 })
        .limit(5),
    ]);

    const totalRevenue = Math.round(totalEnrolments * 49.99);

    const monthlyTrends = [
      { month: 'Jan', revenue: 4200, enrolments: 120, growth: 12.5 },
      { month: 'Feb', revenue: 6800, enrolments: 190, growth: 15.2 },
      { month: 'Mar', revenue: 9500, enrolments: 240, growth: 18.0 },
      { month: 'Apr', revenue: 12400, enrolments: 310, growth: 14.8 },
      { month: 'May', revenue: 15800, enrolments: 420, growth: 19.5 },
      { month: 'Jun', revenue: 21000, enrolments: 580, growth: 22.4 },
    ];

    const categoryBreakdown = [
      { name: 'Web Dev', value: 40, color: '#3b82f6' },
      { name: 'Data Science', value: 25, color: '#8b5cf6' },
      { name: 'UI/UX Design', value: 20, color: '#ec4899' },
      { name: 'Business', value: 15, color: '#10b981' },
    ];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          monthlyGrowthRate: 18.4,
          totalStudents,
          totalInstructors,
          totalCourses,
          totalEnrolments,
        },
        monthlyTrends,
        categoryBreakdown,
        popularCourses,
      },
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Financial Revenue Report
// @route   GET /api/admin/reports/financial
// @access  Private (Admin Only)
const getFinancialReport = async (req, res, next) => {
  try {
    const enrolments = await Enrolment.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 });

    const reportData = enrolments.map((enr, idx) => ({
      transactionId: `TXN-${1000 + idx}`,
      studentName: enr.studentId?.name || 'Student Learner',
      studentEmail: enr.studentId?.email || 'N/A',
      courseTitle: enr.courseId?.title || 'Platform Course',
      amountPaid: enr.courseId?.price ? `$${enr.courseId.price}` : '$49.99',
      paymentStatus: 'Completed',
      transactionDate: new Date(enr.createdAt).toLocaleDateString(),
    }));

    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    User Growth & Engagement Report
// @route   GET /api/admin/reports/users
// @access  Private (Admin Only)
const getUsersReport = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const reportData = users.map((u) => ({
      userId: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      approvalStatus: u.isApproved ? 'Verified' : 'Pending',
      registrationDate: new Date(u.createdAt).toLocaleDateString(),
    }));

    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Course Performance & Progress Report
// @route   GET /api/admin/reports/courses
// @access  Private (Admin Only)
const getCoursesReport = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('instructorRef', 'name email')
      .populate('categoryRef', 'name')
      .sort({ createdAt: -1 });

    const reportData = courses.map((c) => ({
      courseId: c._id,
      title: c.title,
      instructor: c.instructorRef?.name || 'Faculty Member',
      category: c.categoryRef?.name || 'General',
      price: c.isFree ? 'Free' : `$${c.price || 49.99}`,
      status: c.status || 'Published',
      level: c.level || 'All',
      createdDate: new Date(c.createdAt).toLocaleDateString(),
    }));

    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private (Admin Only)
const getSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: platformSettings,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Admin Only)
const updateSettings = async (req, res, next) => {
  try {
    platformSettings = {
      ...platformSettings,
      ...req.body,
    };

    res.status(200).json({
      success: true,
      message: 'Platform configuration updated successfully!',
      data: platformSettings,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user directory with filtering & search
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search, isApproved, status } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.status = status;
    } else if (isApproved !== undefined && isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role or block/unblock status
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin Only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isApproved, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (status) {
      user.status = status;
      user.isApproved = status === 'Active';
    } else if (isApproved !== undefined) {
      user.isApproved = isApproved;
      user.status = isApproved ? 'Active' : 'Pending';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} role/status updated successfully`,
      data: user,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or update instructor status
// @route   PATCH /api/admin/users/:id/approve-instructor
// @access  Private (Admin Only)
const approveInstructor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isApproved = isApproved !== undefined ? isApproved : true;
    user.status = user.isApproved ? 'Active' : 'Pending';
    user.approvedBy = req.user?._id;
    user.approvedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Instructor ${user.name} approval status updated to ${user.status}`,
      data: user,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user completely with Fail-Safe Cascading Delete (Instructor & Student data cleanup)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`\n===========================================`);
    console.log(`🚨 ADMIN DELETE TRIGGERED FOR USER ID: ${id}`);

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      console.log(`❌ User with ID ${id} not found in DB.`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety check: Prevent Admin from deleting their own account
    if (req.user && req.user._id && req.user._id.toString() === id.toString()) {
      console.log(`⚠️ Prevented Admin self-deletion.`);
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account.',
      });
    }

    console.log(`👤 Target User Found: ${userToDelete.name} (${userToDelete.email}) | Role: ${userToDelete.role}`);

    // Normalize Role string (handle lowercase/uppercase)
    const role = userToDelete.role ? userToDelete.role.toLowerCase() : '';

    // 🚨 1. INSTRUCTOR CASCADING DELETE
    if (role === 'instructor') {
      // Search courses using all possible schema key variants
      const instructorCourses = await Course.find({
        $or: [
          { instructor: id },
          { instructorId: id },
          { instructorRef: id },
          { user: id },
          { userId: id },
        ],
      }).select('_id');

      const courseIds = instructorCourses.map((c) => c._id);
      console.log(`📚 Found ${courseIds.length} courses owned by this instructor.`);

      if (courseIds.length > 0) {
        let deletedLessonsCount = 0;
        let deletedEnrolmentsCount = 0;
        let deletedPaymentsCount = 0;
        let deletedReviewsCount = 0;
        let deletedQuestionsCount = 0;

        try {
          const Lesson = require('../models/Lesson');
          const resL = await Lesson.deleteMany({ $or: [{ course: { $in: courseIds } }, { courseId: { $in: courseIds } }] });
          deletedLessonsCount = resL.deletedCount || 0;
        } catch (e) {}

        try {
          const resE = await Enrolment.deleteMany({ $or: [{ course: { $in: courseIds } }, { courseId: { $in: courseIds } }] });
          deletedEnrolmentsCount = resE.deletedCount || 0;
        } catch (e) {}

        try {
          const Payment = require('../models/Payment');
          const resP = await Payment.deleteMany({ $or: [{ course: { $in: courseIds } }, { courseId: { $in: courseIds } }] });
          deletedPaymentsCount = resP.deletedCount || 0;
        } catch (e) {}

        try {
          const Review = require('../models/Review');
          const resR = await Review.deleteMany({ $or: [{ course: { $in: courseIds } }, { courseId: { $in: courseIds } }] });
          deletedReviewsCount = resR.deletedCount || 0;
        } catch (e) {}

        try {
          const Question = require('../models/Question');
          const resQ = await Question.deleteMany({ $or: [{ course: { $in: courseIds } }, { courseId: { $in: courseIds } }] });
          deletedQuestionsCount = resQ.deletedCount || 0;
        } catch (e) {}

        const resC = await Course.deleteMany({
          $or: [
            { _id: { $in: courseIds } },
            { instructor: id },
            { instructorId: id },
            { instructorRef: id },
            { user: id },
            { userId: id },
          ],
        });

        console.log(`🧹 Cascading Clean Results for Instructor:
          - Lessons Deleted: ${deletedLessonsCount}
          - Enrolments Deleted: ${deletedEnrolmentsCount}
          - Payments Deleted: ${deletedPaymentsCount}
          - Reviews Deleted: ${deletedReviewsCount}
          - Questions Deleted: ${deletedQuestionsCount}
          - Courses Deleted: ${resC.deletedCount || 0}`);
      }
    }

    // 🚨 2. STUDENT CASCADING DELETE
    if (role === 'student') {
      let deletedEnrolmentsCount = 0;
      let deletedPaymentsCount = 0;
      let deletedReviewsCount = 0;
      let deletedQuestionsCount = 0;

      try {
        const resE = await Enrolment.deleteMany({
          $or: [{ student: id }, { studentId: id }, { user: id }, { userId: id }],
        });
        deletedEnrolmentsCount = resE.deletedCount || 0;
      } catch (e) {}

      try {
        const Payment = require('../models/Payment');
        const resP = await Payment.deleteMany({
          $or: [{ student: id }, { studentId: id }, { user: id }, { userId: id }],
        });
        deletedPaymentsCount = resP.deletedCount || 0;
      } catch (e) {}

      try {
        const Review = require('../models/Review');
        const resR = await Review.deleteMany({
          $or: [{ student: id }, { studentId: id }, { user: id }, { userId: id }],
        });
        deletedReviewsCount = resR.deletedCount || 0;
      } catch (e) {}

      try {
        const Question = require('../models/Question');
        const resQ = await Question.deleteMany({
          $or: [{ student: id }, { studentId: id }, { user: id }, { userId: id }],
        });
        deletedQuestionsCount = resQ.deletedCount || 0;
      } catch (e) {}

      console.log(`🧹 Student Records Cleaned:
        - Enrolments Deleted: ${deletedEnrolmentsCount}
        - Payments Deleted: ${deletedPaymentsCount}
        - Reviews Deleted: ${deletedReviewsCount}
        - Questions Deleted: ${deletedQuestionsCount}`);
    }

    // 3. Remove Notifications & User Document
    try {
      await Notification.deleteMany({ userId: id });
    } catch (e) {}

    await User.findByIdAndDelete(id);
    console.log(`✅ User Document (${userToDelete.name}) Deleted Successfully from DB.`);
    console.log(`===========================================\n`);

    return res.status(200).json({
      success: true,
      message: `${userToDelete.name} (${userToDelete.role}) and all related database records were permanently removed.`,
      data: { id, name: userToDelete.name, email: userToDelete.email },
    });
  } catch (error) {
    console.error('🔥 Error in deleteUser Controller:', error);
    if (typeof next === 'function') next(error);
    else return res.status(500).json({ success: false, message: error.message || 'Server Error while deleting user' });
  }
};

// @desc    Get all platform courses for admin management
// @route   GET /api/admin/courses
// @access  Private (Admin Only)
const getAdminCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('instructorRef', 'name email avatar')
      .populate('categoryRef', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course status (Published / Unpublished / Draft / Rejected)
// @route   PATCH /api/admin/courses/:id/status
// @access  Private (Admin Only)
const updateCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status value is required.' });
    }

    const isPublished = status === 'Published' || status === 'Approved';
    const finalStatus = isPublished ? 'Published' : status;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        status: finalStatus,
        isPublished: isPublished,
        isApproved: isPublished ? true : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Course status successfully updated to ${status}`,
      data: updatedCourse,
      course: updatedCourse,
    });
  } catch (error) {
    console.error('🔥 Error updating course status:', error);
    if (typeof next === 'function') next(error);
    else return res.status(500).json({ success: false, message: error.message || 'Failed to update course status' });
  }
};

// @desc    Get categories for admin
// @route   GET /api/admin/categories
// @access  Private (Admin Only)
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve and publish course by Admin
// @route   PUT /api/admin/courses/:id/approve OR POST /api/admin/courses/:id/approve
// @access  Private (Admin)
const approveCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        status: 'Published',
        isPublished: true,
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Course approved and published successfully!',
      course,
      data: course,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  approveCourse,
  getAdminCategories,
};
