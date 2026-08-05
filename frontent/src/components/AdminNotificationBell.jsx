import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheckCircle, FiSearch, FiClock, FiCheck, FiArrowRight } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminNotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'unread', 'read'

  // Fetch admin notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'Admin') return;
    try {
      setLoading(true);
      const res = await api.get('/admin/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silent fail
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

  // Mark single notification read
  const markRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  // Mark all read
  const markAllRead = async () => {
    try {
      await api.put('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  // Dismiss / Delete single notification
  const dismissNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const target = notifications.find((n) => n._id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {}
  };

  // Handle Action Button click (Review Course / Review Instructor)
  const handleActionClick = async (notif) => {
    if (!notif.isRead) {
      await markRead(notif._id);
    }
    setOpen(false);

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else if (notif.type === 'course_approval') {
      navigate('/admin/courses');
    } else if (notif.type === 'instructor_approval' || notif.type === 'student_registration') {
      navigate('/admin/users');
    } else {
      navigate('/admin/dashboard');
    }
  };

  // Filtered Notifications list
  const filteredList = notifications.filter((n) => {
    if (filterTab === 'unread' && n.isRead) return false;
    if (filterTab === 'read' && !n.isRead) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(q);
      const msgMatch = n.message.toLowerCase().includes(q);
      const userMatch = (n.relatedUser?.name || '').toLowerCase().includes(q);
      const courseMatch = (n.relatedCourse?.title || '').toLowerCase().includes(q);
      return titleMatch || msgMatch || userMatch || courseMatch;
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'course_approval':
        return '📚';
      case 'instructor_approval':
        return '👨‍🏫';
      case 'student_registration':
        return '🎓';
      case 'review_report':
        return '🚩';
      case 'support_ticket':
        return '💬';
      default:
        return '🔔';
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition flex items-center justify-center border border-slate-800"
        aria-label="Admin Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Animated Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-[380px] max-w-[calc(100vw-24px)] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  <FiBell className="text-indigo-400 w-4 h-4" />
                  Admin Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-extrabold rounded-full border border-rose-500/30">
                      {unreadCount} pending
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                  >
                    <FiCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    filterTab === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    filterTab === 'unread' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilterTab('read')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    filterTab === 'read' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Read
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-800/60">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Loading notifications...</p>
                </div>
              ) : filteredList.length === 0 ? (
                /* EMPTY STATE */
                <div className="p-8 text-center space-y-2">
                  <span className="text-3xl">🔔</span>
                  <p className="text-slate-200 text-xs font-extrabold">No New Notifications</p>
                  <p className="text-slate-400 text-[11px] max-w-[260px] mx-auto leading-relaxed">
                    You're all caught up. New approval requests and system events will appear here.
                  </p>
                </div>
              ) : (
                filteredList.map((notif) => (
                  <div
                    key={notif._id}
                    className={`px-4 py-3.5 transition relative ${
                      !notif.isRead
                        ? 'bg-indigo-500/10 border-l-4 border-indigo-500 hover:bg-indigo-500/15'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className="w-9 h-9 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-base shrink-0 shadow">
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title & Dismiss */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-extrabold text-white leading-snug">
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
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

                        {/* Message */}
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-1 line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Time */}
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                          <FiClock className="w-2.5 h-2.5" />
                          {notif.timeAgo}
                        </p>

                        {/* Action Button */}
                        <div className="mt-2.5">
                          <button
                            onClick={() => handleActionClick(notif)}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-extrabold rounded-xl shadow transition inline-flex items-center gap-1"
                          >
                            {notif.type === 'course_approval'
                              ? 'Review Course'
                              : notif.type === 'instructor_approval'
                              ? 'Review Instructor'
                              : 'View Details'}{' '}
                            <FiArrowRight />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  Showing {filteredList.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotificationBell;
