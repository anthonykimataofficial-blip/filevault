const express = require('express');
const router = express.Router();
const axios = require('axios');

// ✅ This route proxies file URLs so Google Docs can access them safely
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing file URL' });

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(response.data);
  } catch (err) {
    console.error('❌ Proxy fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to proxy file' });
  }
});

module.exports = router;
