// components/Dashboard/Quiz/components/ResultScreen.js
import React, { useState, useEffect } from 'react';

function ResultScreen({ playerName, score, correctAnswers, totalAnswered, onPlayAgain }) {
  const [topScores, setTopScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener los mejores puntajes del backend
    fetchTopScores();
  }, []);

  const fetchTopScores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/scores/top', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener puntajes');
      }
      
      const data = await response.json();
      setTopScores(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Calcular porcentaje de aciertos
  const percentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  
  // Determinar mensaje basado en el porcentaje
  let message = '';
  if (percentage >= 90) {
    message = '¡Excelente! ¡Eres un experto en español!';
  } else if (percentage >= 70) {
    message = '¡Muy bien! Tienes buenos conocimientos de español.';
  } else if (percentage >= 50) {
    message = 'Bien. Sigue practicando para mejorar.';
  } else {
    message = 'Necesitas practicar más. ¡No te rindas!';
  }

  return (
    <div className="result-screen">
      <h2>¡Juego terminado!</h2>
      
      <div className="player-result">
        <p>Jugador: <strong>{playerName}</strong></p>
        <p>Tu puntaje: <strong>{score}/100</strong></p>
        <div className="correct-answers">
          <p>Respuestas correctas: <strong>{correctAnswers}/{totalAnswered}</strong></p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${percentage}%`,
                backgroundColor: percentage >= 70 ? '#27ae60' : percentage >= 50 ? '#f39c12' : '#e74c3c'
              }}
            ></div>
          </div>
        </div>
        <p className="result-message">{message}</p>
      </div>
      
      <div className="top-scores">
        <h3>Mejores Puntajes</h3>
        {loading ? (
          <p>Cargando mejores puntajes...</p>
        ) : (
          <ul>
            {topScores.length > 0 ? (
              topScores.map((item, index) => (
                <li key={index}>
                  <span className="rank">{index + 1}</span>
                  <span className="score-name">{item.name}</span>
                  <span className="score-value">{item.score}/100</span>
                  {item.correctAnswers !== undefined && (
                    <span className="correct-count">{item.correctAnswers}/{item.totalAnswered || 10}</span>
                  )}
                </li>
              ))
            ) : (
              <p>No hay puntajes registrados aún.</p>
            )}
          </ul>
        )}
      </div>
      
      <button onClick={onPlayAgain} className="btn btn-play-again">
        Jugar de nuevo
      </button>
    </div>
  );
}

export default ResultScreen;