// server/routes/proxy.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing file URL' });

  try {
    console.log('🌀 Proxy fetching:', url);

    const headers = {};
    // Add Cloudinary auth if needed
    if (
      url.includes('res.cloudinary.com') &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const auth = Buffer.from(
        `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    // Fetch the file from its original source
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      console.warn(`⚠️ Proxy fetch failed with status ${response.status}`);
      return res.status(response.status).json({
        error: 'Failed to fetch file',
        details: response.statusText,
      });
    }

    // ✅ Allow anyone to access this route (public)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Forward headers like content-type and disposition
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }

    res.send(response.data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy server error', details: err.message });
  }
});

module.exports = router;
