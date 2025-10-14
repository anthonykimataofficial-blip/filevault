const express = require('express');
const router = express.Router();
const File = require('../models/File');
const path = require('path');

// ✅ GET: Fetch file metadata (no view increment)
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // ❌ Link expired?
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    // ✅ Respond with full metadata
    res.json({
      originalName: file.originalName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      ext: path.extname(file.storedName).slice(1), // removes dot
      url: `http://localhost:5000/files/${file.storedName}`,
      views: file.views || 0,
      downloads: file.downloads || 0,
      previewLink: `/preview/${file._id}`,
      downloadLink: `/download/${file._id}`
    });
  } catch (err) {
    console.error('Error loading preview metadata:', err);
    res.status(500).json({ error: 'Server error during preview' });
  }
});

// ✅ POST: Increment views count
router.post('/:id/view', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.views = (file.views || 0) + 1;
    await file.save();

    res.json({ success: true, views: file.views });
  } catch (err) {
    console.error('Error incrementing views:', err);
    res.status(500).json({ error: 'Failed to count view' });
  }
});

module.exports = router;
