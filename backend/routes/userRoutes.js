const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected Profile Update Route
router.put('/profile', protect, updateUserProfile);

module.exports = router;
