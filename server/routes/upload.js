// server/routes/upload.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const File = require('../models/File');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ✅ Multer memory storage (so files are not saved locally)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ✅ Helper to upload buffer directly to Cloudinary
const uploadToCloudinary = (buffer, folder, originalname) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // auto-detect (image, video, audio, etc.)
        public_id: originalname.split('.')[0],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ✅ Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  const { password } = req.body;

  if (!req.file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  try {
    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ☁️ Upload to Cloudinary
    const cloudResult = await uploadToCloudinary(
      req.file.buffer,
      'filevault_uploads',
      req.file.originalname
    );

    // ⏳ Set 24-hour expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 💾 Save record in MongoDB
    const file = new File({
      originalName: req.file.originalname,
      storedName: cloudResult.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: cloudResult.secure_url, // now the Cloudinary URL
      password: hashedPassword,
      expiresAt,
    });

    await file.save();

    // ✅ Send response
    res.json({
      message: 'File uploaded successfully ☁️',
      fileId: file._id,
      previewLink: `${FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${FRONTEND_URL}/download/${file._id}`,
    });
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err);
    res.status(500).json({ error: 'Server error while uploading' });
  }
});

module.exports = router;
