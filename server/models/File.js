// server/models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: String,
  storedName: String,
  fileType: String,
  fileSize: Number,
  filePath: String,
  password: String, // hashed if used
  expiresAt: Date,
  ext: String,

  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now, expires: 604800 }, // Auto-delete after 7 days
});

module.exports = mongoose.model('File', fileSchema);
