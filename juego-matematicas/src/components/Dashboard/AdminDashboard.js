import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';
//import QuizCatalog from './Quiz/QuizCatalog';
import QuizCatalogEnhanced from './Quiz/QuizCatalogEnhanced';
import QuizPreviewEnhanced from './Quiz/QuizPreviewEnhanced';
//import QuizPreview from './Quiz/QuizPreview';
import QuizView from './Quiz/QuizView';
import loguito1 from '../../img/loguito1.png';
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie } from "react-icons/fa";

// Configuración de API (debe ir aquí)
const api = axios.create({ baseURL: 'http://localhost:5000/api/admin' });

// Componente para la sección de Resumen
const ResumenPage = ({ grades, teachers, totalStudents }) => {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Panel Administrativo</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-title">Total Estudiantes</div>
          <div className="stat-value">{totalStudents}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-title">Total Maestros</div>
          <div className="stat-value">{teachers.length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-title">Actividades Completadas</div>
          <div className="stat-value">8,942</div>
        </div>
        <div className="stat-card green">
          <div className="stat-title">Nuevos Registros</div>
          <div className="stat-value">128</div>
        </div>
      </div>
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
    </>
  );
};

// Componente para la sección de Usuarios
const UsuariosPage = ({ 
  grades, 
  teachers, 
  activeTab, 
  setActiveTab,
  gradeForm,
  setGradeForm,
  teacherForm,
  setTeacherForm,
  assignForm,
  setAssignForm,
  editMode,
  setEditMode,
  currentId,
  setCurrentId,
  showNotification,
  fetchData,
  resetForm,
  handleGradeSubmit,
  handleTeacherSubmit,
  handleAssignSubmit,
  editGrade,
  deleteGrade,
  editTeacher,
  deleteTeacher
}) => {
  
  const renderGrades = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Grados y Grupos</h2>
      </div>
      <div className="section-body">
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
                {[
                  "Primer Grado",
                  "Segundo Grado",
                  "Tercer Grado",
                  "Cuarto Grado",
                  "Quinto Grado",
                  "Sexto Grado"
                ].map((option) => (
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
                {["Grupo A", "Grupo B", "Grupo C", "Grupo D"].map((option) => (
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

  const renderTeachers = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Docentes</h2>
      </div>
      <div className="section-body">
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

  const renderAssignments = () => (
    <div className="content-section">
      <div className="section-header">
        <h2 className="section-title">Asignación de Docentes a Grados</h2>
      </div>
      <div className="section-body">
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
                            await api.post('/grades/assign', {
                              gradeId: grade.id,
                              teacherId: null
                            });
                            showNotification('success', 'Docente desasignado correctamente');
                            fetchData();
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Gestión Escolar</h1>
      </div>
      
      <div className="tab-navigation">
  <button
    className={`tab-item tab-grados${activeTab === 'grades' ? ' active' : ''}`}
    onClick={() => setActiveTab('grades')}
  >
    <FaUserGraduate className={`tab-icon ${activeTab === 'grades' ? 'active' : ''}`} />
    Grados y Grupos
  </button>
  <button
    className={`tab-item tab-docentes${activeTab === 'teachers' ? ' active' : ''}`}
    onClick={() => setActiveTab('teachers')}
  >
    <FaChalkboardTeacher className={`tab-icon ${activeTab === 'teachers' ? 'active' : ''}`} />
    Docentes
  </button>
  <button
    className={`tab-item tab-asignaciones${activeTab === 'assignments' ? ' active' : ''}`}
    onClick={() => setActiveTab('assignments')}
  >
    <FaUserTie className={`tab-icon ${activeTab === 'assignments' ? 'active' : ''}`} />
    Asignaciones
  </button>
</div>
      
      {activeTab === 'grades' && renderGrades()}
      {activeTab === 'teachers' && renderTeachers()}
      {activeTab === 'assignments' && renderAssignments()}
    </>
  );
};

// Componente para la sección de Contenido
const ContenidoPage = ({ grades, teachers }) => {
  const navigate = useNavigate();

  // Función para ordenar los grados y grupos
  const getSortedGrades = () => {
    const gradeOrder = {
      'Primer Grado': 1,
      'Segundo Grado': 2,
      'Tercer Grado': 3,
      'Cuarto Grado': 4,
      'Quinto Grado': 5,
      'Sexto Grado': 6,
    };
    
    return [...grades].sort((a, b) => {
      const gradeComparison = gradeOrder[a.name] - gradeOrder[b.name];
      
      if (gradeComparison === 0) {
        const groupA = a.level.replace('Grupo ', '');
        const groupB = b.level.replace('Grupo ', '');
        return groupA.localeCompare(groupB);
      }
      
      return gradeComparison;
    });
  };

  // Función para obtener el nombre del profesor asignado
  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Sin asignar';
    const teacher = teachers.find(t => t.id === parseInt(teacherId, 10));
    return teacher ? teacher.name : 'Sin asignar';
  };

  // Función para ir al quiz de español - CORREGIDA
  const goToQuiz = (gradeId) => {
    console.log(`Navegando al quiz para el grado ID: ${gradeId}`);
    navigate(`/admin/contenido/quiz/${gradeId}`);
  };

  // Función para gestionar recursos
  const manageResources = (gradeId) => {
    // Esta función puede implementarse más adelante
    console.log(`Gestionar recursos para el grado: ${gradeId}`);
  };

  const sortedGrades = getSortedGrades();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Contenido Educativo</h1>
      </div>
      
      <div className="content-description">
        <p>
          En esta sección podrás gestionar el contenido educativo por grado y grupo.
          Selecciona un grado para administrar materiales, actividades y evaluaciones.
        </p>
      </div>
      
      <div className="grades-container">
        {sortedGrades.length > 0 ? (
          sortedGrades.map((grade) => (
            <div key={grade.id} className="grade-card">
              <div className="grade-header">
                <h3 className="grade-title">{grade.name} - {grade.level}</h3>
                <div className="grade-teacher">
                  <span className="teacher-label">Profesor:</span>
                  <span className="teacher-name">{getTeacherName(grade.teacher_id)}</span>
                </div>
              </div>
              <div className="grade-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => goToQuiz(grade.id)}
                >
                  Ver Contenido
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => manageResources(grade.id)}
                >
                  Gestionar Recursos
                </button>
              </div>
              <div className="grade-stats">
                <div className="stat-item">
                  <div className="stat-info">
                    <span className="stat-value">8</span>
                    <span className="stat-label">Materiales</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-info">
                    <span className="stat-value">12</span>
                    <span className="stat-label">Actividades</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-info">
                    <span className="stat-value">5</span>
                    <span className="stat-label">Evaluaciones</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No hay grados o grupos registrados.</p>
            <p>Dirígete a la sección de "Gestión Escolar" para crear grados y grupos.</p>
          </div>
        )}
      </div>
    </>
  );
};

// Componente para la sección de Configuración
const ConfiguracionPage = () => {
  const [form, setForm] = React.useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = React.useState(null);

  const token = localStorage.getItem('token');

  // Cargar el nombre actual del admin
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(f => ({ ...f, name: res.data.name || '' }));
      } catch (err) {
        setMessage({ type: 'error', text: 'No se pudo cargar el perfil.' });
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Actualizar nombre en la base de datos
  const handleProfileSubmit = async e => {
    e.preventDefault();
    try {
      await api.put('/profile', { name: form.name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Nombre actualizado correctamente.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al actualizar el nombre.' });
    }
  };

  // Cambiar contraseña en la base de datos
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    try {
      await api.put('/profile/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al cambiar la contraseña.' });
    }
  };

  return (
    <div className="config-full">
      <h1 className="page-title">Configuración</h1>
      {message && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}
      <form className="form" onSubmit={handleProfileSubmit} style={{ marginBottom: 24 }}>
        <h3 className="form-title">Datos del administrador</h3>
        <div className="form-group">
          <label>Nombre completo:</label>
          <input
            type="text"
            name="name"
            className="form-input"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">Actualizar datos</button>
        </div>
      </form>
      <form className="form" onSubmit={handlePasswordSubmit}>
        <h3 className="form-title">Cambiar contraseña</h3>
        <div className="form-group">
          <label>Contraseña actual:</label>
          <input
            type="password"
            name="currentPassword"
            className="form-input"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Nueva contraseña:</label>
          <input
            type="password"
            name="newPassword"
            className="form-input"
            value={form.newPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirmar nueva contraseña:</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-input"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">Actualizar contraseña</button>
        </div>
      </form>
    </div>
  );
};


// Componente principal del Dashboard
const AdminDashboard = ({ onLogout }) => {
  // Estados para manejar los datos
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeTab, setActiveTab] = useState('grades');
  
  // Estados para formularios
  const [gradeForm, setGradeForm] = useState({ grado: '', grupo: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [assignForm, setAssignForm] = useState({ teacherId: '', gradeId: '' });

  // Estado para edición
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // Configuración para navegación
  const navigate = useNavigate();

  // Función para cargar datos desde el back-end
  const fetchAllStudents = useCallback(async () => {
    try {
      const gradesResponse = await api.get('/grades');
      const gradesData = gradesResponse.data;
      setGrades(gradesData);
      
      let allStudents = [];
      let studentCount = 0;
      
      for (const grade of gradesData) {
        try {
          const studentsResponse = await api.get(`/students/${grade.id}`);
          const gradeStudents = studentsResponse.data;
          allStudents = [...allStudents, ...gradeStudents];
          studentCount += gradeStudents.length;
        } catch (error) {
          console.warn(`Error al obtener estudiantes del grado ${grade.id}:`, error);
        }
      }
      
      setStudents(allStudents);
      setTotalStudents(studentCount);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      showNotification('error', 'Error al cargar datos de estudiantes');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const gradesResponse = await api.get('/grades');
      setGrades(gradesResponse.data);
      
      const teachersResponse = await api.get('/teachers');
      setTeachers(teachersResponse.data);
      
      await fetchAllStudents();
    } catch (error) {
      console.error('Error al cargar datos:', error.response ? error.response.data : error.message);
      showNotification('error', 'Error al cargar datos del servidor');
      setTotalStudents(1248);
    }
  }, [fetchAllStudents]);

  // Cargar datos al iniciar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Función para reiniciar el formulario
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

  // Verificar duplicados
  const isDuplicate = (grado, grupo) => {
    return grades.some(
      (g) => g.name === grado && g.level === grupo
    );
  };

  // Manejadores para Grados
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

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {/* Agrega la imagen aquí */}
            <img 
              src={loguito1}
              alt="EDUKIDS"
              style={{ width: 36, height: 36, marginRight: 10, borderRadius: '50%' }}
            />
            <span>
              <span className="edukids-edu">EDU</span>
              <span className="edukids-kids">KIDS</span>
            </span>
          </div>
        </div>
        <div className="admin-title">Panel Administrativo</div>
        <div className="sidebar-menu">
          <NavLink 
            to="/admin/resumen"
            className={({isActive}) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <span>Resumen</span>
          </NavLink>
          <NavLink 
            to="/admin/usuarios"
            className={({isActive}) => `menu-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <span>Usuarios</span>
          </NavLink>
          <NavLink 
            to="/admin/contenido"
            className={({isActive}) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <span>Contenido</span>
          </NavLink>
          <NavLink 
            to="/admin/configuracion"
            className={({isActive}) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <span>Configuración</span>
          </NavLink>
          <div
  className="menu-item"
  onClick={onLogout}
  style={{ cursor: 'pointer', userSelect: 'none' }}
  tabIndex={0}
  role="button"
  onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onLogout(); }}
>
  <span>Cerrar Sesión</span>
</div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✓' : '✕'}
            </span>
            {notification.message}
          </div>
        )}
        
        {/* Contenido principal con rutas */}
        <Routes>
          <Route path="resumen" element={
            <ResumenPage 
              grades={grades} 
              teachers={teachers} 
              totalStudents={totalStudents} 
            />
          } />
          <Route path="usuarios" element={
            <UsuariosPage 
              grades={grades}
              teachers={teachers}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              gradeForm={gradeForm}
              setGradeForm={setGradeForm}
              teacherForm={teacherForm}
              setTeacherForm={setTeacherForm}
              assignForm={assignForm}
              setAssignForm={setAssignForm}
              editMode={editMode}
              setEditMode={setEditMode}
              currentId={currentId}
              setCurrentId={setCurrentId}
              showNotification={showNotification}
              fetchData={fetchData}
              resetForm={resetForm}
              handleGradeSubmit={handleGradeSubmit}
              handleTeacherSubmit={handleTeacherSubmit}
              handleAssignSubmit={handleAssignSubmit}
              editGrade={editGrade}
              deleteGrade={deleteGrade}
              editTeacher={editTeacher}
              deleteTeacher={deleteTeacher}
            />
          } />
          <Route path="contenido" element={
            <ContenidoPage 
              grades={grades} 
              teachers={teachers} 
            />
          } />
          {/* Nueva ruta para el quiz */}
          <Route path="contenido/quiz/:gradeId" element={<QuizCatalogEnhanced />} />          
          <Route path="contenido/quiz/:gradeId/:quizId" element={<QuizPreviewEnhanced />} />
          <Route path="contenido/quiz/:gradeId/:quizId/play" element={<QuizView />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="*" element={<Navigate to="/admin/resumen" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;