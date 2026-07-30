const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/adminAuthController');

// Isolated Admin Login Route
router.post('/login', adminLogin);

module.exports = router;
