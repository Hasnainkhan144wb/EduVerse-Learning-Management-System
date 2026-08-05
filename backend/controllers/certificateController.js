const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const Enrolment = require('../models/Enrolment');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const QuizAttempt = require('../models/QuizAttempt');

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

      // Gold Outer Border
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .strokeColor('#d97706')
        .lineWidth(4)
        .stroke();

      // Inner Blue Border
      doc
        .rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .strokeColor('#1e3a8a')
        .lineWidth(1.5)
        .stroke();

      // Header Branding
      doc
        .fillColor('#1e3a8a')
        .fontSize(30)
        .text('EduVerse LMS', 0, 75, { align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(14)
        .text('PROFESSIONAL CERTIFICATE OF COMPLETION', 0, 115, { align: 'center' });

      // Sub-text
      doc
        .fillColor('#475569')
        .fontSize(13)
        .text('This official certificate is proudly presented to', 0, 160, { align: 'center' });

      // Student Name
      doc
        .fillColor('#0f172a')
        .fontSize(28)
        .text(studentName, 0, 190, { align: 'center' });

      doc
        .fillColor('#475569')
        .fontSize(13)
        .text('for successfully completing the accredited course', 0, 235, { align: 'center' });

      // Course Title
      doc
        .fillColor('#2563eb')
        .fontSize(22)
        .text(`"${courseTitle}"`, 0, 265, { align: 'center' });

      // Verification & Issue Details
      const dateString = new Date(issueDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      doc
        .fillColor('#475569')
        .fontSize(11)
        .text(`Completion Date: ${dateString}`, 70, 420);

      doc
        .fillColor('#475569')
        .fontSize(11)
        .text(`Instructor: ${instructorName}`, 70, 440);

      doc
        .fillColor('#64748b')
        .fontSize(10)
        .text(`Certificate ID: ${certificateId}`, doc.page.width - 280, 420, {
          align: 'right',
        });

      doc
        .fillColor('#059669')
        .fontSize(11)
        .text('Status: Verified & Authenticated ✓', doc.page.width - 280, 440, {
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

// @desc    Generate PDF Certificate for a 100% completed course
// @route   POST /api/certificates/generate/:courseId
// @access  Private (Student)
const generateCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Verify course enrollment & 100% progress
    const enrolment = await Enrolment.findOne({
      $or: [{ studentId, courseId }, { student: studentId, course: courseId }],
    });

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
    let certificate = await Certificate.findOne({
      $or: [{ studentId, courseId }, { student: studentId, course: courseId }],
    });

    if (certificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated',
        data: certificate,
      });
    }

    const course = await Course.findById(courseId).populate('instructorRef', 'name');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const student = await User.findById(studentId);

    // Create unique Certificate ID
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const certificateId = `CERT-2026-${randomHex}`;

    // PDF Output directory setup
    const certificatesDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const pdfFileName = `cert-${certificateId}.pdf`;
    const outputPath = path.join(certificatesDir, pdfFileName);
    const certificateUrl = `/uploads/certificates/${pdfFileName}`;

    await generateCertificatePDF({
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructorRef ? course.instructorRef.name : 'EduVerse Faculty',
      issueDate: new Date(),
      certificateId,
      outputPath,
    });

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
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in student certificates (auto-ensures records for 100% completed courses)
// @route   GET /api/certificates AND GET /api/certificates/my-certificates
// @access  Private (Student)
const getMyCertificates = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch enrolments with 100% progress
    const completedEnrolments = await Enrolment.find({
      $or: [{ studentId }, { student: studentId }],
      progressPercentage: { $gte: 100 },
    });

    // 2. Auto-generate certificate documents for any completed course missing a certificate
    for (const enrolment of completedEnrolments) {
      const cId = enrolment.courseId;
      if (!cId) continue;

      const existingCert = await Certificate.findOne({
        $or: [{ studentId, courseId: cId }, { student: studentId, course: cId }],
      });

      if (!existingCert) {
        try {
          const course = await Course.findById(cId).populate('instructorRef', 'name');
          const student = await User.findById(studentId);
          if (course && student) {
            const randomHex = Math.floor(100000 + Math.random() * 900000);
            const certificateId = `CERT-2026-${randomHex}`;
            const certificatesDir = path.join(__dirname, '../uploads/certificates');
            if (!fs.existsSync(certificatesDir)) {
              fs.mkdirSync(certificatesDir, { recursive: true });
            }
            const pdfFileName = `cert-${certificateId}.pdf`;
            const outputPath = path.join(certificatesDir, pdfFileName);
            const certificateUrl = `/uploads/certificates/${pdfFileName}`;

            await generateCertificatePDF({
              studentName: student.name,
              courseTitle: course.title,
              instructorName: course.instructorRef ? course.instructorRef.name : 'EduVerse Faculty',
              issueDate: enrolment.updatedAt || new Date(),
              certificateId,
              outputPath,
            });

            await Certificate.create({
              studentId,
              courseId: cId,
              issueDate: enrolment.updatedAt || new Date(),
              certificateUrl,
              certificateId,
            });
          }
        } catch (genErr) {
          console.error('📢 Auto certificate gen error:', genErr.message);
        }
      }
    }

    // 3. Query all certificates for student with populated fields
    const certificates = await Certificate.find({
      $or: [{ studentId }, { student: studentId }],
    })
      .populate({
        path: 'courseId',
        select: 'title description thumbnail price level status categoryRef instructorRef averageRating',
        populate: [
          { path: 'instructorRef', select: 'name email avatar' },
          { path: 'categoryRef', select: 'name slug' },
        ],
      })
      .populate('studentId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Format certificates payload with quiz & course stats
    const formatted = await Promise.all(
      certificates.map(async (cert) => {
        const course = cert.courseId || {};
        const student = cert.studentId || {};
        const cId = course._id;

        let totalSecondsSpent = 0;
        if (cId) {
          const enr = await Enrolment.findOne({
            $or: [{ studentId, courseId: cId }, { student: studentId, course: cId }],
          });
          if (enr) totalSecondsSpent = enr.totalSecondsSpent || 0;
        }

        let quizAvgScore = 0;
        if (cId) {
          const attempts = await QuizAttempt.find({
            $or: [{ studentId }, { student: studentId }],
            courseId: cId,
          });
          if (attempts.length > 0) {
            const sum = attempts.reduce((acc, curr) => acc + (curr.scorePercentage || 0), 0);
            quizAvgScore = Math.round(sum / attempts.length);
          }
        }

        return {
          _id: cert._id,
          certificateId: cert.certificateId,
          certificateUrl: cert.certificateUrl,
          issueDate: cert.issueDate || cert.createdAt,
          createdAt: cert.createdAt,
          studentName: student.name || req.user.name || 'Student',
          studentEmail: student.email || req.user.email || '',
          course: {
            _id: course._id,
            title: course.title || 'Course Certificate',
            description: course.description || '',
            thumbnail: course.thumbnail || '',
            level: course.level || 'All Levels',
            categoryName: course.categoryRef?.name || 'General',
            instructorName: course.instructorRef?.name || 'EduVerse Instructor',
            instructorAvatar: course.instructorRef?.avatar || '',
          },
          totalSecondsSpent,
          quizAvgScore,
          progressPercentage: 100,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
      certificates: formatted,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get certificate by ID or Certificate Code
// @route   GET /api/certificates/:certificateId
// @access  Private (Student/Admin)
const getCertificateById = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [{ _id: certificateId }, { certificateId }],
    })
      .populate({
        path: 'courseId',
        select: 'title description thumbnail price level status categoryRef instructorRef averageRating',
        populate: [
          { path: 'instructorRef', select: 'name email avatar' },
          { path: 'categoryRef', select: 'name slug' },
        ],
      })
      .populate('studentId', 'name email avatar');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download Certificate PDF file
// @route   GET /api/certificates/:certificateId/pdf
// @access  Private (Student/Admin)
const downloadCertificatePDF = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [{ _id: certificateId }, { certificateId }],
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const filePath = path.join(__dirname, '..', certificate.certificateUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Certificate PDF asset not found on server' });
    }

    res.download(filePath, `EduVerse-Certificate-${certificate.certificateId}.pdf`);
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify certificate by certificate ID (Public Endpoint)
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [{ certificateId }, { _id: certificateId }],
    })
      .populate('studentId', 'name email avatar')
      .populate({
        path: 'courseId',
        select: 'title description thumbnail instructorRef categoryRef level',
        populate: [
          { path: 'instructorRef', select: 'name email avatar' },
          { path: 'categoryRef', select: 'name' },
        ],
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid certificate ID or certificate record not found',
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentId?.name || 'Verified Learner',
        courseTitle: certificate.courseId?.title || 'Accredited Course',
        instructorName: certificate.courseId?.instructorRef?.name || 'EduVerse Faculty',
        issueDate: certificate.issueDate || certificate.createdAt,
        status: 'AUTHENTIC & VERIFIED ✓',
        categoryName: certificate.courseId?.categoryRef?.name || 'General',
        level: certificate.courseId?.level || 'All Levels',
        verificationUrl: `/verify-certificate/${certificate.certificateId}`,
      },
    });
  } catch (error) {
    if (typeof next === 'function') next(error);
    else res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  downloadCertificatePDF,
  verifyCertificate,
};
