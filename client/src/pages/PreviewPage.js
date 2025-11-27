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
          process.env.REACT_APP_API_URL ||
          'https://filevault-backend-a7w4.onrender.com';

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
        alert('🚫 Screenshots and printing are disabled.');
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

  const API_BASE =
    process.env.REACT_APP_API_URL ||
    'https://filevault-backend-a7w4.onrender.com';
  const fileURL = url.startsWith('http')
    ? url
    : `${API_BASE}/files/${url}`;

  const iframeStyle = {
    width: '100%',
    height: '80vh',
    border: 'none',
    backgroundColor: '#fff',
    zIndex: 2,
    borderRadius: '10px',
  };

  const renderPreview = () => {
    const isDocType = ['pdf', 'doc', 'docx', 'pptx'].includes(lowerExt);
    const isExcel = ['xlsx', 'xls', 'csv'].includes(lowerExt);
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(lowerExt);
    const isText = lowerExt === 'txt';
    const isVideo = ['mp4', 'mov', 'avi', 'mpeg'].includes(lowerExt);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(lowerExt);

    /* ---------------- DOC / PDF ---------------- */
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

      return (
        <div style={{ position: 'relative' }}>
          <iframe
            src={pdfError ? driveUrl : gviewUrl}
            onError={() => setPdfError(true)}
            style={iframeStyle}
            title="Document Viewer"
            sandbox="allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
          />

          {/* Shield that blocks right-click only (not clicks / not scrollbar) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'calc(100% - 20px)',
              height: '100%',
              zIndex: 10,
              background: 'transparent',
              pointerEvents: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      );
    }

    /* ---------------- Excel ---------------- */
    if (isExcel) {
      const excelPreviewUrl = `${API_BASE}/api/preview-excel?url=${encodeURIComponent(
        fileURL
      )}`;

      return (
        <iframe
          src={excelPreviewUrl}
          style={iframeStyle}
          title="Excel Preview"
          sandbox="allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
        />
      );
    }

    /* ---------------- IMAGES ---------------- */
    if (isImage) {
      return (
        <img
          src={fileURL}
          alt="Preview"
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            margin: '0 auto',
            display: 'block',
            borderRadius: '10px',
          }}
        />
      );
    }

    /* ---------------- TEXT ---------------- */
    if (isText) {
      return (
        <iframe
          src={fileURL}
          style={{
            width: '100%',
            height: '500px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            background: '#fff',
          }}
          title="Text Viewer"
          sandbox="allow-same-origin"
        />
      );
    }

    /* ---------------- VIDEO ---------------- */
    if (isVideo) {
      return (
        <video
          controls
          style={{ width: '100%', maxHeight: '70vh' }}
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={fileURL} />
        </video>
      );
    }

    /* ---------------- AUDIO ---------------- */
    if (isAudio) {
      return (
        <audio
          controls
          style={{ width: '100%' }}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={fileURL} />
        </audio>
      );
    }

    return <p>Preview not available for this file type.</p>;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: 'url("/background.png")',
        backgroundSize: 'cover',
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light shadow-sm px-3">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand mb-0 h1 d-flex align-items-center">
            <img src="/logo.png" width="60" height="60" alt="logo" className="me-2" />
            <div>
              <strong>vooli</strong>
              <div style={{ fontSize: '.9rem', color: '#666' }}>protect your ideas</div>
            </div>
          </span>

          <Link to="/" className="btn btn-primary">
            Upload new file
          </Link>
        </div>
      </nav>

      {/* Main container */}
      <div
        style={{
          padding: '2rem',
          maxWidth: '1000px',
          margin: '3rem auto',
          background: '#ffffffee',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          📄 {originalName}
        </h2>

        {/* PREVIEW AREA */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="Watermark"
              style={{ opacity: 0.28, maxWidth: '80%' }}
            />
          </div>

          {/* Rainbow strip only over document area */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'calc(100% - 20px)',
              height: '100%',
              zIndex: 4,
              pointerEvents: 'none',
              background:
                'linear-gradient(90deg, rgba(255,0,150,0) 0%, rgba(255,0,150,0.35) 40%, rgba(0,200,255,0.35) 60%, rgba(0,200,255,0) 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              animation: 'shimmerRainbow 3s linear infinite',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {renderPreview()}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to={`/download/${fileId}`} className="btn btn-outline-primary">
            🔒 Enter password to download
          </Link>
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#555' }}>
          👁️ {views} views • 📥 {downloads} downloads
        </p>

        <p style={{ textAlign: 'center', fontSize: '.85rem', color: '#888' }}>
          ⏳ Auto-deletes after 24 hours.
        </p>
      </div>

      <footer style={{ textAlign: 'center', padding: '1rem' }}>
        Powered by APIEN
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes shimmerRainbow {
          0% { transform: translateX(-80%); }
          100% { transform: translateX(80%); }
        }
      `}</style>
    </div>
  );
};

export default PreviewPage;
