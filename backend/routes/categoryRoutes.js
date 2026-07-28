const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/', protect, authorize('Admin'), createCategory);
router.put('/:id', protect, authorize('Admin'), updateCategory);
router.delete('/:id', protect, authorize('Admin'), deleteCategory);

module.exports = router;
