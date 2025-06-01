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
  const [showCredentials, setShowCredentials] = useState(false);
  const [studentCredentials, setStudentCredentials] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

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

  // API configuration mejorada con interceptors
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api'
  });

  // Interceptor para añadir token automáticamente
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token añadido a la request:', token.substring(0, 20) + '...');
      } else {
        console.log('No hay token disponible');
      }
      return config;
    },
    (error) => {
      console.error('Error en interceptor de request:', error);
      return Promise.reject(error);
    }
  );

  // Interceptor para manejar errores de autenticación
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token expirado o inválido, redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Obtener ID del docente
  useEffect(() => {
    const fetchTeacherId = async () => {
      try {
        if (user && user.username) {
          const response = await api.get(`/teacher/id/${user.username}`);
          setTeacherId(response.data.teacher_id);
        }
      } catch (error) {
        console.error('Error al obtener ID del docente:', error);
      }
    };

    fetchTeacherId();
  }, [user]);

  // Cargar quizzes activos para el docente
  useEffect(() => {
    const fetchActiveQuizzes = async () => {
      try {
        if (teacherId) {
          // Obtener quizzes que el admin activó para este docente
          const response = await api.get(`/teacher/quizzes/available/${teacherId}`);
          
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
            color: quiz.color,
            isActiveForStudents: Boolean(parseInt(quiz.is_active_for_students))
          }));
          
          setActiveQuizzes(fetchedQuizzes);
        }
      } catch (error) {
        console.error('Error al cargar quizzes activos:', error);
      }
    };

    fetchActiveQuizzes();
  }, [teacherId]);

  // Función para activar/desactivar quiz para estudiantes
  const toggleQuizForStudents = async (quiz) => {
    try {
      const newStatus = !quiz.isActiveForStudents;
      
      await api.post('/teacher/quizzes/activate-for-students', {
        quizId: quiz.id,
        gradeId: quiz.gradeId,
        teacherId: teacherId,
        isActiveForStudents: newStatus
      });
      
      // Actualizar el estado local
      const updatedQuizzes = activeQuizzes.map(q => {
        if (q.id === quiz.id && q.gradeId === quiz.gradeId) {
          return { ...q, isActiveForStudents: newStatus };
        }
        return q;
      });
      
      setActiveQuizzes(updatedQuizzes);
      
      const actionText = newStatus ? 'activado' : 'desactivado';
      showNotification('success', `Quiz ${actionText} para estudiantes correctamente`);
      
    } catch (error) {
      console.error('Error al activar/desactivar quiz para estudiantes:', error);
      showNotification('error', 'Error al cambiar el estado del quiz para estudiantes');
    }
  };

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

  // Función mejorada para agregar un nuevo estudiante
  const addStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      showNotification('error', 'El nombre del estudiante es requerido');
      return;
    }

    setLoading(true);
    try {
      console.log('Agregando estudiante:', {
        name: newStudent.name,
        grade_id: selectedGroup.gradeId
      });

      // Verificar que tenemos token antes de hacer la request
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        onLogout();
        return;
      }

      const response = await api.post('/admin/students', {
        name: newStudent.name,
        grade_id: selectedGroup.gradeId
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (response.data.user) {
        // Mostrar las credenciales del nuevo estudiante
        setStudentCredentials(response.data.user);
        setShowCredentials(true);
        showNotification('success', 'Estudiante y usuario creados correctamente');
      } else {
        console.warn('Respuesta sin credenciales, intentando obtenerlas...');
        // Si no vienen las credenciales, intentar obtenerlas del estudiante creado
        if (response.data.student?.id) {
          await getStudentCredentials(response.data.student.id, response.data.student.name);
        }
        showNotification('success', 'Estudiante creado correctamente');
      }
      
      setNewStudent({ name: '', grade_id: '' });
      
      // Recargar la lista de estudiantes
      fetchStudents(selectedGroup.gradeId);
      setShowAddStudentForm(false);
      
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      
      // Manejo mejorado de errores
      if (error.response?.status === 401 || error.response?.status === 403) {
        showNotification('error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        onLogout();
      } else if (error.response?.data?.details) {
        showNotification('error', `Error: ${error.response.data.details}`);
      } else if (error.response?.data?.error) {
        showNotification('error', error.response.data.error);
      } else {
        showNotification('error', 'Error al agregar el estudiante');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función mejorada para obtener credenciales de un estudiante
  const getStudentCredentials = async (studentId, studentName) => {
    setLoading(true);
    try {
      console.log('Obteniendo credenciales para estudiante:', { studentId, studentName });
      
      // Verificar token antes de hacer la request
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        onLogout();
        return;
      }

      console.log('Token disponible:', token.substring(0, 20) + '...');
      
      const response = await api.get(`/admin/students/credentials/${studentId}`);
      
      console.log('Respuesta de credenciales:', response.data);
      
      // Si las credenciales se crearon ahora, mostrar mensaje especial
      if (response.data.created_now) {
        showNotification('success', 'Credenciales generadas automáticamente para el estudiante');
      }
      
      setStudentCredentials(response.data);
      setShowCredentials(true);
      
      // Recargar la lista de estudiantes para mostrar el username actualizado
      if (response.data.created_now) {
        fetchStudents(selectedGroup.gradeId);
      }
      
    } catch (error) {
      console.error('Error al obtener credenciales:', error);
      console.log('Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Manejo mejorado de errores
      if (error.response?.status === 401) {
        showNotification('error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        onLogout();
      } else if (error.response?.status === 403) {
        showNotification('error', 'Token inválido. Por favor, inicia sesión de nuevo.');
        onLogout();
      } else if (error.response?.status === 404) {
        showNotification('error', 'Estudiante no encontrado');
      } else if (error.response?.data?.details) {
        showNotification('error', `Error: ${error.response.data.details}`);
      } else {
        showNotification('error', 'Error al obtener las credenciales del estudiante');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar y renovar token si es necesario
  const checkTokenValidity = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token disponible');
      return false;
    }

    try {
      // Decodificar el token para verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        console.log('Token expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
        return false;
      }
      
      // Si el token expira en menos de 5 minutos, mostrar advertencia
      if (payload.exp - currentTime < 300) { // 5 minutos
        showNotification('warning', 'Tu sesión expirará pronto. Guarda tu trabajo.');
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar token:', error);
      localStorage.removeItem('token');
      onLogout();
      return false;
    }
  };

  // useEffect para verificar token periódicamente
  useEffect(() => {
    // Verificar token al cargar el componente
    if (!checkTokenValidity()) {
      return;
    }

    // Verificar token cada 30 segundos
    const tokenCheckInterval = setInterval(() => {
      checkTokenValidity();
    }, 30000);

    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Función de logout mejorada
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  // Función para cerrar el modal de credenciales
  const closeCredentialsModal = () => {
    setShowCredentials(false);
    setStudentCredentials(null);
  };

  // Función para eliminar un estudiante
  const deleteStudent = async (studentId) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/students/${studentId}`);
      showNotification('success', 'Estudiante eliminado correctamente');
      fetchStudents(selectedGroup.gradeId);
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
    localStorage.setItem('currentQuiz', JSON.stringify({
      quizId: quizData.id,
      gradeId: quizData.gradeId,
      subjectId: quizData.subjectId
    }));
    
    navigate(`/docente/quiz/${quizData.id}`);
  };

  // Obtener quizzes activos para una materia específica
  const getActiveQuizzesForSubject = (subjectId) => {
    return activeQuizzes.filter(quiz => quiz.subjectId === subjectId);
  };

  // Modal de credenciales actualizado con mejor UX
  const CredentialsModal = () => {
    if (!showCredentials || !studentCredentials) return null;

    return (
      <div className="credentials-modal-overlay">
        <div className="credentials-modal">
          <div className="credentials-header">
            <h3>
              {studentCredentials.created_now ? 
                '¡Credenciales generadas!' : 
                'Credenciales del estudiante'
              }
            </h3>
            <button className="modal-close-btn" onClick={closeCredentialsModal}>×</button>
          </div>
          <div className="credentials-content">
            {studentCredentials.created_now ? (
              <p>Se han generado nuevas credenciales para este estudiante:</p>
            ) : (
              <p>Credenciales de acceso del estudiante:</p>
            )}
            
            <div className="credentials-info">
              <div className="credential-item">
                <label>Usuario:</label>
                <span className="credential-value">{studentCredentials.username}</span>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(studentCredentials.username);
                    showNotification('success', 'Usuario copiado al portapapeles');
                  }}
                  title="Copiar usuario"
                >
                  📋
                </button>
              </div>
              <div className="credential-item">
                <label>Contraseña:</label>
                <span className="credential-value">{studentCredentials.password}</span>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(studentCredentials.password);
                    showNotification('success', 'Contraseña copiada al portapapeles');
                  }}
                  title="Copiar contraseña"
                >
                  📋
                </button>
              </div>
              <div className="credential-item">
                <label>Tipo de usuario:</label>
                <span className="credential-value">{studentCredentials.user_type}</span>
              </div>
            </div>
            
            <div className="credentials-note">
              <p><strong>Importante:</strong> Comparte estas credenciales con el estudiante para que pueda acceder al sistema. Se recomienda que el estudiante cambie la contraseña en su primer acceso.</p>
              {studentCredentials.created_now && (
                <p><strong>Nota:</strong> Estas credenciales se han creado automáticamente y ya están guardadas en el sistema.</p>
              )}
            </div>
            
            <div className="credentials-actions">
              <button 
                className="btn btn-primary" 
                onClick={closeCredentialsModal}
              >
                Entendido
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  const text = `Usuario: ${studentCredentials.username}\nContraseña: ${studentCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  showNotification('success', 'Todas las credenciales copiadas');
                }}
              >
                Copiar Todo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tabla de estudiantes actualizada con mejor manejo de estados
  const StudentsTable = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando estudiantes...</p>
        </div>
      );
    }

    return (
      <div className="student-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Username</th>
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
                  <td>{student.username || <em>Sin usuario</em>}</td>
                  <td>{student.tasks_done || 0}</td>
                  <td>{student.average_grade || '0.00'}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => getStudentCredentials(student.id, student.name)}
                      className="btn btn-info btn-sm"
                      disabled={loading}
                      title={student.username ? "Ver credenciales" : "Generar credenciales"}
                    >
                      {student.username ? "Ver Credenciales" : "Generar Credenciales"}
                    </button>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="btn btn-danger btn-sm"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-message">
                  No hay estudiantes registrados en este grupo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderiza el contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="welcome-section">
              <h2>Bienvenido, {user?.name || 'Docente'}</h2>
              <p className="date-display">Viernes, 30 de mayo de 2025</p>
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
                                <div className="quiz-list-icon" style={{ backgroundColor: quiz.color }}>
                                  {quiz.icon}
                                </div>
                                <div className="quiz-list-info">
                                  <span className="quiz-list-title">{quiz.title}</span>
                                  <span className="quiz-list-detail">
                                    {quiz.questions} preguntas | {quiz.time} seg
                                  </span>
                                  <span className="quiz-status">
                                    {quiz.isActiveForStudents 
                                      ? '✅ Activo para estudiantes' 
                                      : '⚪ Inactivo para estudiantes'
                                    }
                                  </span>
                                </div>
                                <div className="quiz-actions">
                                  <button 
                                    className="btn-sm quiz-action-btn"
                                    onClick={() => handleStartQuiz(quiz)}
                                    style={{ backgroundColor: '#3498db' }}
                                  >
                                    Probar
                                  </button>
                                  <button 
                                    className={`btn-sm quiz-action-btn ${
                                      quiz.isActiveForStudents ? 'btn-deactivate' : 'btn-activate'
                                    }`}
                                    onClick={() => toggleQuizForStudents(quiz)}
                                  >
                                    {quiz.isActiveForStudents ? 'Desactivar' : 'Activar'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-quizzes-message">
                            <span>No hay quizzes disponibles</span>
                            <small>El administrador debe activar quizzes para este grado</small>
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
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          Guardar
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => setShowAddStudentForm(false)}
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <CredentialsModal />
                <StudentsTable />
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
          <button onClick={handleLogout} className="logout-btn">
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
              {notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' : '✕'}
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