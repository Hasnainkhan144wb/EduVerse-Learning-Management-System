const Notification = require('../models/Notification');
const Review = require('../models/Review');

// ─── Utility: Time-ago helper ─────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// ─── Utility: Create Review Reminder Notification (no duplicate per course) ──
const createReviewReminderNotification = async (studentId, courseId, courseTitle, courseThumbnail) => {
  try {
    // Check for existing non-read reminder for same course
    const existing = await Notification.findOne({
      $or: [{ userId: studentId }, { user: studentId }],
      $or: [{ courseId: courseId }, { course: courseId }],
      type: 'course_review_reminder',
      isRead: false,
    });

    if (existing) return existing; // No duplicates

    const notification = await Notification.create({
      userId: studentId,
      user: studentId,
      courseId: courseId,
      course: courseId,
      type: 'course_review_reminder',
      title: '🏆 Course Completed!',
      message: `Congratulations! You have successfully completed "${courseTitle}". Your feedback helps future learners — please take a moment to rate and review this course.`,
      isRead: false,
    });

    return notification;
  } catch (err) {
    console.error('📢 Notification creation error:', err.message);
    return null;
  }
};

// ─── Utility: Remove all review reminder notifications for a course (called after review submission) ──
const removeReviewReminderNotification = async (studentId, courseId) => {
  try {
    await Notification.deleteMany({
      $or: [{ userId: studentId }, { user: studentId }],
      $or: [{ courseId: courseId }, { course: courseId }],
      type: 'course_review_reminder',
    });
  } catch (err) {
    console.error('📢 Notification removal error:', err.message);
  }
};

// @desc    Get all notifications for the logged-in student
// @route   GET /api/notifications
// @access  Private (Student)
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      $or: [{ userId }, { user: userId }],
    })
      .populate('courseId', 'title thumbnail')
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = notifications.map((n) => {
      const courseObj = n.courseId || n.course || {};
      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        courseId: courseObj._id || courseObj,
        courseTitle: courseObj.title || '',
        courseThumbnail: courseObj.thumbnail || '',
        timeAgo: timeAgo(n.createdAt),
        createdAt: n.createdAt,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, $or: [{ userId }, { user: userId }] },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read.', data: notification });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { $or: [{ userId }, { user: userId }] },
      { isRead: true }
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      $or: [{ userId }, { user: userId }],
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReviewReminderNotification,
  removeReviewReminderNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
