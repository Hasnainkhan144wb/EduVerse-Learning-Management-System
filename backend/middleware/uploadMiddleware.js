const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadBaseDir = path.join(__dirname, '../uploads');
const thumbnailsDir = path.join(uploadBaseDir, 'thumbnails');
const pdfsDir = path.join(uploadBaseDir, 'pdfs');
const assignmentsDir = path.join(uploadBaseDir, 'assignments');
const avatarsDir = path.join(uploadBaseDir, 'avatars');

[uploadBaseDir, thumbnailsDir, pdfsDir, assignmentsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail' || file.fieldname === 'image' || file.fieldname === 'avatar') {
      cb(null, file.fieldname === 'avatar' ? avatarsDir : thumbnailsDir);
    } else if (file.fieldname === 'pdf' || file.fieldname === 'document') {
      cb(null, pdfsDir);
    } else if (file.fieldname === 'assignment' || file.fieldname === 'submission') {
      cb(null, assignmentsDir);
    } else {
      cb(null, uploadBaseDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|doc|docx|zip|mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeTypeAllowed = allowedExtensions.test(ext);

  if (mimeTypeAllowed) {
    return cb(null, true);
  } else {
    cb(new Error(`File type '.${ext}' is not supported`));
  }
};

// Multer upload instances
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max file size limit
  },
  fileFilter,
});

module.exports = {
  uploadSingle: (fieldName) => upload.single(fieldName),
  uploadMultiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  uploadFields: (fieldsArray) => upload.fields(fieldsArray),
  upload,
};
