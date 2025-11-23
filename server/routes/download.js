const express = require('express');
const router = express.Router();
const File = require('../models/File');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Sanitize filenames for maximum browser safety
const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

// ----------------------------------------------------
// 🚀 DOWNLOAD ROUTE
// ----------------------------------------------------
router.post('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    // Increment download count
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // Prepare safe filename
    const safeName = sanitize(file.originalName);
    const encoded = encodeURIComponent(safeName);

    const isCloud = file.filePath.startsWith("http");

    // ----------------------------------------------------
    // 🌩 CLOUDINARY DOWNLOAD
    // ----------------------------------------------------
    if (isCloud) {
      const response = await axios.get(file.filePath, {
        responseType: "arraybuffer",
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`
      );

      res.setHeader("Content-Type", "application/octet-stream");

      return res.end(Buffer.from(response.data));
    }

    // ----------------------------------------------------
    // 🗂 LOCAL STORAGE DOWNLOAD
    // ----------------------------------------------------
    const localPath = path.resolve(file.filePath);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: "File missing on server" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`
    );

    res.setHeader("Content-Type", "application/octet-stream");

    const stream = fs.createReadStream(localPath);
    return stream.pipe(res);

  } catch (err) {
    console.error("❌ DOWNLOAD ERROR:", err);
    res.status(500).json({ error: "Server error during download" });
  }
});

module.exports = router;
