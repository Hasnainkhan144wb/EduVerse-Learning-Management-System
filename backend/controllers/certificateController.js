const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const Enrolment = require('../models/Enrolment');
const Course = require('../models/Course');
const User = require('../models/User');

// Helper to generate elegant PDF certificate using PDFKit
const generateCertificatePDF = ({
  studentName,
  courseTitle,
  instructorName,
  issueDate,
  certificateId,
  outputPath,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Background border styling
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .strokeColor('#3b82f6')
        .lineWidth(4)
        .stroke();

      doc
        .rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .strokeColor('#1e3a8a')
        .lineWidth(1)
        .stroke();

      // Header Branding
      doc
        .fillColor('#1e3a8a')
        .fontSize(32)
        .text('EduVerse LMS', 0, 80, { align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(16)
        .text('CERTIFICATE OF COMPLETION', 0, 125, { align: 'center' });

      // Sub-text
      doc
        .fillColor('#475569')
        .fontSize(14)
        .text('This is to certify that', 0, 175, { align: 'center' });

      // Student Name
      doc
        .fillColor('#0f172a')
        .fontSize(28)
        .text(studentName, 0, 205, { align: 'center' });

      doc
        .fillColor('#475569')
        .fontSize(14)
        .text('has successfully completed the course', 0, 250, { align: 'center' });

      // Course Title
      doc
        .fillColor('#2563eb')
        .fontSize(22)
        .text(`"${courseTitle}"`, 0, 280, { align: 'center' });

      // Issue details & Signatures
      const dateString = new Date(issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc
        .fillColor('#475569')
        .fontSize(11)
        .text(`Issued Date: ${dateString}`, 80, 420);

      doc
        .fillColor('#475569')
        .fontSize(11)
        .text(`Instructor: ${instructorName}`, 80, 440);

      doc
        .fillColor('#64748b')
        .fontSize(10)
        .text(`Certificate ID: ${certificateId}`, doc.page.width - 280, 420, {
          align: 'right',
        });

      doc
        .fillColor('#059669')
        .fontSize(11)
        .text('Verified by EduVerse Learning Platform', doc.page.width - 280, 440, {
          align: 'right',
        });

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// @desc    Generate PDF Certificate for completed course
// @route   POST /api/certificates/generate/:courseId
// @access  Private (Student)
const generateCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Verify course enrollment & 100% progress
    const enrolment = await Enrolment.findOne({ studentId, courseId });
    if (!enrolment) {
      return res.status(404).json({
        success: false,
        message: 'Enrolment record not found for this course',
      });
    }

    if (enrolment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: `Course progress is ${enrolment.progressPercentage}%. Certificate requires 100% progress.`,
      });
    }

    // Check if certificate already generated
    let certificate = await Certificate.findOne({ studentId, courseId });
    if (certificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated',
        data: certificate,
      });
    }

    const course = await Course.findById(courseId).populate(
      'instructorRef',
      'name'
    );
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const student = await User.findById(studentId);

    // Create unique Certificate ID
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certificateId = `EDU-${Date.now().toString().slice(-6)}-${randomHex}`;

    // PDF Output directory setup
    const certificatesDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const pdfFileName = `cert-${certificateId}.pdf`;
    const outputPath = path.join(certificatesDir, pdfFileName);
    const certificateUrl = `/uploads/certificates/${pdfFileName}`;

    // Generate PDF document
    await generateCertificatePDF({
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructorRef ? course.instructorRef.name : 'EduVerse Faculty',
      issueDate: new Date(),
      certificateId,
      outputPath,
    });

    // Save Certificate in Database
    certificate = await Certificate.create({
      studentId,
      courseId,
      issueDate: new Date(),
      certificateUrl,
      certificateId,
    });

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully!',
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in student certificates
// @route   GET /api/certificates/my-certificates
// @access  Private
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ studentId: req.user._id })
      .populate('courseId', 'title thumbnail categoryRef')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify certificate by certificate ID
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title description thumbnail instructorRef')
      .populate({
        path: 'courseId',
        populate: { path: 'instructorRef', select: 'name' },
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid certificate ID or certificate not found',
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
};
