import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('adminToken');

  // If there's no token, redirect to login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Otherwise, render the protected page
  return children;
}

export default ProtectedAdminRoute;
