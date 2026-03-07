import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { safeGetItem, safeParseAdminLevel } from '../lib/safeParse';

function ProtectedRoute({ children, requiredRole }) {
  const token = safeGetItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole) {
    const adminLevel = safeParseAdminLevel();
    if (requiredRole === 'SUPER_ADMIN' && adminLevel !== 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'ADMIN') {
      const userRole = safeGetItem('userRole');
      if (adminLevel === 'SUPER_ADMIN' || userRole !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  if (children) return children;
  return <Outlet />;
}

export default ProtectedRoute;
