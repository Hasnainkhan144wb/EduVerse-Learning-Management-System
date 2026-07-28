const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add an assignment title'],
      trim: true,
    },
    instructions: {
      type: String,
      required: [true, 'Please add assignment instructions'],
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
