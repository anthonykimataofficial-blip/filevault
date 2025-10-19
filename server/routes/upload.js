// server/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const File = require('../models/File'); // ✅ import the model

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ Detect environment and use proper frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.post('/', upload.single('file'), async (req, res) => {
  const { password, expiresIn } = req.body;

  if (!req.file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  try {
    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ⏳ Optional expiration logic
    const expiresAt = expiresIn
      ? new Date(Date.now() + parseInt(expiresIn) * 60 * 1000)
      : null;

    // 💾 Save to MongoDB
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

    // ✅ Send back preview and download links using the correct domain
    res.json({
      message: 'File uploaded successfully',
      fileId: file._id,
      previewLink: `${FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${FRONTEND_URL}/download/${file._id}`
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Server error while uploading' });
  }
});

module.exports = router;
