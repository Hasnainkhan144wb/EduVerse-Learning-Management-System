const Discussion = require('../models/Discussion');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// @desc    Get questions for instructor's courses
// @route   GET /api/questions/instructor
// @access  Private (Instructor/Admin)
const getInstructorQuestions = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // Find all courses created by this instructor
    const myCourses = await Course.find({ instructorRef: instructorId }).select('_id title');
    const myCourseIds = myCourses.map((c) => c._id);

    const query = myCourseIds.length > 0 ? { courseId: { $in: myCourseIds } } : {};

    const questions = await Discussion.find(query)
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title')
      .populate('lessonId', 'title')
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

// @desc    Reply to a student question & trigger notification
// @route   POST /api/questions/:id/reply
// @access  Private (Instructor/Admin)
const replyQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a reply message',
      });
    }

    const question = await Discussion.findById(id).populate('courseId', 'title');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Discussion question not found',
      });
    }

    // Add reply to array
    question.replies.push({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      replyText,
      createdAt: new Date(),
    });

    question.status = 'Answered';
    await question.save();

    // Trigger notification to student
    try {
      await Notification.create({
        recipientId: question.studentId,
        title: `Instructor replied to your question in ${question.courseId?.title || 'Course'}`,
        message: replyText.substring(0, 100) + '...',
        isRead: false,
      });
    } catch (notifErr) {
      console.error('Notification trigger error:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Reply posted successfully',
      data: question,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Post a new student question
// @route   POST /api/questions
// @access  Private (Student)
const createQuestion = async (req, res, next) => {
  try {
    const { courseId, lessonId, questionText } = req.body;

    if (!courseId || !questionText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and questionText',
      });
    }

    const question = await Discussion.create({
      courseId,
      lessonId: lessonId || null,
      studentId: req.user._id,
      questionText,
      status: 'Unanswered',
      replies: [],
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstructorQuestions,
  replyQuestion,
  createQuestion,
};
