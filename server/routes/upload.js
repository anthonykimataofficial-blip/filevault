const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const File = require('../models/File');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// ✅ Frontend base URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------------------------
// ✅ FORCE CLOUDINARY TO KEEP FILENAME
// -------------------------------------
const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

// Multer: keep original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const cleaned = sanitize(path.parse(file.originalname).name);
    const ext = path.extname(file.originalname);
    const finalName = `${cleaned}-${Date.now()}${ext}`;
    cb(null, finalName);
  },
});

// No upload limits
const upload = multer({
  storage,
  limits: {},
});

// -------------------------------------
// 🚀 Upload Route
// -------------------------------------
router.post('/', upload.single('file'), async (req, res) => {
  const { password } = req.body;

  if (!req.file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`📤 Uploading "${req.file.originalname}" (${req.file.mimetype}, ${req.file.size} bytes)`);

    // ----------------------------------------------------
    // ☑️ CLOUDINARY Upload — KEEP ORIGINAL NAME EXACTLY
    // ----------------------------------------------------
    let cloudResult;
    try {
      cloudResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw',
        folder: 'filevault_uploads',

        // 🔥 These 2 lines FORCE Cloudinary to keep the original exact filename
        use_filename: true,
        unique_filename: false,

        public_id: sanitize(path.parse(req.file.originalname).name),

        timeout: 1800000,
        chunk_size: 20 * 1024 * 1024,
      });

      console.log('✅ Cloudinary upload success:', cloudResult.secure_url);
    } catch (cloudErr) {
      console.error('❌ Cloudinary upload failed:', cloudErr.message);
    }

    // Delete temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      console.warn('⚠️ Could not delete temp file:', cleanupErr.message);
    }

    // Use Cloudinary link if available
    const finalUrl = cloudResult?.secure_url
      ? cloudResult.secure_url
      : `${process.env.BACKEND_URL || 'https://filevault-backend-a7w4.onrender.com'}/files/${req.file.filename}`;

    // -------------------------------------
    // 💾 Save Metadata
    // -------------------------------------
    const file = new File({
      originalName: req.file.originalname, // <-- IMPORTANT for filename download
      storedName: cloudResult?.public_id || req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: finalUrl,
      password: hashedPassword,
      expiresAt,
    });

    await file.save();

    res.json({
      message: cloudResult?.secure_url
        ? '✅ Uploaded to Cloudinary successfully'
        : '⚠️ Cloudinary upload failed; using local fallback URL.',
      fileId: file._id,
      previewLink: `${FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${FRONTEND_URL}/download/${file._id}`,
    });
  } catch (err) {
    console.error('❌ Upload route error:', err.message);
    res.status(500).json({ error: 'Server error while uploading' });
  }
});

// Cloudinary health check
router.get('/check-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ success: true, message: '✅ Cloudinary connected', result });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '❌ Cloudinary connection failed',
      error: err.message,
    });
  }
});

module.exports = router;
