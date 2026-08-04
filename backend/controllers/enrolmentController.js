const Enrolment = require('../models/Enrolment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

// @desc    Enrol student in a course
// @route   POST /api/enrolments/:courseId
// @access  Private (Student/Admin/Instructor)
const enrolStudent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    const userRole = req.user.role;

    // 1. Role Guard: Instructors & Admins cannot enroll as students
    if (userRole === 'Instructor' || userRole === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Instructors and Admins are not allowed to enroll in courses.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // 2. Ownership Guard
    const courseInstructorId = course.instructorRef || course.instructor;
    if (courseInstructorId && courseInstructorId.toString() === studentId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot enroll in your own course!',
      });
    }

    // 3. Check if already enrolled
    const existingEnrolment = await Enrolment.findOne({
      $or: [
        { studentId, courseId },
        { student: studentId, course: courseId },
      ],
    });

    if (existingEnrolment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
        data: existingEnrolment,
      });
    }

    // Create Enrolment record
    const enrolment = await Enrolment.create({
      studentId,
      courseId,
      progressPercentage: 0,
      completedLessons: [],
      totalSecondsSpent: 0,
      learningSessions: [],
    });

    // Add courseId to user's enrolledCourses array
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { enrolledCourses: courseId },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrolment,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student enrolled courses
// @route   GET /api/enrolments/my-courses
// @access  Private
const getMyEnrolments = async (req, res, next) => {
  try {
    const enrolments = await Enrolment.find({ studentId: req.user._id })
      .populate({
        path: 'courseId',
        select: 'title description thumbnail price level status instructorRef categoryRef',
        populate: [
          { path: 'instructorRef', select: 'name avatar' },
          { path: 'categoryRef', select: 'name slug' },
        ],
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: enrolments.length,
      data: enrolments,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get enrolment & progress details for specific course
// @route   GET /api/enrolments/course/:courseId
// @access  Private
const getEnrolmentProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrolment = await Enrolment.findOne({ studentId, courseId }).populate(
      'completedLessons',
      'title type'
    );

    if (!enrolment) {
      return res.status(404).json({
        success: false,
        message: 'Enrolment record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: enrolment,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark lesson as complete and recalculate course progress percentage
// @route   POST /api/enrolments/progress
// @access  Private
const markLessonComplete = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const studentId = req.user._id;

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both courseId and lessonId',
      });
    }

    let enrolment = await Enrolment.findOne({ studentId, courseId });
    if (!enrolment) {
      return res.status(404).json({
        success: false,
        message: 'Enrolment record not found. Please enrol in the course first.',
      });
    }

    // Add lessonId to completedLessons if not present
    if (!enrolment.completedLessons.includes(lessonId)) {
      enrolment.completedLessons.push(lessonId);
    }

    // Calculate total lessons in course
    const totalLessons = await Lesson.countDocuments({ courseId });

    if (totalLessons > 0) {
      const percentage = Math.round(
        (enrolment.completedLessons.length / totalLessons) * 100
      );
      enrolment.progressPercentage = Math.min(percentage, 100);
    } else {
      enrolment.progressPercentage = 100;
    }

    await enrolment.save();

    res.status(200).json({
      success: true,
      message: 'Lesson progress updated successfully',
      data: enrolment,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track real-time active learning time (Video, PDF, Quiz, Assignment)
// @route   POST /api/enrolments/track-time
// @access  Private (Student)
const trackLearningTime = async (req, res, next) => {
  try {
    const { courseId, lessonId, lessonType = 'video', secondsSpent = 0 } = req.body;
    const studentId = req.user._id;

    if (!courseId || secondsSpent <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and valid secondsSpent > 0',
      });
    }

    // Sanitize max bulk seconds per ping (e.g. max 120 seconds per single update ping)
    const sanitizedSeconds = Math.min(Math.max(1, Number(secondsSpent)), 120);

    let enrolment = await Enrolment.findOne({
      $or: [
        { studentId, courseId },
        { student: studentId, course: courseId },
      ],
    });

    if (!enrolment) {
      return res.status(404).json({
        success: false,
        message: 'Enrolment record not found',
      });
    }

    if (!enrolment.totalSecondsSpent) enrolment.totalSecondsSpent = 0;
    if (!enrolment.learningSessions) enrolment.learningSessions = [];

    enrolment.totalSecondsSpent += sanitizedSeconds;
    enrolment.totalMinutes = Math.round(enrolment.totalSecondsSpent / 60);

    if (lessonId) {
      const sessionIndex = enrolment.learningSessions.findIndex(
        (s) => s.lessonId && s.lessonId.toString() === lessonId.toString()
      );

      if (sessionIndex > -1) {
        enrolment.learningSessions[sessionIndex].secondsSpent += sanitizedSeconds;
        enrolment.learningSessions[sessionIndex].lastActiveAt = new Date();
      } else {
        enrolment.learningSessions.push({
          lessonId,
          lessonType,
          secondsSpent: sanitizedSeconds,
          lastActiveAt: new Date(),
        });
      }
    }

    await enrolment.save();

    res.status(200).json({
      success: true,
      message: 'Active learning time recorded successfully',
      totalSecondsSpent: enrolment.totalSecondsSpent,
      totalHoursSpent: parseFloat((enrolment.totalSecondsSpent / 3600).toFixed(1)),
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students enrolled in instructor's courses
// @route   GET /api/enrolments/instructor/students OR GET /api/instructor/students
// @access  Private (Instructor/Admin)
const getInstructorStudents = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // Find all courses created by this instructor
    const myCourses = await Course.find({
      $or: [{ instructorRef: instructorId }, { instructor: instructorId }],
    }).select('_id title');
    const myCourseIds = myCourses.map((c) => c._id);

    // Find all enrolments for these courses or all enrolments if admin/testing
    const query = myCourseIds.length > 0 ? { courseId: { $in: myCourseIds } } : {};

    const enrolments = await Enrolment.find(query)
      .populate({
        path: 'studentId',
        select: 'name email avatar role createdAt',
        match: { role: 'Student' }, // 🚨 ONLY POPULATE REAL STUDENTS
      })
      .populate('courseId', 'title thumbnail categoryRef')
      .sort({ createdAt: -1 });

    // Filter out enrolments where student populated to null (instructors/admins)
    const validEnrolments = enrolments.filter((e) => e.studentId !== null && e.studentId !== undefined);

    res.status(200).json({
      success: true,
      count: validEnrolments.length,
      data: validEnrolments,
      enrolments: validEnrolments,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  enrolStudent,
  getMyEnrolments,
  getEnrolmentProgress,
  markLessonComplete,
  trackLearningTime,
  getInstructorStudents,
};
