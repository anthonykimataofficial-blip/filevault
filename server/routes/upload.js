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

// ✅ Multer temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// ✅ Upload route
router.post('/', upload.single('file'), async (req, res) => {
  const { password } = req.body;

  if (!req.file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`📤 Uploading "${req.file.originalname}" (${req.file.mimetype}, ${req.file.size} bytes)`);

    // ✅ Try Cloudinary upload
    let cloudResult;
    try {
      cloudResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'filevault_uploads',
      });
      console.log('✅ Cloudinary upload success:', cloudResult.secure_url);
    } catch (cloudErr) {
      console.error('❌ Cloudinary upload failed:', cloudErr.message);
    }

    // ✅ Delete local temp file
    fs.unlinkSync(req.file.path);

    // ✅ If Cloudinary failed, fallback to local URL
    const finalUrl = cloudResult?.secure_url
      ? cloudResult.secure_url
      : `${process.env.BACKEND_URL || 'https://filevault-backend-a7w4.onrender.com'}/files/${req.file.filename}`;

    const file = new File({
      originalName: req.file.originalname,
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
        : '⚠️ Cloudinary upload failed; used fallback local URL.',
      fileId: file._id,
      previewLink: `${FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${FRONTEND_URL}/download/${file._id}`,
    });
  } catch (err) {
    console.error('❌ Upload route error:', err.message);
    res.status(500).json({ error: 'Server error while uploading' });
  }
});

// 🔍 TEMP route to check Cloudinary connection
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
