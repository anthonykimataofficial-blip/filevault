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

// ✅ Multer temp storage (in memory)
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

    // ✅ Upload to Cloudinary
    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto', // handles pdf, mp3, mp4, etc.
      folder: 'filevault_uploads',
      public_id: path.parse(req.file.originalname).name, // Keep original name
      use_filename: true,
      unique_filename: false,
      overwrite: true
    });

    // ✅ Delete temp file from local after upload
    fs.unlinkSync(req.file.path);

    // ✅ Ensure URL ends with proper file extension
    let finalUrl = cloudResult.secure_url;
    const ext = path.extname(req.file.originalname);
    if (ext && !finalUrl.endsWith(ext)) {
      finalUrl += ext;
    }

    // ✅ Save file metadata to MongoDB
    const file = new File({
      originalName: req.file.originalname,
      storedName: cloudResult.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: finalUrl, // Cloudinary URL (fixed)
      password: hashedPassword,
      expiresAt,
    });

    await file.save();

    // ✅ Return response
    res.json({
      message: 'File uploaded successfully ✅',
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
