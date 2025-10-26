// server/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// ✅ Simple proxy to stream Cloudinary or remote files
router.get('/', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send('Missing file URL');

  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    // ✅ Copy content type for correct rendering
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).send('Error fetching file.');
  }
});

module.exports = router;
