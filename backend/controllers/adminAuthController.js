const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Isolated Admin Login Controller
// @route   POST /api/admin/login
// @access  Public (Strict Role Verification)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // 2. Fetch user by email and explicitly select password hash
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // 3. Verify password hash match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // 4. STRICT ISOLATED ROLE CHECK: Reject non-Admin accounts (Student/Instructor) with 403 Forbidden
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized as Admin',
      });
    }

    // 5. Generate Admin JWT Token containing { id, role: 'Admin', isAdmin: true }
    const jwtSecret = process.env.JWT_SECRET || 'eduverse_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { id: user._id, role: 'Admin', isAdmin: true },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const adminPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: 'Admin',
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
    console.error('🔥 ADMIN LOGIN ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during admin login',
    });
  }
};

module.exports = {
  adminLogin,
};
