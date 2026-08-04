const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a lesson title'],
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    resourceLink: {
      type: String,
      default: '',
    },
    sourceCode: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['video', 'pdf', 'quiz', 'assignment'],
      default: 'video',
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lesson', lessonSchema);
