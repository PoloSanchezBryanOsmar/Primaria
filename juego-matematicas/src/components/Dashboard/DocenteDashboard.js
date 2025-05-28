// DocenteDashboard.js completo con integración de quizzes
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DocenteDashboard.css';

const DocenteDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showStudentTable, setShowStudentTable] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', grade_id: '' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  
  // Datos de las materias
  const subjects = [
    { id: 1, name: 'Español', icon: '📚' },
    { id: 2, name: 'Matemáticas', icon: '📐' },
    { id: 3, name: 'Geografía', icon: '🗺️' },
    { id: 4, name: 'Historia', icon: '📜' },
    { id: 5, name: 'Ciencias Naturales', icon: '🔬' },
    { id: 6, name: 'Cívica y Ética', icon: '⚖️' }
  ];
  
  // Actividades recientes ficticias
  const recentActivities = [
    { id: 1, description: 'Calificación: Examen de Historia', date: '12/05/2025', group: '1A' },
    { id: 2, description: 'Asistencia registrada', date: '12/05/2025', group: '2B' },
    { id: 3, description: 'Tarea asignada: Problemas de matemáticas', date: '11/05/2025', group: '1A' },
    { id: 4, description: 'Mensaje enviado a padres', date: '10/05/2025', group: 'Todos' }
  ];

  // Próximos eventos
  const upcomingEvents = [
    { id: 1, name: 'Examen de Español', date: '15/05/2025', group: '1A' },
    { id: 2, name: 'Junta de profesores', date: '17/05/2025', group: 'N/A' },
    { id: 3, name: 'Entrega de calificaciones', date: '20/05/2025', group: 'Todos' }
  ];

  // API
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Cargar quizzes activos para el docente
  useEffect(() => {
    const fetchActiveQuizzes = async () => {
      try {
        if (user && user.assignedGroups && user.assignedGroups.length > 0) {
          // Obtener los IDs de los grados asignados
          const gradeIds = user.assignedGroups.map(group => group.gradeId);
          
          // Realizar la petición para obtener quizzes activos
          const response = await api.get('/quizzes/active', { 
            params: { gradeIds: gradeIds.join(',') } 
          });
          
          // Mapear los resultados a un formato más útil
          const fetchedQuizzes = response.data.map(quiz => ({
            id: quiz.quiz_id,
            title: quiz.title,
            subjectId: quiz.subject_id,
            gradeId: quiz.grade_id,
            gradeName: quiz.grade_name,
            gradeLevel: quiz.grade_level,
            questions: quiz.questions,
            time: quiz.time,
            difficulty: quiz.difficulty,
            icon: quiz.icon,
            color: quiz.color
          }));
          
          setActiveQuizzes(fetchedQuizzes);
        }
      } catch (error) {
        console.error('Error al cargar quizzes activos:', error);
      }
    };
  
    fetchActiveQuizzes();
  }, [user]);
  

  // Función para cargar estudiantes de un grupo específico
  const fetchStudents = async (gradeId) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students/${gradeId}`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      showNotification('error', 'Error al cargar la lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  // Función para agregar un nuevo estudiante
  const addStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      showNotification('error', 'El nombre del estudiante es requerido');
      return;
    }

    try {
      await api.post('/admin/students', {
        name: newStudent.name,
        grade_id: selectedGroup.gradeId
      });
      
      setNewStudent({ name: '', grade_id: '' });
      showNotification('success', 'Estudiante agregado correctamente');
      fetchStudents(selectedGroup.gradeId); // Recargar la lista
      setShowAddStudentForm(false);
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      showNotification('error', 'Error al agregar el estudiante');
    }
  };

  // Función para eliminar un estudiante
  const deleteStudent = async (studentId) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/students/${studentId}`);
      showNotification('success', 'Estudiante eliminado correctamente');
      fetchStudents(selectedGroup.gradeId); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      showNotification('error', 'Error al eliminar el estudiante');
    }
  };

  // Función para ver los alumnos de un grupo
  const handleViewStudents = (group) => {
    setSelectedGroup(group);
    fetchStudents(group.gradeId);
    setShowStudentTable(true);
  };

  // Función para iniciar un quiz
  const handleStartQuiz = (quizData) => {
    // Guardar la información del quiz en localStorage para su uso posterior
    localStorage.setItem('currentQuiz', JSON.stringify({
      quizId: quizData.id,
      gradeId: quizData.gradeId,
      subjectId: quizData.subjectId
    }));
    
    // Redirigir a la página del quiz
    navigate(`/docente/quiz/${quizData.id}`);
  };

  // Obtener quizzes activos para una materia específica
  const getActiveQuizzesForSubject = (subjectId) => {
    return activeQuizzes.filter(quiz => quiz.subjectId === subjectId);
  };

  // Renderiza el contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="welcome-section">
              <h2>Bienvenido, {user?.name || 'Docente'}</h2>
              <p className="date-display">Martes, 13 de mayo de 2025</p>
            </div>
            
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Grupos Asignados</h3>
                <div className="card-value">{user?.assignedGroups?.length || 0}</div>
              </div>
              <div className="summary-card">
                <h3>Materias</h3>
                <div className="card-value">{subjects.length}</div>
              </div>
              <div className="summary-card">
                <h3>Próximos Eventos</h3>
                <div className="card-value">{upcomingEvents.length}</div>
              </div>
            </div>
            
            <div className="dashboard-panels">
              <div className="panel recent-activities">
                <h3>Actividades Recientes</h3>
                <ul className="activities-list">
                  {recentActivities.map(activity => (
                    <li key={activity.id} className="activity-item">
                      <div className="activity-info">
                        <span className="activity-description">{activity.description}</span>
                        <div className="activity-meta">
                          <span className="activity-date">{activity.date}</span>
                          <span className="activity-group">Grupo: {activity.group}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="panel upcoming-events">
                <h3>Próximos Eventos</h3>
                <ul className="events-list">
                  {upcomingEvents.map(event => (
                    <li key={event.id} className="event-item">
                      <div className="event-date">{event.date}</div>
                      <div className="event-details">
                        <div className="event-name">{event.name}</div>
                        <div className="event-group">Grupo: {event.group}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'materias':
        return (
          <div className="materias-content">
            <h2>Mis Materias</h2>
            <div className="subjects-grid">
              {subjects.map((subject) => {
                const subjectQuizzes = getActiveQuizzesForSubject(subject.id);
                const hasQuizzes = subjectQuizzes.length > 0;
                
                return (
                  <div key={subject.id} className="subject-card">
                    <div className="subject-header">
                      <span className="subject-icon">{subject.icon}</span>
                      <span className="subject-name">{subject.name}</span>
                    </div>
                    
                    <div className="subject-content">
                      <div className="subject-quizzes">
                        <h4>Quizzes Disponibles</h4>
                        {hasQuizzes ? (
                          <div className="quiz-list">
                            {subjectQuizzes.map(quiz => (
                              <div key={quiz.id} className="quiz-list-item">
                                <div className="quiz-list-icon" style={{ backgroundColor: quiz.color }}>{quiz.icon}</div>
                                <div className="quiz-list-info">
                                  <span className="quiz-list-title">{quiz.title}</span>
                                  <span className="quiz-list-detail">{quiz.questions} preguntas | {quiz.time} seg</span>
                                </div>
                                <button 
                                  className="btn-sm btn-primary quiz-action-btn"
                                  onClick={() => handleStartQuiz(quiz)}
                                >
                                  Iniciar
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-quizzes-message">
                            <span>No hay quizzes disponibles</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="subject-actions">
                        <button className="btn-outline">Recursos</button>
                        <button className="btn-outline">Actividades</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'grupos':
        return (
          <div className="grupos-content">
            {showStudentTable && selectedGroup ? (
              <>
                <div className="student-table-header">
                  <h2>Alumnos de {selectedGroup.gradeName} - {selectedGroup.groupName}</h2>
                  <div className="student-table-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                    >
                      {showAddStudentForm ? 'Cancelar' : 'Agregar Alumno'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowStudentTable(false);
                        setShowAddStudentForm(false);
                        setSelectedGroup(null);
                      }}
                    >
                      Volver a Grupos
                    </button>
                  </div>
                </div>
                
                {/* Formulario para agregar alumno */}
                {showAddStudentForm && (
                  <div className="add-student-form">
                    <h3>Agregar Nuevo Alumno</h3>
                    <form onSubmit={addStudent}>
                      <div className="form-group">
                        <label>Nombre completo:</label>
                        <input
                          type="text"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-buttons">
                        <button type="submit" className="btn btn-primary">Guardar</button>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => setShowAddStudentForm(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Tabla de alumnos */}
                <div className="student-table-container">
                  {loading ? (
                    <div className="loading">Cargando alumnos...</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nombre</th>
                          <th>Tareas Completadas</th>
                          <th>Promedio</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length > 0 ? (
                          students.map((student) => (
                            <tr key={student.id}>
                              <td>{student.id}</td>
                              <td>{student.name}</td>
                              <td>{student.tasks_done || 0}</td>
                              <td>{student.average_grade || '0.00'}</td>
                              <td className="actions-cell">
                                <button
                                  onClick={() => {/* Editar estudiante */}}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  className="btn btn-danger btn-sm"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="empty-message">
                              No hay alumnos registrados en este grupo
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>Mis Grupos</h2>
                {user?.assignedGroups && user.assignedGroups.length > 0 ? (
                  <div className="grupos-grid">
                    {user.assignedGroups.map((group, index) => (
                      <div key={index} className="grupo-card">
                        <h3>{group.groupName}</h3>
                        <p>Grado: {group.gradeName}</p>
                        <div className="grupo-actions">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleViewStudents(group)}
                          >
                            Ver Alumnos
                          </button>
                          <button className="btn btn-secondary">Asistencia</button>
                          <button className="btn btn-secondary">Calificaciones</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No tienes grupos asignados actualmente.</p>
                    <button className="btn btn-primary">Solicitar Asignación</button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      case 'calificaciones':
        return (
          <div className="calificaciones-content">
            <h2>Gestión de Calificaciones</h2>
            <div className="calificaciones-filters">
              <div className="filter-group">
                <label>Seleccionar Grupo:</label>
                <select className="form-select">
                  <option value="">Todos los grupos</option>
                  {user?.assignedGroups?.map((group, index) => (
                    <option key={index} value={group.groupName}>
                      {group.groupName} - {group.gradeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Seleccionar Materia:</label>
                <select className="form-select">
                  <option value="">Todas las materias</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Periodo:</label>
                <select className="form-select">
                  <option value="1">Primer Bimestre</option>
                  <option value="2">Segundo Bimestre</option>
                  <option value="3">Tercer Bimestre</option>
                  <option value="4">Cuarto Bimestre</option>
                  <option value="5">Quinto Bimestre</option>
                </select>
              </div>
              <button className="btn btn-primary">Buscar</button>
            </div>
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>Selecciona un grupo y materia para gestionar calificaciones</p>
            </div>
          </div>
        );
      
      case 'recursos':
        return (
          <div className="recursos-content">
            <h2>Recursos Educativos</h2>
            <div className="recursos-categories">
              <div className="recurso-category">
                <h3>Mis Recursos</h3>
                <div className="category-items">
                  <div className="recurso-item">
                    <div className="recurso-icon">📝</div>
                    <div className="recurso-info">
                      <div className="recurso-title">Guía de Gramática</div>
                      <div className="recurso-meta">Español | PDF</div>
                    </div>
                  </div>
                  <div className="recurso-item">
                    <div className="recurso-icon">🎬</div>
                    <div className="recurso-info">
                      <div className="recurso-title">Video: Fracciones</div>
                      <div className="recurso-meta">Matemáticas | MP4</div>
                    </div>
                  </div>
                  <div className="recurso-item">
                    <div className="recurso-icon">🔢</div>
                    <div className="recurso-info">
                      <div className="recurso-title">Ejercicios de Álgebra</div>
                      <div className="recurso-meta">Matemáticas | DOCX</div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline">Ver todos mis recursos</button>
              </div>
              
              <div className="recurso-category">
                <h3>Biblioteca Escolar</h3>
                <div className="category-items">
                  <div className="recurso-item">
                    <div className="recurso-icon">📊</div>
                    <div className="recurso-info">
                      <div className="recurso-title">Plan de Estudios 2025</div>
                      <div className="recurso-meta">General | PDF</div>
                    </div>
                  </div>
                  <div className="recurso-item">
                    <div className="recurso-icon">🧪</div>
                    <div className="recurso-info">
                      <div className="recurso-title">Guía de Experimentos</div>
                      <div className="recurso-meta">Ciencias | PDF</div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline">Explorar biblioteca</button>
              </div>
            </div>
            <div className="upload-section">
              <h3>Subir Nuevo Recurso</h3>
              <div className="upload-controls">
                <button className="btn btn-primary">Seleccionar Archivo</button>
                <p>Formatos permitidos: PDF, DOCX, PPT, MP4, JPG</p>
              </div>
            </div>
          </div>
        );
      
      case 'mensajes':
        return (
          <div className="mensajes-content">
            <h2>Centro de Mensajes</h2>
            <div className="mensajes-tabs">
              <button className="tab-btn active">Recibidos</button>
              <button className="tab-btn">Enviados</button>
              <button className="tab-btn">Redactar</button>
            </div>
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <p>No hay mensajes nuevos</p>
              <button className="btn btn-primary">Redactar Mensaje</button>
            </div>
          </div>
        );
      
      default:
        return <div>Selecciona una opción del menú</div>;
    }
  };

  return (
    <div className="docente-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'D'}
          </div>
          <div className="user-info">
            <h3>{user?.name || 'Docente'}</h3>
            <p>{user?.role || 'Profesor'}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={activeSection === 'dashboard' ? 'active' : ''}>
              <button onClick={() => setActiveSection('dashboard')}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </button>
            </li>
            <li className={activeSection === 'materias' ? 'active' : ''}>
              <button onClick={() => setActiveSection('materias')}>
                <span className="nav-icon">📚</span>
                <span className="nav-text">Mis Materias</span>
              </button>
            </li>
            <li className={activeSection === 'grupos' ? 'active' : ''}>
              <button onClick={() => setActiveSection('grupos')}>
                <span className="nav-icon">👨‍👩‍👧‍👦</span>
                <span className="nav-text">Mis Grupos</span>
              </button>
            </li>
            <li className={activeSection === 'calificaciones' ? 'active' : ''}>
              <button onClick={() => setActiveSection('calificaciones')}>
                <span className="nav-icon">📝</span>
                <span className="nav-text">Calificaciones</span>
              </button>
            </li>
            <li className={activeSection === 'recursos' ? 'active' : ''}>
              <button onClick={() => setActiveSection('recursos')}>
                <span className="nav-icon">🧩</span>
                <span className="nav-text">Recursos</span>
              </button>
            </li>
            <li className={activeSection === 'mensajes' ? 'active' : ''}>
              <button onClick={() => setActiveSection('mensajes')}>
                <span className="nav-icon">✉️</span>
                <span className="nav-text">Mensajes</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="settings-btn">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Configuración</span>
          </button>
          <button onClick={onLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
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
        {renderContent()}
      </div>
    </div>
  );
};

export default DocenteDashboard;