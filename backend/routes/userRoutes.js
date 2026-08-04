const express = require('express');
const router = express.Router();
const {
  updateUserProfile,
  toggleWatchlist,
  getWatchlist,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected Profile Update Route
router.put('/profile', protect, updateUserProfile);

// Protected Watchlist & Wishlist Routes
router.post('/watchlist/toggle', protect, toggleWatchlist);
router.get('/watchlist', protect, getWatchlist);
router.post('/wishlist/toggle', protect, toggleWatchlist);
router.get('/wishlist', protect, getWatchlist);

module.exports = router;
