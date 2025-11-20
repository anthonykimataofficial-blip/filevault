const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ✅ Handle file download
router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found or expired' });

    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect password' });

    // Get Cloudinary/local file path
    const fileUrl = file.filePath;
    const isCloudinary = fileUrl.startsWith('http');

    // 🔐 Increment downloads
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // ========== CLOUDINARY DOWNLOAD ==========
    if (isCloudinary) {
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      // Security headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // ======================================================
      //  ✅ OPTION A — Fully RFC-compatible filename handling
      // ======================================================
      const encodedName = encodeURIComponent(file.originalName);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.originalName}"; filename*=UTF-8''${encodedName}`
      );

      res.setHeader('Content-Type', file.fileType);

      return res.send(Buffer.from(response.data, 'binary'));
    }

    // ========== LOCAL FILE DOWNLOAD ==========
    const localPath = path.resolve(file.filePath);
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file not found on server' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Force download with original name
    return res.download(localPath, file.originalName, (err) => {
      if (err) console.error('❌ Download error:', err.message);
    });

  } catch (err) {
    console.error('❌ Download error:', err);
    res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
