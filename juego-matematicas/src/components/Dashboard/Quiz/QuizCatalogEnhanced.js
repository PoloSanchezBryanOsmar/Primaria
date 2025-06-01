// components/Dashboard/Quiz/QuizCatalogEnhanced.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { obtenerQuizzesPorMateria, obtenerMateriasDisponibles } from '../../../data/quizTemplates';
import './Quiz.css';

function QuizCatalogEnhanced() {
  const navigate = useNavigate();
  const { gradeId } = useParams();
  const [gradeInfo, setGradeInfo] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState('español');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // API con token
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Obtener materias disponibles
  const materiasDisponibles = obtenerMateriasDisponibles();

  // Mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Cargar datos al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del grado
        const gradeResponse = await api.get(`/admin/grades/${gradeId}`);
        setGradeInfo(gradeResponse.data);
        
        // Cargar quizzes de la materia seleccionada
        loadQuizzesForSubject(selectedMateria);
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('error', 'Error al cargar los datos');
        setLoading(false);
      }
    };

    if (gradeId) {
      fetchData();
    }
  }, [gradeId, selectedMateria]);

  // Cargar quizzes para una materia específica
  const loadQuizzesForSubject = async (materia) => {
    try {
      // Obtener quizzes desde el template
      const quizzesFromTemplate = obtenerQuizzesPorMateria(materia);
      
      // Intentar obtener el estado de activación desde la API
      const quizzesWithStatus = [];
      
      for (const quiz of quizzesFromTemplate) {
        try {
          // Verificar si el quiz está activado en la base de datos
          const response = await api.get(`/admin/quizzes/status/${quiz.quiz_id}/${gradeId}`);
          quizzesWithStatus.push({
            ...quiz,
            is_active: response.data.is_active || 0
          });
        } catch (error) {
          // Si no existe en la BD, agregarlo como inactivo
          quizzesWithStatus.push({
            ...quiz,
            is_active: 0
          });
        }
      }
      
      setQuizzes(quizzesWithStatus);
    } catch (error) {
      console.error('Error al cargar quizzes:', error);
      // En caso de error, usar solo los templates
      const quizzesFromTemplate = obtenerQuizzesPorMateria(materia);
      const quizzesWithDefaultStatus = quizzesFromTemplate.map(quiz => ({
        ...quiz,
        is_active: 0
      }));
      setQuizzes(quizzesWithDefaultStatus);
    }
  };

  // Función para activar/desactivar un quiz
  const toggleQuizActivation = async (quizId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Intentar llamar a la API para cambiar el estado
      try {
        await api.post('/admin/quizzes/activate', {
          quizId: quizId,
          gradeId: gradeId,
          isActive: newStatus
        });
      } catch (apiError) {
        console.warn('Error en API, actualizando solo localmente:', apiError);
      }
      
      // Actualizar el estado local de los quizzes
      const updatedQuizzes = quizzes.map(quiz => {
        if (quiz.quiz_id === quizId) {
          return { ...quiz, is_active: newStatus ? 1 : 0 };
        }
        return quiz;
      });
      
      setQuizzes(updatedQuizzes);
      
      // Mostrar notificación
      const targetQuiz = updatedQuizzes.find(q => q.quiz_id === quizId);
      const actionText = newStatus ? 'activado' : 'desactivado';
      showNotification('success', `Quiz "${targetQuiz.title}" ${actionText} correctamente`);
      
    } catch (error) {
      console.error('Error al cambiar estado del quiz:', error);
      showNotification('error', 'Error al cambiar el estado del quiz');
    }
  };

  const navigateToQuizPreview = (quizId) => {
    const quiz = quizzes.find(q => q.quiz_id === quizId);
    if (!quiz?.comingSoon) {
      navigate(`/admin/contenido/quiz/${gradeId}/${quizId}`);
    } else {
      showNotification('info', '¡Este quiz estará disponible próximamente!');
    }
  };

  const backToGrades = () => {
    navigate('/admin/contenido');
  };

  // Función para obtener los temas de un quiz
  const getQuizTopics = (quiz) => {
    if (quiz.topics && Array.isArray(quiz.topics)) {
      return quiz.topics;
    }
    return ['Tema general'];
  };

  // Cambiar materia seleccionada
  const handleMateriaChange = (materia) => {
    setSelectedMateria(materia);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="quiz-module quiz-catalog-loading">
        <div className="loading-spinner"></div>
        <p>Cargando catálogo de quizzes...</p>
      </div>
    );
  }

  return (
    <div className="quiz-module quiz-catalog-container">
      <div className="quiz-catalog-header">
        <button onClick={backToGrades} className="back-button">
          ← Volver a Grados
        </button>
        <h1 className="quiz-catalog-title">
          Quizzes disponibles - {gradeInfo ? `${gradeInfo.name} ${gradeInfo.level}` : 'Cargando...'}
        </h1>
      </div>

      {notification && (
        <div className={`quiz-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Selector de Materias */}
      <div className="materia-selector">
        <h3>Selecciona una materia:</h3>
        <div className="materia-tabs">
          {materiasDisponibles.map(materia => (
            <button
              key={materia}
              className={`materia-tab ${selectedMateria === materia ? 'active' : ''}`}
              onClick={() => handleMateriaChange(materia)}
            >
              {materia.charAt(0).toUpperCase() + materia.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-catalog-content">
        <div className="quiz-catalog-description">
          <p>
            Quizzes de <strong>{selectedMateria}</strong>. Selecciona un quiz para ver sus detalles o actívalo para que esté disponible para los docentes de este grado.
          </p>
        </div>
        
        <div className="quiz-container-centered">
          <div className="quiz-grid">
            {quizzes.length > 0 ? (
              quizzes.map(quiz => {
                const topics = getQuizTopics(quiz);
                const isActive = parseInt(quiz.is_active) === 1;
                
                return (
                  <div 
                    key={quiz.quiz_id}
                    className={`quiz-item ${quiz.comingSoon ? 'coming-soon' : ''}`}
                    style={{ borderColor: quiz.color }}
                  >
                    <div className="quiz-item-icon" style={{ backgroundColor: quiz.color }}>
                      <span>{quiz.icon}</span>
                    </div>
                    <div className="quiz-item-content">
                      <h3 className="quiz-item-title">{quiz.title}</h3>
                      <p className="quiz-item-description">{quiz.description}</p>
                      <div className="quiz-item-details">
                        <span className="quiz-detail">
                          <i className="detail-mini-icon">⏱️</i> {quiz.time} seg
                        </span>
                        <span className="quiz-detail">
                          <i className="detail-mini-icon">❓</i> {quiz.questions} preguntas
                        </span>
                        <span className="quiz-detail">
                          <i className="detail-mini-icon">📊</i> {quiz.difficulty}
                        </span>
                      </div>
                      <div className="quiz-item-topics">
                        {topics.slice(0, 3).map((topic, index) => (
                          <span key={index} className="quiz-topic-tag">{topic}</span>
                        ))}
                        {topics.length > 3 && (
                          <span className="quiz-topic-tag">+{topics.length - 3}</span>
                        )}
                      </div>
                      <div className="quiz-item-actions">
                        <button 
                          className="btn btn-view"
                          onClick={() => !quiz.comingSoon && navigateToQuizPreview(quiz.quiz_id)}
                          disabled={quiz.comingSoon}
                        >
                          Ver Detalles
                        </button>
                        {!quiz.comingSoon && (
                          <button 
                            className={`btn ${isActive ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => toggleQuizActivation(quiz.quiz_id, isActive)}
                          >
                            {isActive ? 'Desactivar' : 'Activar'} Quiz
                          </button>
                        )}
                      </div>
                    </div>
                    {quiz.comingSoon && (
                      <div className="coming-soon-overlay">
                        <span>Próximamente</span>
                      </div>
                    )}
                    {isActive && !quiz.comingSoon && (
                      <div className="active-badge">
                        <span>Activo</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-quizzes-message">
                <p>No hay quizzes disponibles para la materia <strong>{selectedMateria}</strong>.</p>
                <p>Los quizzes se agregarán próximamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizCatalogEnhanced;