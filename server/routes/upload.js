const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');

// ✅ Frontend base URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// ✅ Increase file size limit to 100MB
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ✅ Upload route
router.post('/', upload.single('file'), async (req, res) => {
  const { password } = req.body;

  if (!req.file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // ⏳ Set expiration time to 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const file = new File({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      password: hashedPassword,
      expiresAt,
    });

    await file.save();

    // ✅ Return response
    res.json({
      message: 'File uploaded successfully',
      fileId: file._id,
      previewLink: `${FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${FRONTEND_URL}/download/${file._id}`
    });
  } catch (err) {
    console.error('❌ Upload error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Max 100MB allowed.' });
    }

    res.status(500).json({ error: 'Server error while uploading' });
  }
});

module.exports = router;
