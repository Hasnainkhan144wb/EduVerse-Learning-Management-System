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

module.exports = {
  updateUserProfile,
};
