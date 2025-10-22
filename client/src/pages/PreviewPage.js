import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const PreviewPage = () => {
  const { fileId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        // ✅ Use live backend when deployed, localhost in dev
        const API_BASE =
          process.env.REACT_APP_API_URL ||
          "https://filevault-backend-a7w4.onrender.com";

        const res = await fetch(`${API_BASE}/api/file/${fileId}`);
        if (!res.ok) throw new Error('File not found or expired');
        const data = await res.json();

        await fetch(`${API_BASE}/api/file/${fileId}/view`, {
          method: 'POST',
        });

        setFileData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchFile();
  }, [fileId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 's') || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        alert('🚫 Screenshots and printing are disabled on this page.');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (error) return <h2 style={{ textAlign: 'center' }}>{error}</h2>;
  if (!fileData) return <h2 style={{ textAlign: 'center' }}>Loading...</h2>;

  const { originalName, ext, url, views, downloads } = fileData;
  const lowerExt = ext.toLowerCase();

  const renderPreview = () => {
    const previewStyle = {
      width: '100%',
      maxHeight: '80vh',
      border: 'none',
      backgroundColor: '#f8f9fa',
      zIndex: 2,
      display: 'block',
      margin: '0 auto',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    };

    // 📄 Unified preview for PDF, DOCX, PPTX
    if (['pdf', 'docx', 'pptx'].includes(lowerExt)) {
      return (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <iframe
            src={
              lowerExt === 'pdf'
                ? url
                : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
            }
            style={previewStyle}
            title="Document Preview"
          />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#777', marginTop: '10px' }}>
            🔒 View only — download requires password.
          </p>
        </div>
      );
    }

    // 🖼️ Images
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(lowerExt)) {
      return (
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <img
            src={url}
            alt="Preview"
            style={{
              ...previewStyle,
              objectFit: 'contain',
            }}
          />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#777', marginTop: '10px' }}>
            🔒 Image protected from right-click.
          </p>
        </div>
      );
    }

    // 🎬 Video
    if (['mp4', 'mov', 'avi', 'mkv'].includes(lowerExt)) {
      return (
        <div style={{ textAlign: 'center' }}>
          <video controls style={previewStyle}>
            <source src={url} type={`video/${lowerExt}`} />
            Your browser does not support video playback.
          </video>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#777', marginTop: '10px' }}>
            🎥 Protected video preview.
          </p>
        </div>
      );
    }

    // 🎵 Audio
    if (['mp3', 'wav', 'ogg'].includes(lowerExt)) {
      return (
        <div style={{ textAlign: 'center' }}>
          <audio controls style={{ width: '100%', marginTop: '10px' }}>
            <source src={url} type={`audio/${lowerExt}`} />
            Your browser does not support audio playback.
          </audio>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#777', marginTop: '10px' }}>
            🎧 Protected audio playback.
          </p>
        </div>
      );
    }

    // 📜 Text files
    if (['txt', 'csv', 'json', 'log'].includes(lowerExt)) {
      return (
        <iframe
          src={url}
          style={{ ...previewStyle, height: '500px' }}
          title="Text Preview"
        />
      );
    }

    // ❗Unsupported file types
    return (
      <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
        ⚠️ Preview not available for this file type.
      </div>
    );
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
      <nav className="navbar navbar-light bg-light shadow-sm px-3">
        <div className="container-fluid d-flex justify-content-between align-items-center" style={{ position: 'relative' }}>
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

          <h1
            style={{
              margin: 0,
              fontFamily: "'Super Bubble', cursive",
              fontSize: '2.2rem',
              fontWeight: '700',
              color: '#fb5607',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'none',
            }}
            className="welcome-heading"
          >
            Welcome to Vooli
          </h1>

          <Link to="/" className="btn btn-primary">
            Click here to upload files
          </Link>
        </div>
      </nav>

      <div
        style={{
          padding: '2rem',
          fontFamily: 'sans-serif',
          maxWidth: '1000px',
          margin: '3rem auto',
          background: '#ffffffee',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: '600' }}>
          📄 {originalName}
        </h2>

        <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="Watermark"
              style={{
                opacity: 0.25,
                maxWidth: '85%',
                maxHeight: '85%',
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>{renderPreview()}</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link
            to={`/download/${fileId}`}
            className="btn btn-outline-primary"
            style={{ padding: '8px 20px', fontWeight: '500' }}
          >
            🔒 Enter password to download
          </Link>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#555',
          }}
        >
          👁️ Views: {views} | 📥 Downloads: {downloads}
        </div>

        <p
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#888',
          }}
        >
          ⏳ Uploaded files will be auto-deleted after 24 hours.
        </p>
      </div>

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

      <style>
        {`
          @media (min-width: 768px) {
            .welcome-heading {
              display: block !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PreviewPage;
