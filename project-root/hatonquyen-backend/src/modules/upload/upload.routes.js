const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');

const router = express.Router();

const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mimeType = String(file.mimetype || '').toLowerCase();
    const isImage = mimeType.startsWith('image/');
    const isAudio = mimeType.startsWith('audio/');

    if (!isImage && !isAudio) {
      const error = new Error('Only image/* and audio/* files are allowed');
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.post('/', verifyAccessToken, requireRole('ADMIN', 'OWNER'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  return res.status(200).json({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url,
    },
  });
});

module.exports = router;
