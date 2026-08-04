const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Category = require('../models/Category');

// @desc    Get published courses with search, filters, pagination
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res, next) => {
  try {
    const { keyword, category, level, status, sort, page = 1, limit = 10 } = req.query;

    const conditions = [];

    // Filter by status (flexible published & approved status matching)
    if (status && status !== 'All' && status !== 'Published') {
      try {
        conditions.push({
          $or: [
            { status: new RegExp(`^${status}$`, 'i') },
            { isPublished: status === 'true' }
          ]
        });
      } catch (e) {
        conditions.push({ status });
      }
    } else {
      conditions.push({
        $or: [
          { status: new RegExp('^published$', 'i') },
          { status: 'Published' },
          { status: 'published' },
          { status: 'Approved' },
          { isPublished: true },
          { isApproved: true }
        ],
      });
    }

    // Search keyword in title or description
    if (keyword) {
      conditions.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      });
    }

    // Category filter: support ObjectId, slug, or name lookup
    if (category && category !== 'all' && category !== 'All') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category)) {
        conditions.push({
          $or: [{ categoryRef: category }, { category: category }]
        });
      } else {
        const foundCat = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: new RegExp(`^${category}$`, 'i') }
          ]
        });
        if (foundCat) {
          conditions.push({
            $or: [{ categoryRef: foundCat._id }, { category: foundCat._id }]
          });
        }
      }
    }

    // Level filter
    if (level && level !== 'All') {
      conditions.push({ level: new RegExp(`^${level}$`, 'i') });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    let courses = [];
    try {
      courses = await Course.find(query)
        .populate('instructorRef', 'name avatar email')
        .populate('categoryRef', 'name slug')
        .sort(sortOption)
        .lean();
    } catch (dbErr) {
      console.warn('⚠️ Course query filter fallback to basic query:', dbErr.message);
      courses = await Course.find()
        .populate('instructorRef', 'name avatar email')
        .populate('categoryRef', 'name slug')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Sanitize instructor and category objects to prevent null crashes
    const sanitizedCourses = (courses || []).map((course) => {
      const inst = course.instructorRef || course.instructor || { name: 'Verified Instructor', avatar: '' };
      const cat = course.categoryRef || course.category || { name: 'General', slug: 'general' };
      return {
        ...course,
        instructorRef: inst,
        instructor: inst,
        categoryRef: cat,
        category: cat,
      };
    });

    const totalCount = sanitizedCourses.length;
    const paginatedCourses = sanitizedCourses.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      count: paginatedCourses.length,
      total: totalCount,
      courses: paginatedCourses,
      pages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      data: paginatedCourses,
    });
  } catch (error) {
    console.error('🔥 Error in getCourses Controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message,
    });
  }
};

// @desc    Get published courses safely for showcase
// @route   GET /api/courses/published
// @access  Public
const getPublishedCourses = async (req, res) => {
  try {
    const rawCourses = await Course.find({
      $or: [
        { status: 'Published' },
        { status: 'published' },
        { status: 'Approved' },
        { isApproved: true },
        { isPublished: true },
      ],
    })
      .populate('instructorRef', 'name email avatar')
      .populate('categoryRef', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📦 Raw Published Courses Found in MongoDB: ${rawCourses ? rawCourses.length : 0}`);

    const sanitized = (rawCourses || []).map((course) => {
      let instructorObj = { name: 'Verified Instructor', avatar: '' };
      if (course.instructorRef && typeof course.instructorRef === 'object' && course.instructorRef.name) {
        instructorObj = course.instructorRef;
      } else if (course.instructor && typeof course.instructor === 'object' && course.instructor.name) {
        instructorObj = course.instructor;
      }

      let categoryObj = { name: 'General', slug: 'general' };
      if (course.categoryRef && typeof course.categoryRef === 'object' && course.categoryRef.name) {
        categoryObj = course.categoryRef;
      } else if (course.category && typeof course.category === 'object' && course.category.name) {
        categoryObj = course.category;
      }

      return {
        ...course,
        instructorRef: instructorObj,
        instructor: instructorObj,
        categoryRef: categoryObj,
        category: categoryObj,
      };
    });

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      courses: sanitized,
      data: sanitized,
    });
  } catch (error) {
    console.error('🔥 Error in getPublishedCourses:', error);
    return res.status(200).json({
      success: true,
      count: 0,
      courses: [],
      data: [],
      message: 'Fallback triggered',
    });
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
      category,
      price,
      level,
      language,
      requirements,
      objectives,
    } = req.body;

    const targetCategory = categoryRef || category;

    if (!title || !description || !targetCategory) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    let finalThumbnail = thumbnail || '';
    if (req.file) {
      finalThumbnail = `/uploads/thumbnails/${req.file.filename}`;
    } else if (req.files && req.files.length > 0) {
      finalThumbnail = `/uploads/thumbnails/${req.files[0].filename}`;
    }

    let parsedObjectives = objectives || [];
    if (typeof parsedObjectives === 'string') {
      try {
        parsedObjectives = JSON.parse(parsedObjectives);
      } catch (e) {
        parsedObjectives = parsedObjectives.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    let parsedRequirements = requirements || [];
    if (typeof parsedRequirements === 'string') {
      try {
        parsedRequirements = JSON.parse(parsedRequirements);
      } catch (e) {
        parsedRequirements = parsedRequirements.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      thumbnail: finalThumbnail,
      instructorRef: req.user._id,
      categoryRef: targetCategory,
      price: price || 0,
      level: level || 'Beginner',
      language: language || 'English',
      requirements: parsedRequirements,
      objectives: parsedObjectives,
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

    const updateData = { ...req.body };

    if (req.file) {
      updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    } else if (req.files && req.files.length > 0) {
      updateData.thumbnail = `/uploads/thumbnails/${req.files[0].filename}`;
    }

    if (updateData.category) {
      updateData.categoryRef = updateData.category;
    }

    if (updateData.objectives && typeof updateData.objectives === 'string') {
      try {
        updateData.objectives = JSON.parse(updateData.objectives);
      } catch (e) {
        updateData.objectives = updateData.objectives.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (updateData.requirements && typeof updateData.requirements === 'string') {
      try {
        updateData.requirements = JSON.parse(updateData.requirements);
      } catch (e) {
        updateData.requirements = updateData.requirements.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    course = await Course.findByIdAndUpdate(req.params.id, updateData, {
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
  getPublishedCourses,
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
