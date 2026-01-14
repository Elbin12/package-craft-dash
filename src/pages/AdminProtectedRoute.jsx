// src/components/routes/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access');
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Check if user is authenticated and has access token
  if (!accessToken || !isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user data is not loaded yet but token exists, still allow (data will load)
  // This handles the case where the app just refreshed and user data is being loaded from localStorage

  return children;
};

export default AdminProtectedRoute;
