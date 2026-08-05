const express = require('express');
const router = express.Router();
const {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  downloadCertificatePDF,
  verifyCertificate,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// Public verification route
router.get('/verify/:certificateId', verifyCertificate);

// Protected student routes
router.get('/', protect, getMyCertificates);
router.get('/my-certificates', protect, getMyCertificates);
router.post('/generate/:courseId', protect, generateCertificate);
router.get('/:certificateId/pdf', protect, downloadCertificatePDF);
router.get('/:certificateId', protect, getCertificateById);

module.exports = router;
