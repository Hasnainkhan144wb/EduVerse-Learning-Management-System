const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Please add question text'],
    },
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: String,
        userRole: String,
        replyText: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Unanswered', 'Answered'],
      default: 'Unanswered',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Discussion', discussionSchema);
