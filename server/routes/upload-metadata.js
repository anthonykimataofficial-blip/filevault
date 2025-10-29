// server/routes/upload-metadata.js
const express = require('express');
const bcrypt = require('bcryptjs');
const File = require('../models/File');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { url, originalName, size, password } = req.body;

    if (!url || !originalName || !password) {
      return res.status(400).json({ error: 'Missing file metadata or password.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const file = new File({
      originalName,
      storedName: url,
      fileType: originalName.split('.').pop(),
      fileSize: size,
      filePath: url,
      password: hashedPassword,
      expiresAt,
    });

    await file.save();

    res.json({
      message: '✅ File metadata saved successfully',
      fileId: file._id,
      previewLink: `${process.env.FRONTEND_URL}/preview/${file._id}`,
      downloadLink: `${process.env.FRONTEND_URL}/download/${file._id}`,
    });
  } catch (err) {
    console.error('❌ Metadata save error:', err.message);
    res.status(500).json({ error: 'Server error saving metadata' });
  }
});

module.exports = router;
