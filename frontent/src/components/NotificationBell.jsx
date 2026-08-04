import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiStar, FiCheckCircle, FiClock } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silent fail on network issues
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleOpenDropdown = () => {
    setOpen((prev) => !prev);
  };

  // Mark single notification as read
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  // Mark all read
  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  // Dismiss (delete) notification
  const dismissNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const waUnread = notifications.find((n) => n._id === id && !n.isRead);
        return waUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {}
  };

  // Handle Rate & Review click
  const handleRateReview = async (notification) => {
    if (!notification.isRead) await markRead(notification._id);
    setOpen(false);
    navigate(`/courses/${notification.courseId}#reviews`);
  };

  // Handle Remind Me Later
  const handleRemindLater = async (id) => {
    await markRead(id);
    setOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'course_review_reminder':
        return '🏆';
      case 'review_submitted':
        return '✅';
      case 'enrollment':
        return '📚';
      default:
        return '🔔';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-[370px] max-w-[calc(100vw-24px)] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/60 z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  <FiBell className="text-indigo-400 w-4 h-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <FiCheckCircle className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-800/60">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <span className="text-3xl">🔔</span>
                  <p className="text-slate-300 text-xs font-semibold">You're all caught up!</p>
                  <p className="text-slate-500 text-[11px]">No new notifications right now.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`px-4 py-4 transition ${!notif.isRead ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-800/40'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 ${
                        notif.type === 'course_review_reminder'
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : notif.type === 'review_submitted'
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-indigo-500/10 border border-indigo-500/20'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-extrabold text-white leading-tight">
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                            )}
                            <button
                              onClick={(e) => dismissNotification(e, notif._id)}
                              className="text-slate-500 hover:text-slate-300 transition p-0.5 rounded"
                              title="Dismiss"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Course title if available */}
                        {notif.courseTitle && (
                          <p className="text-[11px] text-indigo-400 font-semibold mt-0.5 truncate">
                            📘 {notif.courseTitle}
                          </p>
                        )}

                        {/* Message */}
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Time */}
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <FiClock className="w-2.5 h-2.5" />
                          {notif.timeAgo}
                        </p>

                        {/* Action Buttons for review reminders */}
                        {notif.type === 'course_review_reminder' && (
                          <div className="flex items-center gap-2 mt-2.5">
                            <button
                              onClick={() => handleRateReview(notif)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-500 text-white text-[10px] font-extrabold rounded-xl shadow-md hover:opacity-90 transition"
                            >
                              <FiStar className="w-3 h-3 fill-white" /> Rate & Review
                            </button>
                            <button
                              onClick={() => handleRemindLater(notif._id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded-xl border border-slate-700 transition"
                            >
                              Remind Me Later
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 text-center">
                <p className="text-[10px] text-slate-500 font-medium">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
