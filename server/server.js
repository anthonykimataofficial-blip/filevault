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
app.use('/api/file', previewRoute);
app.use('/api/admin', adminRoute);

// ✅ Serve uploaded files publicly
app.use('/files', express.static('uploads'));

// ✅ Render health check route (MUST HAVE)
app.get('/', (req, res) => {
  res.send('✅ FileVault backend is running successfully on Render!');
});

// 🕒 Auto-delete expired files every hour
setInterval(async () => {
  const now = new Date();
  try {
    const expiredFiles = await File.find({ expiresAt: { $lte: now } });
    for (const file of expiredFiles) {
      try {
        fs.unlinkSync(file.filePath);
        await file.deleteOne();
        console.log(`🗑️ Deleted expired file: ${file.originalName}`);
      } catch (err) {
        console.error(`❌ Error deleting file ${file._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}, 60 * 60 * 1000); // runs every hour

// ✅ Start server (Render requires 0.0.0.0 binding)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
