// components/EstudianteDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EstudianteDashboard.css';

function EstudianteDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Cargar información del estudiante y sus quizzes activos
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (user && user.username) {
          // Obtener información del estudiante con su grado
          const studentResponse = await api.get(`/student/info/${user.username}`);
          const studentData = studentResponse.data;
          setStudentInfo(studentData);
          
          console.log('Información del estudiante:', studentData);
          
          if (studentData.grade_id) {
            setLoadingQuizzes(true);
            
            // Debug: verificar activaciones
            try {
              const debugResponse = await api.get(`/debug/activations/${studentData.grade_id}`);
              console.log('Debug activaciones:', debugResponse.data);
            } catch (debugError) {
              console.log('Error en debug (normal si la ruta no existe):', debugError);
            }
            
            // Obtener quizzes activos para este grado
            const quizzesResponse = await api.get(`/student/quizzes/active/${studentData.grade_id}`);
            console.log('Quizzes activos obtenidos:', quizzesResponse.data);
            setActiveQuizzes(quizzesResponse.data);
            setLoadingQuizzes(false);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del estudiante:', error);
        setLoadingQuizzes(false);
        showNotification('error', 'Error al cargar datos del estudiante');
      }
    };

    fetchStudentData();
  }, [user]);

  // Función para iniciar un quiz
  const startQuiz = (quiz) => {
    console.log('Iniciando quiz:', quiz);
    // Aquí puedes navegar al quiz
    navigate(`/estudiante/quiz/${quiz.quiz_id}/play`);
  };

  // Función de logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  // Renderiza el contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="estudiante-dashboard-content">
            <div className="welcome-section">
              <h2>Bienvenido, {user?.name || 'Estudiante'}</h2>
              <p className="date-display">Sábado, 31 de mayo de 2025</p>
            </div>
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Quizzes Completados</h3>
                <div className="card-value">0</div>
              </div>
              <div className="summary-card">
                <h3>Promedio General</h3>
                <div className="card-value">0.0</div>
              </div>
              <div className="summary-card">
                <h3>Tareas Pendientes</h3>
                <div className="card-value">0</div>
              </div>
            </div>
          </div>
        );

        case 'quizzes':
            return (
              <div className="estudiante-quizzes-content">
                <h2>Mis Quizzes</h2>
                
                {studentInfo && (
                  <div className="student-grade-info">
                    <p>Grado: {studentInfo.grade_name} - {studentInfo.grade_level}</p>
                  </div>
                )}
                
                {loadingQuizzes ? (
                  <div className="loading-quizzes">
                    <div className="loading-spinner"></div>
                    <p>Cargando quizzes disponibles...</p>
                  </div>
                ) : (
                  <>
                    {activeQuizzes.length > 0 ? (
                      <div className="quizzes-grid">
                        {activeQuizzes.map(quiz => (
                          <div key={quiz.quiz_id} className="quiz-card-student">
                            <div className="quiz-card-header">
                              <span className="quiz-icon" style={{ backgroundColor: quiz.color }}>
                                {quiz.icon}
                              </span>
                              <h3>{quiz.title}</h3>
                            </div>
                            
                            <p className="quiz-description">{quiz.description}</p>
                            
                            <div className="quiz-details-student">
                              <div className="quiz-detail">
                                <span className="detail-icon">⏱️</span>
                                <span>{quiz.time} segundos</span>
                              </div>
                              <div className="quiz-detail">
                                <span className="detail-icon">❓</span>
                                <span>{quiz.questions} preguntas</span>
                              </div>
                              <div className="quiz-detail">
                                <span className="detail-icon">📊</span>
                                <span>{quiz.difficulty}</span>
                              </div>
                            </div>
                            
                            <div className="quiz-teacher-info">
                              <small>Activado por: {quiz.teacher_name}</small>
                            </div>
                            
                            <button 
                              className="start-quiz-btn"
                              onClick={() => startQuiz(quiz)}
                            >
                              Iniciar Quiz
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-quizzes-student">
                        <div className="no-quizzes-icon">📚</div>
                        <h3>No hay quizzes activos</h3>
                        <p>Tu profesor activará quizzes cuando estén disponibles.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );

      default:
        return <div>Selecciona una opción del menú</div>;
    }
  };

  return (
    <div className="estudiante-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'E'}
          </div>
          <div className="user-info">
            <h3>{user?.name || 'Estudiante'}</h3>
            <p>{user?.role || 'Estudiante'}</p>
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
            <li className={activeSection === 'quizzes' ? 'active' : ''}>
              <button onClick={() => setActiveSection('quizzes')}>
                <span className="nav-icon">📝</span>
                <span className="nav-text">Mis Quizzes</span>
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
}

export default EstudianteDashboard;