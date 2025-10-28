// server/routes/proxy.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing file URL' });

  try {
    console.log('🌀 Proxy fetching:', url);

    // Only add Cloudinary auth if credentials exist
    const headers = {};
    if (url.includes('res.cloudinary.com') && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const auth = Buffer.from(
        `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers,
      validateStatus: () => true, // Prevent axios from throwing on 401
    });

    if (response.status >= 400) {
      console.warn(`⚠️ Proxy fetch failed with status ${response.status}`);
      return res.status(response.status).json({
        error: 'Failed to fetch file',
        details: response.statusText,
      });
    }

    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.send(response.data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy server error', details: err.message });
  }
});

module.exports = router;
