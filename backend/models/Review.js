const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
    },
    instructorReply: {
      comment: {
        type: String,
        default: '',
      },
      repliedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// One review per student per course constraint
reviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
