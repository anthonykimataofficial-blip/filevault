// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const File = require('./models/File');

const app = express();

const allowedOrigins = [
  'https://filevault-eight.vercel.app', // ✅ your live site
  'http://localhost:3000'               // ✅ local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow tools like Postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn('🚫 CORS blocked for origin:', origin);
      return callback(new Error('❌ Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Increase JSON and upload payload limits
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 🩵 Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 Created uploads directory');
}

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 🔍 Optional: log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  // ⏱️ Prevent uploads from timing out on large files
  req.setTimeout(10 * 60 * 1000); // 10 minutes
  res.setTimeout(10 * 60 * 1000);
  next();
});

// ✅ Import routes
const uploadRoute = require('./routes/upload');
const downloadRoute = require('./routes/download');
const previewRoute = require('./routes/preview');
const adminRoute = require('./routes/admin'); // ✅ Admin route added

// ✅ Mount routes
app.use('/api/upload', uploadRoute);
app.use('/api/download', downloadRoute);
app.use('/api/file', previewRoute); // For preview, view, password check
app.use('/api/admin', adminRoute);  // ✅ Admin login route

// ✅ Serve uploaded files publicly
// ✅ Serve files with support for audio/video streaming and CORS
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set general CORS + playback headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // If browser requests a specific range (streaming)
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });

    file.pipe(res);
  } else {
    // Fallback if no range header
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});


// 🕒 Auto-delete expired files every hour
setInterval(async () => {
  const now = new Date();
  try {
    const expiredFiles = await File.find({ expiresAt: { $lte: now } });
    for (const file of expiredFiles) {
      try {
        fs.unlinkSync(file.filePath); // remove from disk
        await file.deleteOne();       // remove from MongoDB
        console.log(`🗑️ Deleted expired file: ${file.originalName}`);
      } catch (err) {
        console.error(`❌ Error deleting file ${file._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}, 60 * 60 * 1000); // runs every hour

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
