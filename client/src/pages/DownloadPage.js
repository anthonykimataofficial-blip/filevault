import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function DownloadPage() {
  const { fileId } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://filevault-backend-a7w4.onrender.com";

      const response = await axios.post(
        `${API_BASE}/api/download/${fileId}`,
        { password },
        { responseType: 'blob' }
      );

      const cd = response.headers['content-disposition'];
      let filename = 'downloaded-file';

      if (cd) {
        // Try UTF-8 filename* first
        const utf8 = cd.match(/filename\*=(?:UTF-8'')?([^;\n]+)/i);
        if (utf8 && utf8[1]) {
          filename = decodeURIComponent(utf8[1].replace(/"/g, '').trim());
        } else {
          // Standard filename=
          const normal = cd.match(/filename="?([^"]+)"?/i);
          if (normal && normal[1]) {
            filename = normal[1].trim();
          }
        }
      }

      // Final cleanup to remove weird characters
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const mimeType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setPassword('');
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: 'url("/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light shadow-sm px-3">
        <div className="container-fluid d-flex justify-content-between align-items-center">
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

          <Link to="/" className="btn btn-primary">
            Click here to upload files
          </Link>
        </div>
      </nav>

      {/* Password Form */}
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
        <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%', background: '#ffffffdd' }}>
          <h5 className="card-title text-center mb-3">🔒 Enter Password to Download File</h5>
          <form onSubmit={handleDownload}>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Download</button>
          </form>

          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {success && <div className="alert alert-success mt-3">✅ Download started successfully!</div>}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1rem' }}>
        <span
          style={{
            backgroundColor: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontWeight: 'bold',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
            display: 'inline-block',
            color: '#333',
          }}
        >
          Powered by APIEN
        </span>
      </footer>
    </div>
  );
}

export default DownloadPage;
