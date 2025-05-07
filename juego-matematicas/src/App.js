import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import EstudianteDashboard from './components/Dashboard/EstudianteDashboard';
import DocenteDashboard from './components/Dashboard/DocenteDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SubjectPage from './SubjectPage'; // asegúrate de que el path sea correcto
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Verificar si hay un usuario en localStorage al cargar la aplicación
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="app">
      <Routes>
  <Route path="/login" element={
    isAuthenticated ? 
      <Navigate to={`/${currentUser.role}`} replace /> : 
      <Login setCurrentUser={setCurrentUser} setIsAuthenticated={setIsAuthenticated} />
  } />
  
  <Route path="/docente" element={
    <ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="docente" userRole={currentUser?.role}>
      <DocenteDashboard user={currentUser} onLogout={handleLogout} />
    </ProtectedRoute>
  } />
  
  {/* Asegúrate de que esta ruta esté correctamente configurada */}
  <Route exact path="/docente/:subject" element={
    <ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="docente" userRole={currentUser?.role}>
      <SubjectPage user={currentUser} />
    </ProtectedRoute>
  } />
  
  <Route path="/estudiante" element={
    <ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="estudiante" userRole={currentUser?.role}>
      <EstudianteDashboard user={currentUser} onLogout={handleLogout} />
    </ProtectedRoute>
  } />
  
  <Route path="/admin" element={
    <ProtectedRoute isAuthenticated={isAuthenticated} allowedRole="admin" userRole={currentUser?.role}>
      <AdminDashboard user={currentUser} onLogout={handleLogout} />
    </ProtectedRoute>
  } />
  
  <Route path="/" element={<Navigate to="/login" replace />} />
</Routes>
      </div>
    </Router>
  );
}

export default App;