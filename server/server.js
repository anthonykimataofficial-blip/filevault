// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const File = require('./models/File');

const app = express();

// ----------------------------------------------------
// CORS CONFIGURATION
// ----------------------------------------------------
const allowedOrigins = [
  'https://filevault-eight.vercel.app',
  'https://voolifilevault.com',
  'https://www.voolifilevault.com', // live site
  'http://localhost:3000' // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / no-origin tools
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
  })
);

// ----------------------------------------------------
// BODY LIMITS
// ----------------------------------------------------
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ limit: '50gb', extended: true }));

// ----------------------------------------------------
// ENSURE UPLOADS DIRECTORY EXISTS
// ----------------------------------------------------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 Created uploads directory');
}

// ----------------------------------------------------
// MONGO CONNECTION
// ----------------------------------------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ----------------------------------------------------
// REQUEST LOGGING + TIMEOUTS
// ----------------------------------------------------
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  req.setTimeout(30 * 60 * 1000); // 30 mins
  res.setTimeout(30 * 60 * 1000);
  next();
});

// ----------------------------------------------------
// CONTENT SECURITY POLICY (Preview only)
// ----------------------------------------------------
const previewSecurity = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self'; sandbox allow-same-origin allow-scripts allow-modals allow-forms;"
  );
  next();
};

// Apply CSP ONLY to preview-related endpoints
app.use('/api/file', previewSecurity);
app.use('/api/proxy', previewSecurity);
app.use('/api/preview-excel', previewSecurity);

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------
const uploadRoute = require('./routes/upload');
const downloadRoute = require('./routes/download');
const previewRoute = require('./routes/preview');
const adminRoute = require('./routes/admin');
const proxyRoute = require('./routes/proxy');
const signCloudinaryRoute = require('./routes/sign-cloudinary');
const uploadMetadataRoute = require('./routes/upload-metadata');
const previewExcelRoute = require('./routes/preview-excel');

app.use('/api/upload', uploadRoute);
app.use('/api/download', downloadRoute);
app.use('/api/file', previewRoute);
app.use('/api/admin', adminRoute);
app.use('/api/proxy', proxyRoute);
app.use('/api/sign-cloudinary', signCloudinaryRoute);
app.use('/api/upload-metadata', uploadMetadataRoute);
app.use('/api/preview-excel', previewExcelRoute);

// ----------------------------------------------------
// STATIC FILE SERVING
// ----------------------------------------------------
app.use('/files', express.static('uploads'));

// ----------------------------------------------------
//HEALTH CHECK
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.send('✅ FileVault backend is running successfully on Render!');
});

// ----------------------------------------------------
// AUTO-DELETE EXPIRED FILES EVERY HOUR
// ----------------------------------------------------
setInterval(async () => {
  const now = new Date();

  try {
    const expiredFiles = await File.find({ expiresAt: { $lte: now } });

    for (const file of expiredFiles) {
      try {
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
        await file.deleteOne();
        console.log(`🗑️ Deleted expired file: ${file.originalName}`);
      } catch (err) {
        console.error(`❌ Error deleting file ${file._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}, 60 * 60 * 1000); // every hour

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
