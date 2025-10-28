// server/routes/upload-metadata.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const File = require('../models/File');

// ✅ Store only metadata (after client uploads directly to Cloudinary)
router.post('/', async (req, res) => {
  try {
    const { originalName, fileType, fileSize, filePath, password } = req.body;

    if (!originalName || !filePath || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newFile = new File({
      originalName,
      storedName: filePath,
      fileType,
      fileSize,
      filePath,
      password: hashedPassword,
      expiresAt,
    });

    await newFile.save();

    res.json({
      message: '✅ Metadata saved successfully',
      fileId: newFile._id,
    });
  } catch (err) {
    console.error('❌ Error saving metadata:', err.message);
    res.status(500).json({ error: 'Server error while saving metadata' });
  }
});

module.exports = router;
