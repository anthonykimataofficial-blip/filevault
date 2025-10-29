import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './UploadPage.css';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  // ✅ Direct upload logic to Cloudinary (Axios)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !password) {
      alert('Both file and password are required.');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const API_BASE =
        process.env.REACT_APP_API_URL ||
        'https://filevault-backend-a7w4.onrender.com';

      // 1️⃣ Get Cloudinary signature from backend
      const signRes = await fetch(`${API_BASE}/api/sign-cloudinary`);
      const signData = await signRes.json();
      const timestamp = signData.timestamp;
      const signature = signData.signature;
      const apiKey = signData.api_key;
      const cloudName = signData.cloud_name;

      // 2️⃣ Upload directly to Cloudinary using Axios
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', 'filevault_uploads');

      console.log(
        `🚀 Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`
      );

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          },
          timeout: 0, // Disable timeout for large uploads
        }
      );

      const uploadData = uploadRes.data;
      if (!uploadData.secure_url) {
        throw new Error('No secure_url returned from Cloudinary.');
      }

      // 3️⃣ Send metadata to backend
      const metaRes = await fetch(`${API_BASE}/api/upload-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: uploadData.secure_url,
          password,
        }),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error || 'Metadata save failed.');

      setUploadResult(metaData);
      alert('✅ File uploaded successfully!');
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCopy = () => {
    if (uploadResult?.fileId) {
      const fullLink = `${window.location.origin}/preview/${uploadResult.fileId}`;
      navigator.clipboard.writeText(fullLink);
      alert('🔗 Link copied to clipboard!');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setUploadResult(null);
    setProgress(0);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'url("/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light shadow-sm position-relative">
        <div className="container d-flex justify-content-between align-items-center">
          <span className="navbar-brand mb-0 h1 d-flex align-items-center">
            <img src="/logo.png" alt="Logo" width="60" height="60" className="me-2" />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>vooli</div>
              <div style={{ fontSize: '1rem', color: '#555' }}>protect your ideas</div>
            </div>
          </span>
        </div>
        <div className="welcome-title-container">
          <h1 className="welcome-title">Welcome to Vooli</h1>
        </div>
      </nav>

      {/* Main Section */}
      <main className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="container py-5" style={{ maxWidth: '600px' }}>
          <h2 className="text-center mb-4 text-white">📤 Secure File Uploader</h2>

          <div
            style={{
              backgroundColor: 'rgba(10, 25, 75, 0.7)',
              color: 'white',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '25px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>⚡ Quick Guide:</p>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              <li>📁 Upload documents, images, audio, or video</li>
              <li>🔑 Set a password to protect your file</li>
              <li>📬 Click <strong>Upload</strong>, copy your private link, and share</li>
            </ul>
          </div>

          {!uploadResult ? (
            <form onSubmit={handleUpload} className="border p-4 rounded shadow-sm bg-light">
              <div
                className={`mb-3 p-4 text-center border rounded ${
                  dragActive ? 'bg-warning bg-opacity-25' : 'bg-light'
                }`}
                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                onClick={() => document.getElementById('fileInput').click()}
              >
                {file ? (
                  <strong>📄 Selected: {file.name}</strong>
                ) : (
                  <span>Drag & Drop your file here or click to browse</span>
                )}
                <input
                  type="file"
                  id="fileInput"
                  className="d-none"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {uploading && (
                <div className="progress mb-3">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-100" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          ) : (
            <div
              className="text-center p-3"
              style={{
                backgroundColor: '#126e67ff',
                borderRadius: '8px',
                color: 'white',
              }}
            >
              <h5 className="mb-3">✅ Upload Successful!</h5>
              <p className="mb-2">🔗 <strong>Share this link:</strong></p>
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa, #fdf1d6)',
                  padding: '12px 18px',
                  borderRadius: '50px',
                  display: 'inline-block',
                  wordBreak: 'break-all',
                  border: '1px solid black',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                }}
              >
                <a
                  href={`${window.location.origin}/preview/${uploadResult.fileId}`}
                  className="text-decoration-none"
                  style={{ color: '#0077b6' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${window.location.origin}/preview/${uploadResult.fileId}`}
                </a>
              </div>

              <div className="d-flex justify-content-center mt-3">
                <button className="btn btn-outline-light me-2" onClick={handleCopy}>
                  📋 Copy
                </button>
                <button className="btn btn-outline-light" onClick={handleReset}>
                  🔁 Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-light text-center py-3 shadow-sm">
        <small>Powered by <strong>APIEN</strong></small>
      </footer>
    </div>
  );
}

export default UploadPage;
