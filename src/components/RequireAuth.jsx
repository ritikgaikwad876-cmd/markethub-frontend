import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <p className="status-msg">Checking session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
