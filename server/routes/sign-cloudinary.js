// server/routes/sign-cloudinary.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Generate signature for secure direct upload
router.get('/', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = { timestamp, folder: 'filevault_uploads', resource_type: 'auto' };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error('❌ Error creating signature:', err);
    res.status(500).json({ error: 'Failed to create Cloudinary signature' });
  }
});

module.exports = router;
