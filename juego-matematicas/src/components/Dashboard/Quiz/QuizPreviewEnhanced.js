// components/Dashboard/Quiz/QuizPreviewEnhanced.js - Versión temporal simple
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Quiz.css';

function QuizPreviewEnhanced() {
  const navigate = useNavigate();
  const { gradeId, quizId } = useParams();
  const [gradeInfo, setGradeInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener información del grado
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
        
      } catch (error) {
        console.error('Error al obtener información del grado:', error);
      } finally {
        setLoading(false);
      }
    };

    if (gradeId) {
      fetchGradeInfo();
    }
  }, [gradeId]);

  const startQuiz = () => {
    navigate(`/admin/contenido/quiz/${gradeId}/${quizId}/play`);
  };

  const backToQuizzes = () => {
    navigate(`/admin/contenido/quiz/${gradeId}`);
  };

  if (loading) {
    return (
      <div className="quiz-module quiz-preview-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del quiz...</p>
      </div>
    );
  }

  return (
    <div className="quiz-module quiz-preview-container">
      <div className="quiz-preview-header">
        <button onClick={backToQuizzes} className="back-button">
          ← Volver a Quizzes
        </button>
        <h1 className="quiz-preview-title">
          Quiz de Español - {gradeInfo ? `${gradeInfo.name} ${gradeInfo.level}` : 'Cargando...'}
        </h1>
      </div>

      <div className="quiz-preview-content">
        <div className="quiz-card">
          <div className="quiz-card-header">
            <h2>Quiz de Español</h2>
            <p className="quiz-description">
              Evaluación de conocimientos básicos de español para alumnos de primaria.
              Incluye preguntas sobre gramática, ortografía y comprensión.
            </p>
          </div>
          
          <div className="quiz-details">
            <div className="quiz-detail-item">
              <div className="detail-icon">🕒</div>
              <div className="detail-info">
                <span className="detail-label">Tiempo</span>
                <span className="detail-value">60 segundos</span>
              </div>
            </div>
            <div className="quiz-detail-item">
              <div className="detail-icon">❓</div>
              <div className="detail-info">
                <span className="detail-label">Preguntas</span>
                <span className="detail-value">10 preguntas</span>
              </div>
            </div>
            <div className="quiz-detail-item">
              <div className="detail-icon">⭐</div>
              <div className="detail-info">
                <span className="detail-label">Dificultad</span>
                <span className="detail-value">Básico</span>
              </div>
            </div>
          </div>
          
          <button 
            className="start-quiz-button"
            onClick={startQuiz}
          >
            Iniciar Quiz
          </button>
        </div>
        
        <div className="quiz-instructions">
          <h3>Instrucciones</h3>
          <ul>
            <li>Tienes <strong>60 segundos</strong> para completar el quiz.</li>
            <li>El quiz consta de <strong>10 preguntas</strong> de selección múltiple.</li>
            <li>Cada respuesta correcta otorga <strong>10 puntos</strong> (puntuación máxima: 100).</li>
            <li>Las preguntas aparecen en orden aleatorio en cada intento.</li>
            <li>Las opciones de respuesta también se mezclan para cada pregunta.</li>
            <li>Al finalizar, podrás ver tu puntuación y compararla con otros resultados.</li>
          </ul>
          
          <div className="quiz-topics">
            <h3>Temas Incluidos</h3>
            <div className="topic-tags">
              <span className="topic-tag">Sustantivos</span>
              <span className="topic-tag">Adjetivos</span>
              <span className="topic-tag">Verbos</span>
              <span className="topic-tag">Ortografía</span>
              <span className="topic-tag">Sinónimos</span>
              <span className="topic-tag">Antónimos</span>
              <span className="topic-tag">Puntuación</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPreviewEnhanced;