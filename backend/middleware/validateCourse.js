// @desc    Middleware to validate course creation and update inputs
const validateCourseInput = (req, res, next) => {
  const { title, description, category, categoryRef, level, price, thumbnail } = req.body;
  const targetCategory = categoryRef || category;

  const errors = [];

  if (!title || String(title).trim() === '') {
    errors.push('Course Title is required.');
  }

  if (!description || String(description).trim() === '') {
    errors.push('Course Description is required.');
  }

  if (!targetCategory || String(targetCategory).trim() === '') {
    errors.push('Category must be selected.');
  }

  if (!level || String(level).trim() === '') {
    errors.push('Course Level must be selected.');
  }

  if (price === undefined || price === null || String(price).trim() === '') {
    errors.push('Price is required (enter 0 for free courses).');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Please fill all required fields.',
      errors,
    });
  }

  next();
};

module.exports = {
  validateCourseInput,
};
