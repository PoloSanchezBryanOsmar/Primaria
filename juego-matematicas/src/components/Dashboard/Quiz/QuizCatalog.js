// components/Dashboard/Quiz/QuizCatalog.js - Versión completa con API
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';

function QuizCatalog() {
  const navigate = useNavigate();
  const { gradeId } = useParams();
  const [gradeInfo, setGradeInfo] = useState(null);
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
        
        // Obtener quizzes con su estado de activación
        try {
          const quizzesResponse = await api.get(`/admin/quizzes/grade/${gradeId}`);
          setQuizzes(quizzesResponse.data);
        } catch (quizError) {
          // Si falla la carga desde la API, usar datos predeterminados
          console.warn('No se pudieron cargar quizzes desde la API, usando datos predeterminados:', quizError);
          setQuizzes([
            {
              quiz_id: 'espanol',
              title: 'Quiz de Español',
              icon: '📚',
              color: '#3498db',
              description: 'Evalúa conocimientos de gramática, ortografía y comprensión del idioma español.',
              difficulty: 'Básico',
              questions: 10,
              time: 60,
              subject_id: 1,
              is_active: 0,
              topics: ['Sustantivos', 'Adjetivos', 'Verbos', 'Ortografía']
            },
            {
              quiz_id: 'matematicas',
              title: 'Quiz de Matemáticas',
              icon: '🔢',
              color: '#e74c3c',
              description: 'Evalúa conceptos básicos de aritmética, geometría y problemas matemáticos.',
              difficulty: 'Básico',
              questions: 10,
              time: 60,
              subject_id: 2,
              is_active: 0,
              comingSoon: true,
              topics: ['Aritmética', 'Geometría', 'Problemas']
            },
            {
              quiz_id: 'ciencias',
              title: 'Quiz de Ciencias Naturales',
              icon: '🧪',
              color: '#27ae60',
              description: 'Evalúa conocimientos sobre biología, física y química básica.',
              difficulty: 'Intermedio',
              questions: 12,
              time: 75,
              subject_id: 5,
              is_active: 0,
              comingSoon: true,
              topics: ['Biología', 'Física', 'Química']
            },
            {
              quiz_id: 'historia',
              title: 'Quiz de Historia',
              icon: '🏛️',
              color: '#f39c12',
              description: 'Evalúa conocimientos sobre eventos históricos importantes.',
              difficulty: 'Intermedio',
              questions: 15,
              time: 90,
              subject_id: 4,
              is_active: 0,
              comingSoon: true,
              topics: ['Historia Nacional', 'Historia Mundial', 'Fechas importantes']
            }
          ]);
        }
        
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
  }, [gradeId]);

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
        // Si falla la API, solo actualizar localmente
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
      showNotification('success', `Quiz de ${targetQuiz.title} ${actionText} correctamente`);
      
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
      alert('¡Este quiz estará disponible próximamente!');
    }
  };

  const backToGrades = () => {
    navigate('/admin/contenido');
  };

  // Función para obtener los temas de un quiz
  const getQuizTopics = (quiz) => {
    // Si tiene temas definidos, los usa, sino usa valores por defecto
    if (quiz.topics && Array.isArray(quiz.topics)) {
      return quiz.topics;
    }
    
    // Temas por defecto según el tipo de quiz
    switch (quiz.quiz_id) {
      case 'espanol':
        return ['Sustantivos', 'Adjetivos', 'Verbos', 'Ortografía'];
      case 'matematicas':
        return ['Aritmética', 'Geometría', 'Problemas'];
      case 'ciencias':
        return ['Biología', 'Física', 'Química'];
      case 'historia':
        return ['Historia Nacional', 'Historia Mundial', 'Fechas importantes'];
      default:
        return ['Tema 1', 'Tema 2', 'Tema 3'];
    }
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
            {notification.type === 'success' ? '✓' : '✕'}
          </span>
          {notification.message}
        </div>
      )}

      <div className="quiz-catalog-content">
        <div className="quiz-catalog-description">
          <p>Selecciona un quiz para ver sus detalles o actívalo para que esté disponible para los docentes de este grado.</p>
        </div>
        
        <div className="quiz-container-centered">
          <div className="quiz-grid">
            {quizzes.map(quiz => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizCatalog;