const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    title: {
      type: String,
      required: [true, 'Please add a quiz title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    passingPercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    timeLimit: {
      type: Number, // in minutes (0 means no limit)
      default: 0,
    },
    maxAttempts: {
      type: Number, // 0 means unlimited
      default: 3,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
