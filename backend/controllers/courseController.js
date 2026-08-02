const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

// @desc    Get published courses with search, filters, pagination
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res, next) => {
  try {
    const { keyword, category, level, status, sort, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by status (default Published for public query unless specified by admin)
    if (status) {
      query.status = status;
    } else {
      query.status = 'Published';
    }

    // Search keyword in title or description
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.categoryRef = category;
    }

    // Level filter
    if (level) {
      query.level = level;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(query)
      .populate('instructorRef', 'name avatar email')
      .populate('instructor', 'name avatar email')
      .populate('categoryRef', 'name slug')
      .sort(sortOption);

    // Identify orphaned course IDs (where instructor is null/deleted)
    const orphanedCourseIds = courses
      .filter((course) => !course.instructorRef && !course.instructor)
      .map((course) => course._id);

    // Purge orphaned courses from DB immediately
    if (orphanedCourseIds.length > 0) {
      await Course.deleteMany({ _id: { $in: orphanedCourseIds } });
      console.log(`🧹 Automatically purged ${orphanedCourseIds.length} orphaned courses from DB.`);
    }

    // Filter array to send ONLY valid active instructor courses to frontend
    const validCourses = courses.filter(
      (course) => (course.instructorRef || course.instructor) != null
    );

    const totalCount = validCourses.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const paginatedCourses = validCourses.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedCourses.length,
      total: totalCount,
      courses: paginatedCourses,
      pages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      data: paginatedCourses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course detail by ID with complete section & lesson hierarchy
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorRef', 'name avatar email role')
      .populate('categoryRef', 'name slug description');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Fetch sections and populate lessons for each section
    const sections = await Section.find({ courseId: course._id }).sort({ order: 1, createdAt: 1 });
    
    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({ sectionId: section._id }).sort({ order: 1, createdAt: 1 });
        return {
          ...section.toObject(),
          lessons,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        sections: sectionsWithLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      thumbnail,
      categoryRef,
      price,
      level,
      language,
      requirements,
      objectives,
    } = req.body;

    if (!title || !description || !categoryRef) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    const course = await Course.create({
      title,
      description,
      thumbnail: thumbnail || '',
      instructorRef: req.user._id,
      categoryRef,
      price: price || 0,
      level: level || 'Beginner',
      language: language || 'English',
      requirements: requirements || [],
      objectives: objectives || [],
      status: 'Draft',
    });

    // Add created course ID to instructor's createdCourses array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id },
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor owner / Admin)
const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership or admin
    if (
      course.instructorRef.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor owner / Admin)
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (
      course.instructorRef.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
      });
    }

    // Cascade delete sections & lessons
    const sections = await Section.find({ courseId: course._id });
    const sectionIds = sections.map((s) => s._id);
    await Lesson.deleteMany({ sectionId: { $in: sectionIds } });
    await Section.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course and related content removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- SECTION CONTROLLERS ---

// @desc    Create section in course
// @route   POST /api/courses/:courseId/sections
// @access  Private (Instructor/Admin)
const createSection = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (
      course.instructorRef.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const section = await Section.create({
      courseId,
      title,
      order: order || 0,
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private (Instructor/Admin)
const updateSection = async (req, res, next) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.status(200).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private (Instructor/Admin)
const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    await Lesson.deleteMany({ sectionId: section._id });
    await section.deleteOne();

    res.status(200).json({ success: true, message: 'Section deleted' });
  } catch (error) {
    next(error);
  }
};

// --- LESSON CONTROLLERS ---

// @desc    Create lesson in section
// @route   POST /api/sections/:sectionId/lessons
// @access  Private (Instructor/Admin)
const createLesson = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { title, videoUrl, pdfUrl, notes, sourceCode, type, duration, order } = req.body;

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const lesson = await Lesson.create({
      sectionId,
      courseId: section.courseId,
      title,
      videoUrl: videoUrl || '',
      pdfUrl: pdfUrl || '',
      notes: notes || '',
      sourceCode: sourceCode || '',
      type: type || 'video',
      duration: duration || 0,
      order: order || 0,
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor/Admin)
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor/Admin)
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    await lesson.deleteOne();
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN CONTROLLERS ---

// @desc    Approve/Reject Course Publication
// @route   PUT /api/courses/:id/status
// @access  Private (Admin)
const updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Draft', 'Published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Draft or Published',
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject Instructor Account
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin)
const approveInstructor = async (req, res, next) => {
  try {
    const { isApproved } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isApproved = isApproved !== undefined ? isApproved : true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Instructor approval status set to ${user.isApproved}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCourseStatus,
  approveInstructor,
};
