const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to strictly enforce Admin privileges on administrative API routes
const requireAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access admin endpoint, token missing',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'eduverse_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    // Strict Role Check: Must be Admin
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${user.role}' is not authorized to access Admin endpoints`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access admin endpoint, token invalid or expired',
    });
  }
};

module.exports = {
  requireAdmin,
};
