const Notification = require('../models/Notification');

// Time-ago helper
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

// ─── Utility: Create Admin Notification ──────────────────────────────────
const createAdminNotification = async ({
  title,
  message,
  type = 'system',
  relatedCourse = null,
  relatedUser = null,
  actionUrl = '',
}) => {
  try {
    const notification = await Notification.create({
      recipientRole: 'Admin',
      type,
      title,
      message,
      relatedCourse: relatedCourse || null,
      courseId: relatedCourse || null,
      course: relatedCourse || null,
      relatedUser: relatedUser || null,
      userId: relatedUser || null,
      user: relatedUser || null,
      actionUrl,
      isRead: false,
    });
    return notification;
  } catch (err) {
    console.error('📢 Admin notification creation error:', err.message);
    return null;
  }
};

// @desc    Get all Admin notifications with filtering & search
// @route   GET /api/admin/notifications
// @access  Private (Admin Only)
const getAdminNotifications = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;

    const query = {
      $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }],
    };

    if (status === 'unread') {
      query.isRead = false;
    } else if (status === 'read') {
      query.isRead = true;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    let notifications = await Notification.find(query)
      .populate('relatedCourse courseId course', 'title thumbnail instructorRef')
      .populate('relatedUser userId user', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(100);

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      notifications = notifications.filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const msgMatch = n.message.toLowerCase().includes(q);
        const userMatch = (n.relatedUser?.name || n.userId?.name || '').toLowerCase().includes(q);
        const courseMatch = (n.relatedCourse?.title || n.courseId?.title || '').toLowerCase().includes(q);
        return titleMatch || msgMatch || userMatch || courseMatch;
      });
    }

    const formatted = notifications.map((n) => {
      const courseObj = n.relatedCourse || n.courseId || n.course || {};
      const userObj = n.relatedUser || n.userId || n.user || {};

      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type || 'system',
        isRead: n.isRead,
        actionUrl: n.actionUrl || '',
        relatedCourse: courseObj._id ? { _id: courseObj._id, title: courseObj.title, thumbnail: courseObj.thumbnail } : null,
        relatedUser: userObj._id ? { _id: userObj._id, name: userObj.name, email: userObj.email, role: userObj.role, avatar: userObj.avatar } : null,
        timeAgo: timeAgo(n.createdAt),
        createdAt: n.createdAt,
      };
    });

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }],
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: formatted.length,
      notifications: formatted,
      data: formatted,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin unread notification count
// @route   GET /api/admin/notifications/unread-count
// @access  Private (Admin Only)
const getAdminUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }],
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: unreadCount,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single Admin notification as read
// @route   PATCH /api/admin/notifications/:id/read AND PUT /api/admin/notifications/:id/read
// @access  Private (Admin Only)
const markAdminNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }],
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      data: notification,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark ALL Admin notifications as read
// @route   PATCH /api/admin/notifications/read-all AND PUT /api/admin/notifications/read-all
// @access  Private (Admin Only)
const markAllAdminNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }] },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All admin notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Admin notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin Only)
const deleteAdminNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipientRole: 'Admin' }, { recipientRole: 'All' }],
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdminNotification,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
};
