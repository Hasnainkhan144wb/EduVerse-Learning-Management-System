const Question = require('../models/Question');
const Course = require('../models/Course');

// @desc    Create a new Q&A discussion question
// @route   POST /api/questions
// @access  Private (Student)
const createQuestion = async (req, res, next) => {
  try {
    const { courseId, lessonId, title, question } = req.body;

    if (!courseId || !title || !question) {
      return res.status(400).json({ success: false, message: 'Please provide course, title, and question details' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const instructorId = course.instructorRef || course.instructor;

    const newQuestion = await Question.create({
      course: courseId,
      lesson: lessonId || null,
      student: req.user._id,
      instructor: instructorId,
      title,
      question,
    });

    const populated = await Question.findById(newQuestion._id)
      .populate('course', 'title thumbnail')
      .populate('lesson', 'title')
      .populate('instructor', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      data: populated,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all questions posted by currently logged-in student
// @route   GET /api/questions/student
// @access  Private (Student)
const getStudentQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ student: req.user._id })
      .populate('course', 'title thumbnail')
      .populate('lesson', 'title')
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all questions assigned to currently logged-in instructor
// @route   GET /api/questions/instructor
// @access  Private (Instructor / Admin)
const getInstructorQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ instructor: req.user._id })
      .populate('course', 'title thumbnail')
      .populate('lesson', 'title')
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Instructor reply to a student question
// @route   PATCH /api/questions/:id/reply
// @access  Private (Instructor / Admin)
const replyQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter an answer response' });
    }

    const questionItem = await Question.findById(id);
    if (!questionItem) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    questionItem.answer = answer;
    questionItem.isAnswered = true;
    await questionItem.save();

    const updated = await Question.findById(id)
      .populate('course', 'title thumbnail')
      .populate('lesson', 'title')
      .populate('student', 'name email avatar')
      .populate('instructor', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Reply submitted successfully',
      data: updated,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuestion,
  getStudentQuestions,
  getInstructorQuestions,
  replyQuestion,
};
