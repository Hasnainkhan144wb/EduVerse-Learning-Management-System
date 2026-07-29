const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

    // 4. Create User (password hashing automatically handled by User pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      avatar: avatar || '',
      isApproved: true,
    });

    // 5. Generate Token
    const jwtSecret = process.env.JWT_SECRET || 'eduverse_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isApproved: user.isApproved,
    };

    return res.status(201).json({
      success: true,
      token,
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

    const token = generateToken(user._id, user.role);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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

// @desc    Toggle course in user's wishlist
// @route   POST /api/auth/wishlist OR POST /api/users/wishlist
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Please provide courseId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.wishlist.indexOf(courseId);
    let message = '';
    if (index > -1) {
      user.wishlist.splice(index, 1);
      message = 'Course removed from wishlist';
    } else {
      user.wishlist.push(courseId);
      message = 'Course added to wishlist';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message,
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  toggleWishlist,
  forgotPassword,
  resetPassword,
};
