// server/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    // ✅ Stream file from remote (Cloudinary, etc.)
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FileVault/1.0)',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      },
    });

    // ✅ Pass through correct headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ✅ Stream directly to client
    response.data.pipe(res);
  } catch (err) {
    console.error('❌ Proxy fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch file', details: err.message });
  }
});

module.exports = router;
