const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Clean filename for safety
const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found or expired' });

    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect password' });

    const safeName = sanitize(file.originalName);
    const encodedName = encodeURIComponent(safeName);

    const isCloudinary = file.filePath.startsWith('http');

    // Count download
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // -----------------------------
    // CLOUDINARY FILE DOWNLOAD
    // -----------------------------
    if (isCloudinary) {
      const response = await axios({
        url: file.filePath,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // CRITICAL FIX: send the actual MIME type
      res.setHeader('Content-Type', file.fileType);

      // Correct filename headers (Chrome, Firefox, Safari)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
      );

      return res.send(Buffer.from(response.data, 'binary'));
    }

    // -----------------------------
    // LOCAL FILE DOWNLOAD
    // -----------------------------
    const localPath = path.resolve(file.filePath);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file not found' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // CRITICAL FIX: use real MIME type
    res.setHeader('Content-Type', file.fileType);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
    );

    const stream = fs.createReadStream(localPath);
    return stream.pipe(res);

  } catch (err) {
    console.error('❌ Download error:', err);
    return res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
