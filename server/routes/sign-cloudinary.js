// server/routes/sign-cloudinary.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Include the same parameters you send in the frontend
    const folder = "filevault_uploads";

    const stringToSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error("❌ Error generating Cloudinary signature:", error.message);
    res.status(500).json({ error: "Server error generating signature" });
  }
});

module.exports = router;
