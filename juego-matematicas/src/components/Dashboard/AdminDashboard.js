import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import axios from 'axios';

// Componente principal del Dashboard
const AdminDashboard = ({ onLogout }) => {
  // Estados para manejar los datos
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('grades'); // Cambiado a 'grades' por defecto

  const gradoOptions = [
    "Primer Grado",
    "Segundo Grado",
    "Tercer Grado",
    "Cuarto Grado",
    "Quinto Grado",
    "Sexto Grado"
  ];
  const grupoOptions = [
    "Grupo A",
    "Grupo B",
    "Grupo C", 
    "Grupo D"
  ];

  // Estados para formularios
  const [gradeForm, setGradeForm] = useState({ grado: '', grupo: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [assignForm, setAssignForm] = useState({ teacherId: '', gradeId: '' });

  // Estado para edición
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  const api = axios.create({ baseURL: 'http://localhost:5000/api/admin' });

  // Función para cargar datos desde el back-end (usando useCallback para memoizarla)
  const fetchData = useCallback(async () => {
    try {
      const gradesResponse = await api.get('/grades');
      const teachersResponse = await api.get('/teachers');
      setGrades(gradesResponse.data);
      setTeachers(teachersResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al cargar datos del servidor');
    }
  }, [api]);

  // Cargar datos al iniciar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Función para reiniciar el formulario actual
  const resetForm = (formType) => {
    setEditMode(false);
    setCurrentId(null);
    switch (formType) {
      case 'grade':
        setGradeForm({ grado: '', grupo: '' });
        break;
      case 'teacher':
        setTeacherForm({ name: '', email: '' });
        break;
      case 'assign':
        setAssignForm({ teacherId: '', gradeId: '' });
        break;
      default:
        break;
    }
  };

  // Manejadores para Grados
  const isDuplicate = (grado, grupo) => {
    return grades.some(
      (g) => g.name === grado && g.level === grupo
    );
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
  
    const { grado, grupo } = gradeForm;
  
    if (!grado || !grupo) {
      showNotification('error', 'Por favor selecciona un grado y un grupo');
      return;
    }
  
    if (isDuplicate(grado, grupo) && !editMode) {
      showNotification('error', 'Esta combinación de grado y grupo ya existe');
      return;
    }
  
    try {
      // Ahora solo creamos un grado, ya no es necesario crear un grupo
      if (editMode) {
        await api.put(`/grades/${currentId}`, { 
          name: grado, 
          level: grupo 
        });
        showNotification('success', 'Grado y grupo actualizados correctamente');
      } else {
        await api.post('/grades', { 
          name: grado, 
          level: grupo 
        });
        showNotification('success', 'Grado y grupo creados correctamente');
      }
      fetchData();
      resetForm('grade');
    } catch (error) {
      console.error('Error al guardar:', error.response?.data || error.message);
      showNotification('error', 'Error al guardar el grado y grupo');
    }
  };

  const editGrade = (grade) => {
    setGradeForm({
      grado: grade.name,  
      grupo: grade.level
    });
    setEditMode(true);
    setCurrentId(grade.id);
  };

  const deleteGrade = async (gradeId) => {
    try {
      await api.delete(`/grades/${gradeId}`);
      showNotification('success', 'Grado eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar el grado:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al eliminar el grado');
    }
  };

  // Manejadores para Docentes
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/teachers/${currentId}`, teacherForm);
        showNotification('success', 'Docente actualizado correctamente');
      } else {
        await api.post('/teachers', teacherForm);
        showNotification('success', 'Docente registrado correctamente');
      }
      fetchData();
      resetForm('teacher');
    } catch (error) {
      console.error('Error al guardar el docente:', error.response?.data || error.message);
      showNotification('error', 'Error al guardar el docente');
    }
  };

  const editTeacher = (teacher) => {
    setTeacherForm({ name: teacher.name, email: teacher.email });
    setEditMode(true);
    setCurrentId(teacher.id);
  };

  const deleteTeacher = async (teacherId) => {
    try {
      // Verificar si tiene grados asignados en lugar de grupos
      const hasAssignedGrades = grades.some(grade => grade.teacher_id === parseInt(teacherId, 10));
      if (hasAssignedGrades) {
        showNotification('error', 'No se puede eliminar este docente porque tiene grados asignados');
        return;
      }
      await api.delete(`/teachers/${teacherId}`);
      showNotification('success', 'Docente eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar el docente:', error);
      showNotification('error', 'Error al eliminar el docente');
    }
  };

  // Manejador para asignar docentes
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignForm.teacherId || !assignForm.gradeId) {
      showNotification('error', 'Seleccione un docente y un grado');
      return;
    }
    
    try {
      // Usando la nueva ruta /grades/assign
      await api.post('/grades/assign', {
        gradeId: parseInt(assignForm.gradeId, 10),
        teacherId: parseInt(assignForm.teacherId, 10)
      });
      
      showNotification('success', 'Docente asignado correctamente');
      fetchData();
      resetForm('assign');
    } catch (error) {
      console.error('Error al asignar docente:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al asignar docente');
    }
  };

  // Renderiza el dashboard principal
  const renderDashboard = () => (
    <>
      <div className="page-header">
        <h1 className="page-title">Panel Administrativo</h1>
      </div>
      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Estudiantes</div>
          <div className="stat-value">1248</div>
          <div className="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            12% desde el mes pasado
          </div>
          <div className="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Maestros</div>
          <div className="stat-value">{teachers.length || 64}</div>
          <div className="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            4% desde el mes pasado
          </div>
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Actividades Completadas</div>
          <div className="stat-value">8,942</div>
          <div className="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            18% desde el mes pasado
          </div>
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Nuevos Registros</div>
          <div className="stat-value">128</div>
          <div className="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            6% desde el mes pasado
          </div>
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </div>
        </div>
      </div>
      {/* Gráficos de actividad */}
      <div className="content-row">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Actividad de Usuarios</h2>
              <div className="card-subtitle">Actividad de estudiantes y maestros en los últimos 30 días</div>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              Gráfico de actividad de usuarios
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Distribución por Grado</h2>
              <div className="card-subtitle">Estudiantes por grado escolar</div>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              Gráfico de distribución
            </div>
          </div>
        </div>
      </div>
      {/* Tabla de actividad reciente */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Actividad Reciente</h2>
            <div className="card-subtitle">Últimas actividades en la plataforma</div>
          </div>
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar
          </button>
        </div>
        <div className="card-body">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Actividad</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>María García</td>
                <td>Completó lección de matemáticas</td>
                <td>Hace 2 horas</td>
                <td><span className="status-badge status-completed">Completado</span></td>
              </tr>
              <tr>
                <td>Juan Pérez</td>
                <td>Inició cuestionario de ciencias</td>
                <td>Hace 3 horas</td>
                <td><span className="status-badge status-pending">Pendiente</span></td>
              </tr>
              <tr>
                <td>Ana Rodríguez</td>
                <td>Subió tarea de español</td>
                <td>Hace 4 horas</td>
                <td><span className="status-badge status-completed">Completado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Renderiza la gestión de grados
  const renderGrades = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Grados y Grupos</h2>
      </div>
      <div className="section-body">
        {/* Formulario para grados */}
        <form onSubmit={handleGradeSubmit} className="form">
          <h3 className="form-title">{editMode ? 'Editar Grado y Grupo' : 'Crear Nuevo Grado y Grupo'}</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Grado:</label>
              <select
                value={gradeForm.grado}
                onChange={(e) => setGradeForm({ ...gradeForm, grado: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Seleccionar grado</option>
                {gradoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Grupo:</label>
              <select
                value={gradeForm.grupo}
                onChange={(e) => setGradeForm({ ...gradeForm, grupo: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Seleccionar grupo</option>
                {grupoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn btn-primary">
              {editMode ? 'Actualizar' : 'Crear'}
            </button>
            {editMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => resetForm('grade')}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de grados */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Grado</th>
                <th>Grupo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td>{grade.id}</td>
                  <td>{grade.name}</td>
                  <td>{grade.level}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => editGrade(grade)}
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteGrade(grade.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {grades.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-message">
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Renderiza la gestión de docentes
  const renderTeachers = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Docentes</h2>
      </div>
      <div className="section-body">
        {/* Formulario para docentes */}
        <form onSubmit={handleTeacherSubmit} className="form">
          <h3 className="form-title">{editMode ? 'Editar Docente' : 'Registrar Nuevo Docente'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre completo:</label>
              <input
                type="text"
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Correo electrónico:</label>
              <input
                type="email"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary">
              {editMode ? 'Actualizar' : 'Registrar'}
            </button>
            {editMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => resetForm('teacher')}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {/* Lista de docentes */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo electrónico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.id}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => editTeacher(teacher)}
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteTeacher(teacher.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-message">
                    No hay docentes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

 // Renderiza la asignación de docentes
const renderAssignments = () => (
  <div className="content-section">
    <div className="section-header">
      <h2 className="section-title">Asignación de Docentes a Grados</h2>
    </div>
    <div className="section-body">
      {/* Formulario para asignación */}
      <form onSubmit={handleAssignSubmit} className="form">
        <h3 className="form-title">Nueva Asignación</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Docente:</label>
            <select
              value={assignForm.teacherId}
              onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Seleccionar docente</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Grado y Grupo:</label>
            <select
              value={assignForm.gradeId}
              onChange={(e) => setAssignForm({ ...assignForm, gradeId: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Seleccionar grado y grupo</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} - {grade.level}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            Asignar
          </button>
        </div>
      </form>

      {/* Tabla de asignaciones actuales */}
      <h3 className="form-title">Asignaciones Actuales</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Grado</th>
              <th>Grupo</th>
              <th>Docente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grades
              .filter((grade) => grade.teacher_id)
              .map((grade) => (
                <tr key={grade.id}>
                  <td>{grade.id}</td>
                  <td>{grade.name}</td>
                  <td>{grade.level}</td>
                  <td>{grade.teacher_name || teachers.find(t => t.id === parseInt(grade.teacher_id, 10))?.name || 'No asignado'}</td>
                  <td className="actions-cell">
                    <button
                      onClick={async () => {
                        try {
                          // Usando la nueva ruta /grades/assign
                          await api.post('/grades/assign', {
                            gradeId: grade.id,
                            teacherId: null
                          });
                          showNotification('success', 'Docente desasignado correctamente');
                          fetchData(); // Recargar datos
                        } catch (error) {
                          console.error('Error al desasignar:', error.response ? error.response.data : error.message);
                          showNotification('error', 'Error al desasignar docente');
                        }
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Desasignar
                    </button>
                  </td>
                </tr>
              ))}
            {grades.filter((grade) => grade.teacher_id).length === 0 && (
              <tr>
                <td colSpan="5" className="empty-message">
                  No hay asignaciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tabla de grados sin docente asignado */}
      <h3 className="form-title">Grados y Grupos sin docente asignado</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Grado</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grades
              .filter((grade) => !grade.teacher_id)
              .map((grade) => (
                <tr key={grade.id}>
                  <td>{grade.id}</td>
                  <td>{grade.name}</td>
                  <td>{grade.level}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => {
                        setAssignForm({ ...assignForm, gradeId: grade.id });
                        document.querySelector('.form').scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            {grades.filter((grade) => !grade.teacher_id).length === 0 && (
              <tr>
                <td colSpan="4" className="empty-message">
                  Todos los grados tienen docente asignado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

  // Renderiza el contenido según la sección activa
  const renderContent = () => {
    if (activeSection === 'dashboard') {
      return renderDashboard();
    } else if (activeSection === 'manage') {
      return (
        <>
          <div className="page-header">
            <h1 className="page-title">Gestión Escolar</h1>
          </div>
          
          <div className="tab-navigation">
            <div 
              className={`tab-item ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              Grados y Grupos
            </div>
            <div 
              className={`tab-item ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              Docentes
            </div>
            <div 
              className={`tab-item ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              Asignaciones
            </div>
          </div>
          
          {activeTab === 'grades' && renderGrades()}
          {activeTab === 'teachers' && renderTeachers()}
          {activeTab === 'assignments' && renderAssignments()}
        </>
      );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span>EDUKIDS</span>
          </div>
        </div>
        <div className="admin-title">Panel Administrativo</div>
        <div className="sidebar-menu">
          <div 
            className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Resumen</span>
          </div>
          <div 
            className={`menu-item ${activeSection === 'manage' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('manage');
              setActiveTab('grades');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Usuarios</span>
          </div>
          <div className="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Contenido</span>
          </div>
          <div className="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Configuración</span>
          </div>
          <div className="menu-item" onClick={onLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="main-content">
        {/* Notificación si existe */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✓' : '✕'}
            </span>
            {notification.message}
          </div>
        )}
        {/* Contenido principal */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;