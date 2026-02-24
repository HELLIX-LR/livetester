const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload Middleware for Screenshot Files
 * Handles multipart/form-data for image uploads
 * Requirements: 20.2, 20.3
 */

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${timestamp}-${random}-${name}${ext}`;
    cb(null, filename);
  }
});

// File filter for image types (Requirements 20.2)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Неподдерживаемый формат файла. Разрешены только PNG, JPG, JPEG, GIF');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer with limits (Requirements 20.3)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB in bytes
    files: 1 // Only one file per request
  }
});

/**
 * Middleware for single screenshot upload
 * Usage: upload.single('screenshot')
 */
const uploadScreenshot = upload.single('screenshot');

/**
 * Error handling wrapper for multer
 * Converts multer errors to consistent format
 */
const handleUploadError = (req, res, next) => {
  uploadScreenshot(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);

      // Handle different types of multer errors
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(400).json({
              success: false,
              error: {
                code: 'FILE_TOO_LARGE',
                message: 'Размер файла превышает максимально допустимый (5 МБ)',
                details: [{ field: 'screenshot', message: 'Максимальный размер файла: 5 МБ' }]
              }
            });
          case 'LIMIT_FILE_COUNT':
            return res.status(400).json({
              success: false,
              error: {
                code: 'TOO_MANY_FILES',
                message: 'Можно загрузить только один файл за раз',
                details: [{ field: 'screenshot', message: 'Максимум 1 файл за запрос' }]
              }
            });
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              success: false,
              error: {
                code: 'UNEXPECTED_FIELD',
                message: 'Неожиданное поле файла',
                details: [{ field: 'screenshot', message: 'Используйте поле "screenshot" для загрузки' }]
              }
            });
          default:
            return res.status(400).json({
              success: false,
              error: {
                code: 'UPLOAD_ERROR',
                message: 'Ошибка загрузки файла',
                details: [{ field: 'screenshot', message: err.message }]
              }
            });
        }
      }

      // Handle custom file type errors
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: err.message,
            details: [{ field: 'screenshot', message: 'Разрешены форматы: PNG, JPG, JPEG, GIF' }]
          }
        });
      }

      // Handle other errors
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Произошла ошибка при загрузке файла'
        }
      });
    }

    // No error, continue to next middleware
    next();
  });
};

/**
 * Validate uploaded file exists
 * Should be used after handleUploadError
 */
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'Файл не был загружен',
        details: [{ field: 'screenshot', message: 'Необходимо выбрать файл для загрузки' }]
      }
    });
  }

  next();
};

module.exports = {
  uploadScreenshot: handleUploadError,
  validateUploadedFile,
  uploadsDir
};