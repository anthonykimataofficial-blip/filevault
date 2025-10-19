import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DownloadPage from './pages/DownloadPage';
import PreviewPage from './pages/PreviewPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedAdminRoute from './components/ProtectedAdminRoute'; // ✅ New

function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/download/:fileId" element={<DownloadPage />} />
        <Route path="/preview/:fileId" element={<PreviewPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ✅ Protected admin route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ✅ Catch-all route (prevents 404s on reloads in Vercel) */}
        <Route path="*" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}

export default App;
