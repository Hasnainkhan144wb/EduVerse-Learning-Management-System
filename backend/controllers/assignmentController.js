const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Lesson = require('../models/Lesson');

// @desc    Create assignment for a lesson
// @route   POST /api/assignments
// @access  Private (Instructor/Admin)
const createAssignment = async (req, res, next) => {
  try {
    const { lessonId, title, instructions, totalMarks, dueDate } = req.body;

    if (!lessonId || !title || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lessonId, title, and instructions',
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const assignment = await Assignment.create({
      lessonId,
      title,
      instructions,
      totalMarks: totalMarks || 100,
      dueDate: dueDate || null,
    });

    lesson.type = 'assignment';
    await lesson.save();

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignment by lesson ID
// @route   GET /api/assignments/lesson/:lessonId
// @access  Private
const getAssignmentByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const assignment = await Assignment.findOne({ lessonId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No assignment found for this lesson',
      });
    }

    // Check if student has already submitted
    let studentSubmission = null;
    if (req.user) {
      studentSubmission = await Submission.findOne({
        assignmentId: assignment._id,
        studentId: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submission: studentSubmission,
      },
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit assignment (file upload / file URL & notes)
// @route   POST /api/assignments/submit OR POST /api/assignments/:assignmentId/submit
// @access  Private (Student)
const submitAssignment = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    let assignmentId = req.params.assignmentId || req.body.assignmentId;
    const { lessonId, courseId, solutionUrl, documentUrl, fileUrl: bodyFileUrl, comments, notes } = req.body;

    let uploadedFile = req.file;
    if (!uploadedFile && req.files && req.files.length > 0) {
      uploadedFile = req.files[0];
    }

    let finalFileUrl = solutionUrl || documentUrl || bodyFileUrl || '';
    if (uploadedFile) {
      finalFileUrl = `/uploads/assignments/${uploadedFile.filename}`;
    }

    const submissionNotes = comments || notes || '';

    if (!finalFileUrl && !submissionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a document file or provide a valid solution URL.',
      });
    }

    let assignment = null;
    if (assignmentId && mongoose.Types.ObjectId.isValid(assignmentId)) {
      assignment = await Assignment.findById(assignmentId);
    }

    if (!assignment && lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      assignment = await Assignment.findOne({ lessonId });
      if (!assignment) {
        // Auto-create assignment record for lesson if not exists
        const lesson = await Lesson.findById(lessonId);
        assignment = await Assignment.create({
          lessonId,
          title: lesson?.title || 'Assignment Task',
          instructions: lesson?.description || lesson?.notes || 'Complete assignment submission.',
          totalMarks: 100,
        });
      }
    }

    // If still no assignment, create a fallback assignment record safely
    if (!assignment) {
      const fallbackLessonId = (lessonId && mongoose.Types.ObjectId.isValid(lessonId))
        ? lessonId
        : new mongoose.Types.ObjectId();
      assignment = await Assignment.create({
        lessonId: fallbackLessonId,
        title: 'Course Assignment Submission',
        instructions: 'Direct student assignment submission.',
        totalMarks: 100,
      });
    }

    assignmentId = assignment._id;

    // Upsert submission
    let submission = await Submission.findOne({ assignmentId, studentId });

    if (submission) {
      submission.fileUrl = finalFileUrl || submission.fileUrl || 'N/A';
      submission.notes = submissionNotes || submission.notes;
      submission.status = 'Submitted';
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId,
        studentId,
        fileUrl: finalFileUrl || 'N/A',
        notes: submissionNotes,
        status: 'Submitted',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully!',
      submission,
      data: submission,
    });
  } catch (error) {
    console.error('🔥 Assignment Submit Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while saving assignment.',
    });
  }
};

// @desc    Get submissions for an assignment (Instructor)
// @route   GET /api/assignments/:assignmentId/submissions
// @access  Private (Instructor/Admin)
const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student's assignment submissions
// @route   GET /api/assignments/my-submissions
// @access  Private (Student)
const getMySubmissions = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const submissions = await Submission.find({ studentId })
      .populate({
        path: 'assignmentId',
        select: 'title instructions totalMarks dueDate lessonId',
        populate: {
          path: 'lessonId',
          select: 'title courseId',
          populate: { path: 'courseId', select: 'title' },
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/submissions/:submissionId/grade
// @access  Private (Instructor/Admin)
const gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, status } = req.body;

    let submission = await Submission.findById(submissionId).populate(
      'assignmentId'
    );
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    if (marks !== undefined) {
      if (marks < 0 || marks > submission.assignmentId.totalMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks must be between 0 and ${submission.assignmentId.totalMarks}`,
        });
      }
      submission.marks = marks;
    }

    if (feedback !== undefined) submission.feedback = feedback;
    submission.status = status || 'Graded';

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAssignment,
  getAssignmentByLesson,
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  gradeSubmission,
};
