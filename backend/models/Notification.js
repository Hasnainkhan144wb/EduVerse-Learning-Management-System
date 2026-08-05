const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ['Admin', 'Student', 'Instructor', 'All'],
      default: 'Student',
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a notification title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please add a notification message'],
    },
    type: {
      type: String,
      enum: [
        'course_approval',
        'instructor_approval',
        'student_registration',
        'review_report',
        'support_ticket',
        'course_review_reminder',
        'review_submitted',
        'enrollment',
        'system',
        'general',
      ],
      default: 'general',
    },
    actionUrl: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
