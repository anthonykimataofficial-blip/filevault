// server/routes/upload-metadata.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const File = require("../models/File");

router.post("/", async (req, res) => {
  try {
    const { originalName, fileType, fileSize, filePath, password } = req.body;

    console.log("📦 Incoming metadata:", req.body);

    // Check all required fields
    if (!originalName || !fileType || !fileSize || !filePath || !password) {
      return res.status(400).json({ error: "Missing file metadata or password." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

    const newFile = new File({
      originalName,
      storedName: originalName,
      fileType,
      fileSize,
      filePath,
      password: hashedPassword,
      expiresAt,
    });

    await newFile.save();

    console.log("✅ Metadata saved:", newFile._id);

    res.json({
      message: "✅ File metadata saved successfully.",
      fileId: newFile._id,
    });
  } catch (err) {
    console.error("❌ Metadata save error:", err);
    res.status(500).json({ error: "Server error saving metadata." });
  }
});

module.exports = router;
