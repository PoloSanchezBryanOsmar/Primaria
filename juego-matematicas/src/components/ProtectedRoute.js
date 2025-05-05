import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, allowedRole, userRole, children }) {
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si tiene un rol que no corresponde a esta ruta, redirigir a su dashboard
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'estudiante') return <Navigate to="/estudiante" replace />;
    if (userRole === 'docente') return <Navigate to="/docente" replace />;
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }
  
  // Si está autenticado y tiene el rol correcto, mostrar el componente
  return children;
}

export default ProtectedRoute;