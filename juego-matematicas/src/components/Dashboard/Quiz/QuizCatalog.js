// components/Dashboard/Quiz/QuizCatalog.js - Añadir función de activación
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Quiz.css';

function QuizCatalog() {
  const navigate = useNavigate();
  const { gradeId } = useParams();
  const [gradeInfo, setGradeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Array de quizzes disponibles
  const availableQuizzes = [
    {
      id: 'espanol',
      title: 'Quiz de Español',
      icon: '📚',
      color: '#3498db',
      description: 'Evalúa conocimientos de gramática, ortografía y comprensión del idioma español.',
      difficulty: 'Básico',
      questions: 10,
      time: 60,
      topics: ['Sustantivos', 'Adjetivos', 'Verbos', 'Ortografía'],
      isActive: false
    },
    {
      id: 'matematicas',
      title: 'Quiz de Matemáticas',
      icon: '🔢',
      color: '#e74c3c',
      description: 'Evalúa conceptos básicos de aritmética, geometría y problemas matemáticos.',
      difficulty: 'Básico',
      questions: 10,
      time: 60,
      topics: ['Aritmética', 'Geometría', 'Problemas'],
      comingSoon: true
    },
    {
      id: 'ciencias',
      title: 'Quiz de Ciencias Naturales',
      icon: '🧪',
      color: '#27ae60',
      description: 'Evalúa conocimientos sobre biología, física y química básica.',
      difficulty: 'Intermedio',
      questions: 12,
      time: 75,
      topics: ['Biología', 'Física', 'Química'],
      comingSoon: true
    },
    {
      id: 'historia',
      title: 'Quiz de Historia',
      icon: '🏛️',
      color: '#f39c12',
      description: 'Evalúa conocimientos sobre eventos históricos importantes.',
      difficulty: 'Intermedio',
      questions: 15,
      time: 90,
      topics: ['Historia Nacional', 'Historia Mundial', 'Fechas importantes'],
      comingSoon: true
    }
  ];

  // Estado para los quizzes y su estado de activación
  const [quizzes, setQuizzes] = useState(availableQuizzes);

  // Mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Obtener información del grado seleccionado
  useEffect(() => {
    const fetchGradeInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/grades/${gradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener información del grado');
        }
        
        const data = await response.json();
        setGradeInfo(data);
        
        // Cargar estado de activación de quizzes
        fetchQuizActivationStatus();
      } catch (error) {
        console.error('Error al obtener información del grado:', error);
        setLoading(false);
      }
    };

    // Obtener estado de activación de quizzes
    const fetchQuizActivationStatus = async () => {
      try {
        // Idealmente, esto vendría de una llamada API
        // Por ahora, simulamos con datos locales
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener estado de activación:', error);
        setLoading(false);
      }
    };

    if (gradeId) {
      fetchGradeInfo();
    }
  }, [gradeId]);

  // Función para activar/desactivar un quiz
  const toggleQuizActivation = async (quizId) => {
    try {
      const updatedQuizzes = quizzes.map(quiz => {
        if (quiz.id === quizId) {
          // Simulando la respuesta del servidor
          const newStatus = !quiz.isActive;
          
          // En un caso real, aquí harías una llamada a la API
          // await fetch(`http://localhost:5000/api/admin/quizzes/${quizId}/activate`, {...})
          
          return { ...quiz, isActive: newStatus };
        }
        return quiz;
      });
      
      setQuizzes(updatedQuizzes);
      
      const targetQuiz = updatedQuizzes.find(q => q.id === quizId);
      const actionText = targetQuiz.isActive ? 'activado' : 'desactivado';
      showNotification('success', `Quiz de ${targetQuiz.title} ${actionText} correctamente`);
      
    } catch (error) {
      console.error('Error al cambiar estado del quiz:', error);
      showNotification('error', 'Error al cambiar el estado del quiz');
    }
  };

  const navigateToQuizPreview = (quizId) => {
    if (!quizzes.find(q => q.id === quizId).comingSoon) {
      navigate(`/admin/contenido/quiz/${gradeId}/${quizId}`);
    } else {
      // Para futuros quizzes
      alert('¡Este quiz estará disponible próximamente!');
    }
  };

  const backToGrades = () => {
    navigate('/admin/contenido');
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
            {quizzes.map(quiz => (
              <div 
                key={quiz.id}
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
                    <span className="quiz-detail"><i className="detail-mini-icon">⏱️</i> {quiz.time} seg</span>
                    <span className="quiz-detail"><i className="detail-mini-icon">❓</i> {quiz.questions} preguntas</span>
                    <span className="quiz-detail"><i className="detail-mini-icon">📊</i> {quiz.difficulty}</span>
                  </div>
                  <div className="quiz-item-topics">
                    {quiz.topics.slice(0, 3).map((topic, index) => (
                      <span key={index} className="quiz-topic-tag">{topic}</span>
                    ))}
                    {quiz.topics.length > 3 && (
                      <span className="quiz-topic-tag">+{quiz.topics.length - 3}</span>
                    )}
                  </div>
                  <div className="quiz-item-actions">
                    <button 
                      className="btn btn-view"
                      onClick={() => !quiz.comingSoon && navigateToQuizPreview(quiz.id)}
                      disabled={quiz.comingSoon}
                    >
                      Ver Detalles
                    </button>
                    {!quiz.comingSoon && (
                      <button 
                        className={`btn ${quiz.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => toggleQuizActivation(quiz.id)}
                      >
                        {quiz.isActive ? 'Desactivar' : 'Activar'} Quiz
                      </button>
                    )}
                  </div>
                </div>
                {quiz.comingSoon && (
                  <div className="coming-soon-overlay">
                    <span>Próximamente</span>
                  </div>
                )}
                {quiz.isActive && !quiz.comingSoon && (
                  <div className="active-badge">
                    <span>Activo</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizCatalog;