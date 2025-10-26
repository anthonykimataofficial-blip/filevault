const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const fileUrl = req.query.url;

  if (!fileUrl) {
    return res.status(400).json({ error: "Missing file URL" });
  }

  try {
    // Fetch the file from Cloudinary or local URL
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    // ✅ Mirror original content type (important for PDFs/docs)
    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");

    // ✅ Send the actual file buffer
    res.send(Buffer.from(response.data, "binary"));
  } catch (err) {
    console.error("❌ Proxy fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

module.exports = router;
