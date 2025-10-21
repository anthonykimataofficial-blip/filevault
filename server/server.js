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
  'https://filevault-e963uqcdi-anthony-kimatas-projects.vercel.app', // ✅ your Vercel frontend
  'http://localhost:3000' // ✅ local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('❌ Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

app.use(express.json());

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
app.use('/files', express.static('uploads'));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
