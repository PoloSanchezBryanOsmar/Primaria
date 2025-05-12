import React from 'react';
import { Link } from 'react-router-dom';
import './DocenteDashboard.css';

const DocenteDashboard = ({ user, onLogout }) => {
  const subjects = [
    { name: 'Español', icon: '📚' },
    { name: 'Matemáticas', icon: '📐' },
    { name: 'Geografía', icon: '🗺️' },
    { name: 'Historia', icon: '📜' },
    { name: 'Ciencias Naturales', icon: '🔬' },
    { name: 'Cívica y Ética', icon: '⚖️' }
  ];

  // Añadir más debug para identificar posibles problemas
  console.log("Información del usuario:", user);
  console.log("Grupos asignados:", user.assignedGroups);

  return (
    <div className="docente-dashboard">
      {/* Encabezado con info del usuario */}
      <header className="dashboard-header">
        <h2>Bienvenido, {user.name}</h2>
        <p>Rol: <strong>{user.role}</strong></p>
        
        {/* Mostrar grupos asignados si existen */}
        {user.assignedGroups && user.assignedGroups.length > 0 ? (
          <>
            <h3>Grupos Asignados</h3>
            <ul className="assigned-groups">
              {user.assignedGroups.map((group, index) => (
                <li key={index}>
                  <strong>{group.groupName}</strong> - {group.gradeName}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No tienes grupos asignados.</p>
        )}
        
        {/* Botón de cierre de sesión */}
        <button onClick={onLogout} className="logout-button">Cerrar Sesión</button>
      </header>
      
      {/* Sección de materias */}
      <section className="subjects-section">
        <h3>Tus Materias</h3>
        <div className="subjects-grid">
          {subjects.map((subject, index) => {
            const subjectUrl = subject.name.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "-");
            
            return (
              <Link
                to={`/docente/${subjectUrl}`}
                key={index}
                className="subject-card-link"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="subject-card">
                  <span className="subject-icon">{subject.icon}</span>
                  <span className="subject-name">{subject.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DocenteDashboard;