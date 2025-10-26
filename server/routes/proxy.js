// server/routes/proxy.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// ✅ Universal file proxy for PDFs and DOCs (bypasses CORS)
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(response.data);
  } catch (err) {
    console.error('❌ Proxy fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

module.exports = router;
