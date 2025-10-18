import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './UploadPage.css'; // ⬅️ New CSS file for responsiveness & font

function UploadPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !password) {
      alert("Both file and password are required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);

    try {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const res = await axios.post(`${API_BASE}/api/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  setUploadResult(res.data);
} catch (err) {
  console.error("Upload error:", err.response?.data || err.message);
  alert("Upload failed.");
}

  };

  const handleCopy = () => {
    if (uploadResult?.fileId) {
      const fullLink = `http://localhost:3000/preview/${uploadResult.fileId}`;
      navigator.clipboard.writeText(fullLink);
      alert("🔗 Link copied to clipboard!");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setUploadResult(null);
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
            <img
              src="/logo.png"
              alt="Logo"
              width="60"
              height="60"
              className="d-inline-block align-top me-2"
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>vooli</div>
              <div style={{ fontSize: '1rem', color: '#555' }}>protect your ideas</div>
            </div>
          </span>
        </div>

        {/* Title visible only on tablets & larger */}
        <div className="welcome-title-container">
          <h1 className="welcome-title">
            Welcome to Vooli
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="container py-5" style={{ maxWidth: '600px' }}>
          <h2 className="text-center mb-4 text-white">📤 Secure File Uploader</h2>

          {!uploadResult ? (
            <form onSubmit={handleUpload} className="border p-4 rounded shadow-sm bg-light">
              {/* Drag and Drop Zone */}
              <div
                className={`mb-3 p-4 text-center border rounded ${dragActive ? 'bg-warning bg-opacity-25' : 'bg-light'}`}
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

              <button type="submit" className="btn btn-primary w-100">Upload</button>
            </form>
          ) : (
            <div className="text-center p-3" style={{ backgroundColor: '#126e67ff', borderRadius: '8px', color: 'white' }}>
              <h5 className="mb-3">✅ Upload Successful!</h5>
              <p className="mb-2">
                🔗 <strong>Share this link:</strong>
              </p>

              {/* Highlighted Link Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa, #fdf1d6)', // light grey → cream
                  padding: '12px 18px',
                  borderRadius: '50px',
                  display: 'inline-block',
                  maxWidth: '100%',
                  wordBreak: 'break-all',
                  border: '1px solid black',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <a
                  href={`/preview/${uploadResult.fileId}`}
                  className="text-decoration-none"
                  style={{ color: '#0077b6' }} // ocean blue link
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:3000/preview/{uploadResult.fileId}
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
