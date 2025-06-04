import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SubjectDetailView from './SubjectDetailView';
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
  // Estados para asignaciones
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  // Nuevos estados para vista detallada de materias
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectDetail, setShowSubjectDetail] = useState(false);

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
          const response = await api.get(`/teacher/quizzes/available/${teacherId}`);
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
      
      if (response.data.user) {
        setStudentCredentials(response.data.user);
        setShowCredentials(true);
        showNotification('success', 'Estudiante y usuario creados correctamente');
      } else {
        console.warn('Respuesta sin credenciales, intentando obtenerlas...');
        if (response.data.student?.id) {
          await getStudentCredentials(response.data.student.id, response.data.student.name);
        }
        showNotification('success', 'Estudiante creado correctamente');
      }
      
      setNewStudent({ name: '', grade_id: '' });
      fetchStudents(selectedGroup.gradeId);
      setShowAddStudentForm(false);
      
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      
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
      
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        onLogout();
        return;
      }

      console.log('Token disponible:', token.substring(0, 20) + '...');
      
      const response = await api.get(`/admin/students/credentials/${studentId}`);
      
      console.log('Respuesta de credenciales:', response.data);
      
      if (response.data.created_now) {
        showNotification('success', 'Credenciales generadas automáticamente para el estudiante');
      }
      
      setStudentCredentials(response.data);
      setShowCredentials(true);
      
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        console.log('Token expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
        return false;
      }
      
      if (payload.exp - currentTime < 300) {
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
    if (!checkTokenValidity()) {
      return;
    }

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

  // Modal para crear/editar asignación
  const AssignmentModal = ({ 
    isOpen, 
    onClose, 
    quiz, 
    teacherId, 
    onSave, 
    existingAssignment = null 
  }) => {
    const [formData, setFormData] = useState({
      assignmentTitle: '',
      assignmentDescription: '',
      customTimeLimit: '',
      startDate: '',
      endDate: ''
    });

    useEffect(() => {
      if (isOpen) {
        if (existingAssignment) {
          setFormData({
            assignmentTitle: existingAssignment.assignment_title || `Quiz de ${quiz.title}`,
            assignmentDescription: existingAssignment.assignment_description || '',
            customTimeLimit: existingAssignment.custom_time_limit || quiz.time || 60,
            startDate: existingAssignment.start_date ? 
              new Date(existingAssignment.start_date).toISOString().slice(0, 16) : '',
            endDate: existingAssignment.end_date ? 
              new Date(existingAssignment.end_date).toISOString().slice(0, 16) : ''
          });
        } else {
          const now = new Date();
          const nextWeek = new Date(now);
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          setFormData({
            assignmentTitle: `${quiz.title} - ${quiz.gradeName} ${quiz.gradeLevel}`,
            assignmentDescription: `Evaluación de ${quiz.title.toLowerCase()} para el grupo.`,
            customTimeLimit: quiz.time || 60,
            startDate: now.toISOString().slice(0, 16),
            endDate: nextWeek.toISOString().slice(0, 16)
          });
        }
      }
    }, [isOpen, quiz, existingAssignment]);

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!formData.assignmentTitle.trim()) {
        alert('El título de la asignación es requerido');
        return;
      }
      
      if (!formData.startDate || !formData.endDate) {
        alert('Las fechas de inicio y fin son requeridas');
        return;
      }
      
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
      
      if (formData.customTimeLimit < 30 || formData.customTimeLimit > 600) {
        alert('El tiempo límite debe estar entre 30 segundos y 10 minutos');
        return;
      }

      onSave(formData);
    };

    if (!isOpen) return null;

    return (
      <div className="credentials-modal-overlay">
        <div className="credentials-modal assignment-modal">
          <div className="credentials-header">
            <h3>{existingAssignment ? 'Editar Asignación' : 'Crear Nueva Asignación'}</h3>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="credentials-content">
            <div className="form-section">
              <h4>Información del Quiz</h4>
              <div className="quiz-info-display">
                <div className="quiz-info-item">
                  <span className="label">Quiz:</span>
                  <span className="value">{quiz.title}</span>
                </div>
                <div className="quiz-info-item">
                  <span className="label">Grado:</span>
                  <span className="value">{quiz.gradeName} - {quiz.gradeLevel}</span>
                </div>
                <div className="quiz-info-item">
                  <span className="label">Preguntas:</span>
                  <span className="value">{quiz.questions} preguntas</span>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="assignmentTitle">Título de la Asignación *</label>
                <input
                  type="text"
                  id="assignmentTitle"
                  value={formData.assignmentTitle}
                  onChange={(e) => setFormData({...formData, assignmentTitle: e.target.value})}
                  className="form-input"
                  placeholder="Ej: Quiz de Gramática - Semana 1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="assignmentDescription">Descripción</label>
                <textarea
                  id="assignmentDescription"
                  value={formData.assignmentDescription}
                  onChange={(e) => setFormData({...formData, assignmentDescription: e.target.value})}
                  className="form-input"
                  placeholder="Descripción opcional de la asignación..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customTimeLimit">Tiempo Límite (segundos) *</label>
                <input
                  type="number"
                  id="customTimeLimit"
                  value={formData.customTimeLimit}
                  onChange={(e) => setFormData({...formData, customTimeLimit: parseInt(e.target.value)})}
                  className="form-input"
                  min="30"
                  max="600"
                  step="5"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.8em' }}>
                  Tiempo original: {quiz.time} segundos (30-600 segundos permitidos)
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label htmlFor="startDate">Fecha y Hora de Inicio *</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate">Fecha y Hora de Fin *</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="credentials-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {existingAssignment ? 'Actualizar Asignación' : 'Crear Asignación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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

  // Cargar asignaciones
  const loadAssignments = async () => {
    if (!teacherId) return;
    
    try {
      const response = await api.get(`/teacher/assignments/${teacherId}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
    }
  };

  // useEffect para cargar asignaciones cuando tengamos teacherId
  useEffect(() => {
    loadAssignments();
  }, [teacherId]);

  // Abrir modal para crear asignación
  const openAssignmentModal = (quiz) => {
    setSelectedQuiz(quiz);
    setEditingAssignment(null);
    setModalOpen(true);
  };

  // Guardar asignación
  const saveAssignment = async (formData) => {
    try {
      const assignmentData = {
        quizId: selectedQuiz.id,
        gradeId: selectedQuiz.gradeId,
        teacherId: teacherId,
        assignmentTitle: formData.assignmentTitle,
        assignmentDescription: formData.assignmentDescription,
        customTimeLimit: formData.customTimeLimit,
        startDate: formData.startDate,
        endDate: formData.endDate
      };

      if (editingAssignment) {
        await api.put(`/teacher/assignments/${editingAssignment.id}`, assignmentData);
        showNotification('success', 'Asignación actualizada correctamente');
      } else {
        await api.post('/teacher/assignments', assignmentData);
        showNotification('success', 'Asignación creada correctamente');
      }

      setModalOpen(false);
      loadAssignments();
      
    } catch (error) {
      console.error('Error al guardar asignación:', error);
      showNotification('error', 'Error al guardar la asignación');
    }
  };

  // Obtener estado de la asignación
  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const start = new Date(assignment.start_date);
    const end = new Date(assignment.end_date);

    if (now < start) return 'programada';
    if (now >= start && now <= end) return 'activa';
    return 'finalizada';
  };

  // Renderizar estado de asignación
  const renderAssignmentStatus = (assignment) => {
    const status = getAssignmentStatus(assignment);
    const statusConfig = {
      programada: { label: 'Programada', class: 'status-scheduled', icon: '⏰' },
      activa: { label: 'Activa', class: 'status-active', icon: '✅' },
      finalizada: { label: 'Finalizada', class: 'status-finished', icon: '🏁' }
    };

    const config = statusConfig[status];
    return (
      <span className={`assignment-status ${config.class}`} style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.8em',
        fontWeight: '500',
        backgroundColor: status === 'activa' ? '#d4edda' : status === 'programada' ? '#fff3cd' : '#f8d7da',
        color: status === 'activa' ? '#155724' : status === 'programada' ? '#856404' : '#721c24'
      }}>
        {config.icon} {config.label}
      </span>
    );
  };

  // Función para abrir la vista detallada de una materia
  const openSubjectDetail = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectDetail(true);
  };

  // Función para volver a la vista de materias
  const backToSubjects = () => {
    setShowSubjectDetail(false);
    setSelectedSubject(null);
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
        // Si hay una materia seleccionada, mostrar la vista detallada
        if (showSubjectDetail && selectedSubject) {
          const subjectQuizzes = getActiveQuizzesForSubject(selectedSubject.id);
          return (
            <SubjectDetailView
              subject={selectedSubject}
              subjectQuizzes={subjectQuizzes}
              teacherId={teacherId}
              onBack={backToSubjects}
              showNotification={showNotification}
              handleStartQuiz={handleStartQuiz}
              api={api}
            />
          );
        }

        // Vista normal de materias (grid de materias)
        return (
          <div className="materias-content">
            <h2>Mis Materias</h2>
            <p>Selecciona una materia para gestionar sus quizzes y asignaciones.</p>
            
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
                      <div className="subject-stats">
                        <div className="stat-item">
                          <span className="stat-number">{subjectQuizzes.length}</span>
                          <span className="stat-label">Quiz{subjectQuizzes.length !== 1 ? 'zes' : ''} disponible{subjectQuizzes.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">
                            {subjectQuizzes.filter(q => q.isActiveForStudents).length}
                          </span>
                          <span className="stat-label">Activo{subjectQuizzes.filter(q => q.isActiveForStudents).length !== 1 ? 's' : ''} para estudiantes</span>
                        </div>
                      </div>

                      {hasQuizzes ? (
                        <div className="subject-preview">
                          <h4>Quizzes disponibles:</h4>
                          <div className="quiz-preview-list">
                            {subjectQuizzes.slice(0, 3).map(quiz => (
                              <div key={quiz.id} className="quiz-preview-item">
                                <span className="quiz-preview-icon" style={{ backgroundColor: quiz.color }}>
                                  {quiz.icon}
                                </span>
                                <div className="quiz-preview-info">
                                  <span className="quiz-preview-title">{quiz.title}</span>
                                  <span className="quiz-preview-detail">
                                    {quiz.questions} preguntas | {quiz.time}s
                                  </span>
                                </div>
                                <span className={`quiz-preview-status ${quiz.isActiveForStudents ? 'active' : 'inactive'}`}>
                                  {quiz.isActiveForStudents ? '✅' : '⚪'}
                                </span>
                              </div>
                            ))}
                            {subjectQuizzes.length > 3 && (
                              <div className="more-quizzes">
                                +{subjectQuizzes.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="no-quizzes-preview">
                          <span>No hay quizzes disponibles</span>
                          <small>El administrador debe activar quizzes para tus grados</small>
                        </div>
                      )}
                      
                      <div className="subject-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => openSubjectDetail(subject)}
                          disabled={!hasQuizzes}
                        >
                          {hasQuizzes ? 'Gestionar Materia' : 'Sin quizzes disponibles'}
                        </button>
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
      
      <div className="main-content">
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