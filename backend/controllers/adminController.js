const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Enrolment = require('../models/Enrolment');

// @desc    Get system-wide admin dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin Only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      pendingInstructors,
      totalCourses,
      publishedCourses,
      totalEnrolments,
    ] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Instructor' }),
      User.countDocuments({ role: 'Instructor', isApproved: false }),
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

// @desc    Get user directory with filtering & search
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search, isApproved } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (isApproved !== undefined && isApproved !== '') {
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
    const { role, isApproved } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;

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
    await user.save();

    res.status(200).json({
      success: true,
      message: `Instructor ${user.name} approval status updated to ${user.isApproved}`,
      data: user,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
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

// @desc    Update course status (Published / Draft / Rejected)
// @route   PATCH /api/admin/courses/:id/status
// @access  Private (Admin Only)
const updateCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.status = status;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
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

module.exports = {
  getDashboardStats,
  getAdminUsers,
  updateUserRole,
  approveInstructor,
  getAdminCourses,
  updateCourseStatus,
  getAdminCategories,
};
