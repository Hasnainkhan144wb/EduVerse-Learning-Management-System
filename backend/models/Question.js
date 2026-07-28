const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Please add question text'],
    },
    type: {
      type: String,
      enum: ['MCQ', 'TrueFalse', 'FillBlank'],
      required: true,
      default: 'MCQ',
    },
    options: [
      {
        type: String,
      },
    ],
    correctAnswers: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Please specify the correct answer(s)'],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
