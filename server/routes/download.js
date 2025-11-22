const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Clean filenames safely
const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

// --------------------------------------------------
//  DOWNLOAD ROUTE
// --------------------------------------------------
router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    // Use original filename EXACTLY — INCLUDING EXTENSION
    const safeName = sanitize(file.originalName);
    const encodedName = encodeURIComponent(safeName);

    const fileUrl = file.filePath;
    const isCloudinary = fileUrl.startsWith('http');

    // Count download
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // --------------------------------------------------
    // CLOUDINARY DOWNLOAD (raw binary)
    // --------------------------------------------------
    if (isCloudinary) {
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      // Force browser to use OUR filename
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
      );

      // Prevent Chrome/Safari overriding filename
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      return res.send(Buffer.from(response.data, 'binary'));
    }

    // --------------------------------------------------
    // LOCAL FILE DOWNLOAD
    // --------------------------------------------------
    const localPath = path.resolve(file.filePath);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file not found on server' });
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(localPath);
    return stream.pipe(res);

  } catch (err) {
    console.error('❌ Download error:', err);
    return res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
