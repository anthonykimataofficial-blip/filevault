import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const PreviewPage = () => {
  const { fileId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const API_BASE =
          process.env.REACT_APP_API_URL || 'https://filevault-backend-a7w4.onrender.com';
        const res = await fetch(`${API_BASE}/api/file/${fileId}`);
        if (!res.ok) throw new Error('File not found or expired');
        const data = await res.json();

        await fetch(`${API_BASE}/api/file/${fileId}/view`, { method: 'POST' });
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
    const handleContextMenu = (e) => e.preventDefault();

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
  const lowerExt = ext
    ? ext.split('.').pop().trim().toLowerCase()
    : url?.split('.').pop().split('?')[0].trim().toLowerCase();

  const API_BASE = process.env.REACT_APP_API_URL || 'https://filevault-backend-a7w4.onrender.com';
  const fileURL = url.startsWith('http') ? url : `${API_BASE}/files/${url}`;

  const renderPreview = () => {
    const isDocType = ['pdf', 'docx', 'doc', 'pptx'].includes(lowerExt);
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(lowerExt);
    const isText = lowerExt === 'txt';
    const isVideo = ['mp4', 'mpeg', 'mov', 'avi'].includes(lowerExt);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(lowerExt);

    if (isDocType) {
      const isCloud = fileURL.startsWith('https://res.cloudinary.com');
      const safeUrl = isCloud
        ? fileURL
        : `${API_BASE}/api/proxy?url=${encodeURIComponent(fileURL)}`;

      const gviewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
        safeUrl
      )}&embedded=true`;
      const driveUrl = `https://drive.google.com/viewerng/viewer?url=${encodeURIComponent(
        safeUrl
      )}&embedded=true`;
      const viewerUrl = pdfError ? driveUrl : gviewUrl;

      return (
        <iframe
          src={viewerUrl}
          onError={() => setPdfError(true)}
          style={{
            width: '100%',
            height: '80vh',
            border: 'none',
            backgroundColor: '#fff',
            zIndex: 2,
          }}
          title="Document Preview"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      );
    }

    if (isImage) {
      return (
        <img
          src={fileURL}
          alt="Preview"
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            display: 'block',
            margin: '0 auto',
            zIndex: 2,
          }}
        />
      );
    }

    // 🧠 Secure text file preview: scrollable + protected
    if (isText) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '500px' }}>
          {/* The scrollable iframe */}
          <iframe
            src={fileURL}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#fff',
              overflowY: 'auto',
              overflowX: 'hidden',
              userSelect: 'none',
              zIndex: 1,
            }}
            title="Text Preview"
            sandbox="allow-same-origin"
          />
          {/* Invisible anti-copy overlay (leaves scroll strip on right side) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'calc(100% - 20px)', // leave 20px on the right for scrolling
              height: '100%',
              zIndex: 3,
              backgroundColor: 'transparent',
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <video controls style={{ width: '100%', maxHeight: '70vh', zIndex: 2 }}>
          <source src={fileURL} type={`video/${lowerExt}`} />
        </video>
      );
    }

    if (isAudio) {
      return (
        <audio controls style={{ width: '100%', zIndex: 2 }}>
          <source src={fileURL} type={`audio/${lowerExt}`} />
        </audio>
      );
    }

    return <p>⚠️ Preview not available for this file type.</p>;
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
        <div
          className="container-fluid d-flex justify-content-between align-items-center"
          style={{ position: 'relative' }}
        >
          <span className="navbar-brand mb-0 h1 d-flex align-items-center">
            <img src="/logo.png" alt="Logo" width="60" height="60" className="me-2" />
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

      <style>{`
        @media (min-width: 768px) {
          .welcome-heading {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PreviewPage;
