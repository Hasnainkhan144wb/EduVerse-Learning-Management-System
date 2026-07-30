const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Isolated Admin Login Controller
// @route   POST /api/admin/login
// @access  Public (Strict Role Verification)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Admin Login Attempt for: ${email}`);

    if (!email || !password) {
      console.log('❌ Missing email or password payload');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // 1. Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ Admin User Not Found in DB');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // 2. Check Role
    if (user.role !== 'Admin') {
      console.log(`❌ User found but role is '${user.role}' instead of 'Admin'`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not an Admin.',
      });
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔑 Password Match Result: ${isMatch}`);

    if (!isMatch) {
      console.log('❌ Password Compare Failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // 4. Generate Admin JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'eduverse_secret_key_2026';
    const token = jwt.sign(
      { id: user._id, role: user.role, isAdmin: true },
      jwtSecret,
      { expiresIn: '1d' }
    );

    console.log(`✅ Admin Login Successful for ${user.email}`);

    const adminPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: true,
      avatar: user.avatar,
      isApproved: user.isApproved,
    };

    return res.status(200).json({
      success: true,
      token,
      data: { ...adminPayload, token },
      user: adminPayload,
    });
  } catch (error) {
    console.error('🔥 Admin Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during admin login',
    });
  }
};

module.exports = {
  adminLogin,
};
