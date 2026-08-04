const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token & user verification status
const protect = async (req, res, next) => {
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
      message: 'Not authorized to access this route, token missing',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_eduverse_secret_key_2026'
    );

    // Attach user (without password) to request object
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    // Verify Account Verification Approval (Block Pending and Rejected accounts unless Admin)
    if (user.role !== 'Admin') {
      if (user.status === 'Rejected') {
        return res.status(403).json({
          success: false,
          status: 'Rejected',
          isApproved: false,
          message: 'Your registration request has been rejected. Please contact the administrator.',
        });
      }

      if (user.status === 'Pending' || user.isApproved === false || !user.isApproved) {
        return res.status(403).json({
          success: false,
          status: 'Pending',
          isApproved: false,
          isPendingApproval: true,
          message: 'Your account is awaiting administrator approval. You will be able to access your dashboard after your account has been verified.',
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token invalid or expired',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Optional protection - Attach req.user if token is valid, but do not block if missing
const protectOptional = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_eduverse_secret_key_2026'
      );
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token error for optional auth
    }
  }
  next();
};

module.exports = {
  protect,
  protectOptional,
  authorize,
};
