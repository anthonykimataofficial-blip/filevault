// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const File = require('./models/File');

const app = express();
app.use(cors());
app.use(express.json());

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
app.use('/api/admin', adminRoute);   // ✅ Admin login route

// ✅ Serve uploaded files publicly
app.use('/files', express.static('uploads'));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
