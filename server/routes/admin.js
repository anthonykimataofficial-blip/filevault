const express = require('express');
const router = express.Router();
const File = require('../models/File');
const fs = require('fs');
const path = require('path');

// ✅ Admin login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, token: process.env.ADMIN_TOKEN });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ✅ Middleware to verify admin token
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ success: false, message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  next();
}

// ✅ Fetch uploaded files with pagination
router.get('/files', verifyAdminToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await File.countDocuments();
    const files = await File.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      files,
      pagination: {
        totalFiles: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error fetching files with pagination:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Delete a file by ID
router.delete('/files/:id', verifyAdminToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Use the stored filePath directly from DB
    const filePath = file.filePath;
    if (!filePath) {
      console.error('❌ No filePath found in DB:', file);
      return res.status(500).json({ success: false, message: 'File path missing in DB' });
    }

    // Delete from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file from disk: ${filePath}`);
    } else {
      console.warn(`⚠️ File not found on disk: ${filePath}`);
    }

    // Delete from DB
    await file.deleteOne();
    res.json({ success: true, message: 'File deleted successfully' });

  } catch (err) {
    console.error('❌ Error deleting file:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting file' });
  }
});

// ✅ (Optional) Basic Stats Endpoint
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const totalFiles = await File.countDocuments();
    const totalSize = await File.aggregate([
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalFiles,
        totalSizeInMB: (totalSize[0]?.total || 0) / (1024 * 1024),
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
