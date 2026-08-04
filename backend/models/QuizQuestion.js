const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Please add question text'],
      trim: true,
    },
    options: {
      type: [String],
      validate: [
        (val) => Array.isArray(val) && val.length >= 2,
        'Questions must have at least 2 options',
      ],
      required: true,
    },
    correctOption: {
      type: Number,
      required: true,
      default: 0,
    },
    correctAnswers: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
      default: '',
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

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
