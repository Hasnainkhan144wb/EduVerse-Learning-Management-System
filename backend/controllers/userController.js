const User = require('../models/User');

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
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Please provide courseId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.watchlist) user.watchlist = [];
    if (!user.wishlist) user.wishlist = [];

    const watchIndex = user.watchlist.findIndex((id) => String(id) === String(courseId));
    const wishIndex = user.wishlist.findIndex((id) => String(id) === String(courseId));
    let isBookmarked = false;

    if (watchIndex > -1) {
      user.watchlist.splice(watchIndex, 1);
    } else {
      user.watchlist.push(courseId);
      isBookmarked = true;
    }

    if (wishIndex > -1) {
      user.wishlist.splice(wishIndex, 1);
    } else if (isBookmarked) {
      user.wishlist.push(courseId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      isBookmarked,
      watchlist: user.watchlist,
      wishlist: user.wishlist,
      message: isBookmarked ? 'Added to Watchlist!' : 'Removed from Watchlist!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch User's Watchlist / Wishlist Courses
// @route   GET /api/users/watchlist OR GET /api/users/wishlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'watchlist',
      populate: { path: 'instructor', select: 'name email avatar' },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const watchlistCourses = (user.watchlist && user.watchlist.length > 0)
      ? user.watchlist
      : (user.wishlist || []);

    return res.status(200).json({
      success: true,
      watchlist: watchlistCourses,
      wishlist: watchlistCourses,
      data: watchlistCourses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateUserProfile,
  toggleWatchlist,
  getWatchlist,
};
