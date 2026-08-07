const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createAdminNotification } = require('./adminNotificationController');
const generateToken = require('../utils/generateToken');

// @desc    Register new user (Student / Instructor / Admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password) are required.',
      });
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address.',
      });
    }

    // 3. Role assignment
    const validRoles = ['Student', 'Instructor', 'Admin'];
    const userRole = validRoles.includes(role) ? role : 'Student';

    // 4. Set approval status: Admin -> Active, Student/Instructor -> Pending
    const isInitialAdmin = userRole === 'Admin';
    const status = isInitialAdmin ? 'Active' : 'Pending';
    const isApproved = isInitialAdmin;

    // 5. Create User (password hashing automatically handled by User pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      avatar: avatar || '',
      status,
      isApproved,
    });

    // 6. Create Admin Notification for non-Admin registrations
    if (!isInitialAdmin) {
      if (userRole === 'Instructor') {
        await createAdminNotification({
          title: '👨‍🏫 New Instructor Registration',
          message: `Instructor ${name} is waiting for account approval.`,
          type: 'instructor_approval',
          relatedUser: user._id,
          actionUrl: '/admin/users',
        });
      } else {
        await createAdminNotification({
          title: '🎓 New Student Registered',
          message: `Learner ${name} joined the platform.`,
          type: 'student_registration',
          relatedUser: user._id,
          actionUrl: '/admin/users',
        });
      }
    }

    // 7. Generate Token
    const jwtSecret = process.env.JWT_SECRET || 'eduverse_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    res.cookie('token', token, cookieOptions);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      isApproved: user.isApproved,
    };

    return res.status(201).json({
      success: true,
      token,
      message: isInitialAdmin
        ? 'Admin registration successful!'
        : 'Registration successful! Your account is pending administrator approval.',
      data: { ...userPayload, token },
      user: userPayload,
    });
  } catch (error) {
    console.error('🔥 BACKEND REGISTRATION ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // Check account status & verification (for non-Admin roles)
    if (user.role !== 'Admin') {
      if (user.status === 'Rejected') {
        return res.status(403).json({
          success: false,
          status: 'Rejected',
          isVerified: false,
          isApproved: false,
          message: 'Your registration request has been rejected. Please contact the administrator.',
        });
      }

      if (user.status === 'Pending' || user.isApproved === false || !user.isApproved) {
        return res.status(403).json({
          success: false,
          status: 'Pending',
          isVerified: false,
          isApproved: false,
          message: 'Your account is awaiting administrator approval. You will be able to access your dashboard after your account has been verified.',
        });
      }
    }

    const token = generateToken(user._id, user.role);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    res.cookie('token', token, cookieOptions);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'Active',
      avatar: user.avatar,
      isApproved: user.isApproved,
    };

    return res.status(200).json({
      success: true,
      token,
      data: { ...userPayload, token },
      user: userPayload,
    });
  } catch (error) {
    console.error('🔥 BACKEND LOGIN ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'title thumbnail price description level')
      .populate('enrolledCourses', 'title thumbnail progressPercentage')
      .populate('createdCourses', 'title thumbnail status price');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      user,
    });
  } catch (error) {
    console.error('🔥 BACKEND GET PROFILE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile',
    });
  }
};

// @desc    Update user profile (Full Name & Avatar)
// @route   PUT /api/users/profile OR PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
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
      avatar: updatedUser.avatar,
      isApproved: updatedUser.isApproved,
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error('🔥 BACKEND UPDATE PROFILE ERROR:', error);
    if (typeof next === 'function') next(error);
    else return res.status(500).json({ success: false, message: error.message || 'Server error updating profile' });
  }
};

// @desc    Toggle course in user's wishlist
// @route   POST /api/auth/wishlist OR POST /api/users/wishlist
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const courseId = req.body.courseId || req.body.id || req.body.course;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Please provide courseId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) user.wishlist = [];
    if (!user.watchlist) user.watchlist = [];

    const index = user.wishlist.findIndex(
      (id) => id && id.toString() === courseId.toString()
    );
    const watchIndex = user.watchlist.findIndex(
      (id) => id && id.toString() === courseId.toString()
    );

    let isBookmarked = false;
    let message = '';

    if (index > -1) {
      user.wishlist.splice(index, 1);
      message = 'Course removed from wishlist';
      isBookmarked = false;
    } else {
      user.wishlist.push(courseId);
      message = 'Course added to wishlist';
      isBookmarked = true;
    }

    if (watchIndex > -1 && !isBookmarked) {
      user.watchlist.splice(watchIndex, 1);
    } else if (isBookmarked && watchIndex === -1) {
      user.watchlist.push(courseId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isBookmarked,
      message,
      data: user.wishlist,
      wishlist: user.wishlist,
      watchlist: user.watchlist,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Request reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user registered with that email address',
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully',
      resetToken,
    });
  } catch (error) {
    console.error('🔥 BACKEND FORGOT PASSWORD ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing password reset request',
    });
  }
};

// @desc    Reset Password with Token
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password of at least 6 characters',
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      token,
    });
  } catch (error) {
    console.error('🔥 BACKEND RESET PASSWORD ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  toggleWishlist,
  forgotPassword,
  resetPassword,
};
