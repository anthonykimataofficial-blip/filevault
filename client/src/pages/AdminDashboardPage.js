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
  const [selectedFiles, setSelectedFiles] = useState([]);

  const token = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  const API_BASE =
    process.env.REACT_APP_API_URL || 'https://filevault-backend-a7w4.onrender.com';

  // ✅ Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  // ✅ Fetch files (REAL pagination)
  const fetchFiles = useCallback(
    async (page = 1) => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/files?page=${page}&limit=${filesPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403 || res.status === 401) {
          handleLogout();
          return;
        }

        const data = await res.json();

        if (data.success) {
          setFiles(data.files);
          setCurrentPage(data.pagination.currentPage);

          // Compute totals dynamically
          const total = data.pagination.totalFiles;
          const sizeMB =
            data.files.reduce((acc, file) => acc + file.fileSize, 0) / (1024 * 1024);
          const views = data.files.reduce((acc, file) => acc + (file.views || 0), 0);
          const downloads = data.files.reduce((acc, file) => acc + (file.downloads || 0), 0);

          setStats({ total, sizeMB, views, downloads });
        } else {
          setError(data.message || 'Failed to fetch files.');
        }
      } catch (err) {
        console.error('❌ Failed to fetch files', err);
        setError(err.message || 'Server error');
      }
    },
    [API_BASE, token, handleLogout, filesPerPage]
  );

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    fetchFiles(currentPage);
  }, [token, fetchFiles, navigate, currentPage]);

  // ✅ Single delete
  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setFiles((prev) => prev.filter((file) => file._id !== fileId));
        setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
      } else {
        alert('Delete failed: ' + data.message);
      }
    } catch {
      alert('Server error while deleting.');
    }
  };

  // ✅ Bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) {
      alert('No files selected for deletion.');
      return;
    }

    if (!window.confirm(`Delete ${selectedFiles.length} selected file(s)?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/files/bulk-delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedFiles }),
      });

      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((file) => !selectedFiles.includes(file._id)));
        setSelectedFiles([]);
        alert('✅ Selected files deleted successfully.');
      } else {
        alert('❌ Bulk delete failed: ' + data.message);
      }
    } catch {
      alert('Server error during bulk delete.');
    }
  };

  // ✅ Selection logic
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFiles(files.map((f) => f._id));
    } else {
      setSelectedFiles([]);
    }
  };

  const toggleSelectFile = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  // ✅ Filtering (client-side)
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesType = fileTypeFilter ? file.fileType === fileTypeFilter : true;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil((stats.total || 0) / filesPerPage);
  const uniqueFileTypes = [...new Set(files.map((f) => f.fileType))];

  // ✅ Pagination click
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchFiles(pageNumber);
  };

  return (
    <div className="container my-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
        <h2 className="mb-2 mb-sm-0">📊 Admin Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ✅ Search + Filter */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-6">
          <select
            className="form-select"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <option value="">All File Types</option>
            {uniqueFileTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ Stats */}
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

      {/* ✅ Bulk Delete */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>📁 Files List</h5>
        {selectedFiles.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑️ Delete Selected ({selectedFiles.length})
          </button>
        )}
      </div>

      {/* ✅ Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={files.length > 0 && selectedFiles.length === files.length}
                  onChange={toggleSelectAll}
                />
              </th>
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
            {filteredFiles.map((file) => (
              <tr key={file._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file._id)}
                    onChange={() => toggleSelectFile(file._id)}
                  />
                </td>
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
            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  No files found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination */}
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
