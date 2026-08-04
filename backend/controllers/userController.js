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

module.exports = {
  updateUserProfile,
  toggleWatchlist,
  getWatchlist,
};
