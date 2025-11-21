const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Sanitize filenames for cross-browser safety
const sanitize = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

// Handle file download
router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found or expired' });

    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect password' });

    const fileUrl = file.filePath;
    const isCloudinary = fileUrl.startsWith('http');

    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    const safeName = sanitize(file.originalName);
    const encodedName = encodeURIComponent(safeName);

    // CLOUDINARY
    if (isCloudinary) {
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Correct filename ALWAYS enforced
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
      );

      // IMPORTANT: Force proper filename handling
      res.setHeader('Content-Type', 'application/octet-stream');

      return res.send(Buffer.from(response.data, 'binary'));
    }

    // LOCAL FILES
    const localPath = path.resolve(file.filePath);
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file not found on server' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Force correct filename for ALL browsers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
    );

    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(localPath);
    return fileStream.pipe(res);

  } catch (err) {
    console.error('❌ Download error:', err);
    res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
