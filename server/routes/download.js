const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const File = require('../models/File');
const axios = require('axios');

// Route: POST /api/download/:fileId
router.post('/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // ⏰ Check if expired
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ error: 'This link has expired.' });
    }

    // 🔐 Verify password
    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // 📥 Increment downloads count
    file.downloads = (file.downloads || 0) + 1;
    await file.save();

    // ✅ Handle Cloudinary or Local File
    if (file.filePath.startsWith('http')) {
      // 🌩️ Cloudinary file — stream to user
      const response = await axios({
        url: file.filePath,
        method: 'GET',
        responseType: 'stream'
      });

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.originalName)}"`
      );
      response.data.pipe(res);
    } else {
      // 🗂️ Local file fallback
      const filePath = path.resolve(file.filePath);
      res.set({
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      });
      res.download(filePath);
    }

  } catch (err) {
    console.error('❌ Download error:', err.message);
    res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
