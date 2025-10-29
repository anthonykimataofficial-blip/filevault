// server/routes/sign-cloudinary.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = crypto
      .createHash("sha1")
      .update(`timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error("❌ Cloudinary sign error:", err.message);
    res.status(500).json({ error: "Failed to sign Cloudinary request" });
  }
});

module.exports = router;
