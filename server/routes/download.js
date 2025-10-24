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

    // ✅ Handle Cloudinary or local file
    const fileUrl = file.filePath;
    const isCloudinary = fileUrl.startsWith('http');

    // ⬇️ Cloudinary file — stream download from URL
    if (isCloudinary) {
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.fileType);
      res.send(Buffer.from(response.data, 'binary'));

      // ✅ increment download count
      await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
      return;
    }

    // ⬇️ Local file fallback (for older uploads)
    const localPath = path.resolve(file.filePath);
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Local file not found on server' });
    }

    res.download(localPath, file.originalName, async (err) => {
      if (!err) {
        await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
      }
    });
  } catch (err) {
    console.error('❌ Download error:', err);
    res.status(500).json({ error: 'Server error during download' });
  }
});

module.exports = router;
