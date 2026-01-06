import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[]; // Support for multiple roles
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole, requiredRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine allowed roles
  let allowedRoles: string[] = [];
  if (requiredRoles && requiredRoles.length > 0) {
    allowedRoles = requiredRoles;
  } else if (requiredRole) {
    // Support comma-separated roles in requiredRole string
    allowedRoles = requiredRole.split(',').map(role => role.trim());
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && user?.roleName && !allowedRoles.includes(user.roleName)) {
    // Redirect to dashboard with error message or show access denied
    return <Navigate to="/" state={{
      error: `Access denied. This page requires ${allowedRoles.join(', ')} role.`,
      from: location
    }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
