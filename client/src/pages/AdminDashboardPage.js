import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboardPage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, views: 0, downloads: 0, sizeMB: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');

  const token = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 403 || res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();

      if (data.success) {
        setFiles(data.files);

        const total = data.files.length;
        const views = data.files.reduce((acc, file) => acc + (file.views || 0), 0);
        const downloads = data.files.reduce((acc, file) => acc + (file.downloads || 0), 0);
        const sizeMB = data.files.reduce((acc, file) => acc + file.fileSize, 0) / (1024 * 1024);

        setStats({ total, views, downloads, sizeMB });
      } else {
        setError(data.message || 'Failed to fetch files.');
      }
    } catch (err) {
      console.error('❌ Failed to fetch files', err);
      setError(err.message || 'Server error');
    }
  }, [token, handleLogout]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    fetchFiles();
  }, [token, fetchFiles, navigate]);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        setFiles(prev => prev.filter(file => file._id !== fileId));
        fetchFiles();
      } else {
        alert('Delete failed: ' + data.message);
      }
    } catch {
      alert('Server error while deleting.');
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesType = fileTypeFilter ? file.fileType === fileTypeFilter : true;
    return matchesSearch && matchesType;
  });

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const uniqueFileTypes = [...new Set(files.map(f => f.fileType))];

  return (
    <div className="container my-4">
      {/* Top bar */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
        <h2 className="mb-2 mb-sm-0">📊 Admin Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-6">
          <select
            className="form-select"
            value={fileTypeFilter}
            onChange={e => setFileTypeFilter(e.target.value)}
          >
            <option value="">All File Types</option>
            {uniqueFileTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-6 col-md-3">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5>Total Files</h5>
              <p className="fs-4 mb-0">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5>Total Views</h5>
              <p className="fs-4 mb-0">{stats.views}</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <h5>Total Downloads</h5>
              <p className="fs-4 mb-0">{stats.downloads}</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-3">
          <div className="card text-white bg-dark">
            <div className="card-body">
              <h5>Total Size (MB)</h5>
              <p className="fs-4 mb-0">{stats.sizeMB.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Original Name</th>
              <th>Type</th>
              <th>Size (KB)</th>
              <th>Views</th>
              <th>Downloads</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentFiles.map((file) => (
              <tr key={file._id}>
                <td>{file.originalName}</td>
                <td>{file.fileType}</td>
                <td>{(file.fileSize / 1024).toFixed(2)}</td>
                <td>{file.views}</td>
                <td>{file.downloads}</td>
                <td>{new Date(file.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(file._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {currentFiles.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">No files found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <nav>
        <ul className="pagination flex-wrap justify-content-center">
          {Array.from({ length: totalPages }, (_, index) => (
            <li
              key={index + 1}
              className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
            >
              <button className="page-link" onClick={() => paginate(index + 1)}>
                {index + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default AdminDashboardPage;
