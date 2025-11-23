const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Clean filenames for safety
const sanitize = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found or expired' });

    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect password' });

    // -----------------------------
    // 🚀 REAL FILENAME
    // -----------------------------
    const safeName = sanitize(file.originalName);       // e.g., "Report 2024.docx"
    const encodedName = encodeURIComponent(safeName);   // URL-safe

    // Increment downloads
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    const fileUrl = file.filePath;
    const isCloudinary = fileUrl.startsWith('http');

    // CORS + security
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // -----------------------------
    // 🎯 THE CRITICAL FIX
    // -----------------------------
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
    );

    // Force browser to download, not preview
    res.setHeader('Content-Type', 'application/octet-stream');

    // --------------------------------
    // ☁ CLOUDINARY FILE DOWNLOAD
    // --------------------------------
    if (isCloudinary) {
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      return res.send(Buffer.from(response.data));
    }

    // --------------------------------
    // 💾 LOCAL FILE DOWNLOAD
    // --------------------------------
    const localPath = path.resolve(file.filePath);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file missing from server' });
    }

    const fileStream = fs.createReadStream(localPath);
    return fileStream.pipe(res);

  } catch (err) {
    console.error('❌ Download error:', err);
    return res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
