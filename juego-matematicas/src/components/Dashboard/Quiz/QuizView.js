// components/Dashboard/Quiz/QuizView.js - corregido
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
//import QuizContainer from './components/QuizContainer';
import QuizContainerEnhanced from './components/QuizContainerEnhanced';
import ResultScreen from './components/ResultScreen';
import './Quiz.css';

function QuizView() {
  const navigate = useNavigate();
  const { gradeId } = useParams();
  const [gameState, setGameState] = useState('welcome'); // welcome, playing, result
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [gradeInfo, setGradeInfo] = useState(null);

  console.log("QuizView renderizado con gradeId:", gradeId);

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
        console.log("Información del grado obtenida:", data);
        setGradeInfo(data);
      } catch (error) {
        console.error('Error al obtener información del grado:', error);
      }
    };

    if (gradeId) {
      fetchGradeInfo();
    }
  }, [gradeId]);

  const startGame = (name) => {
    setPlayerName(name);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setGameState('playing');
  };

  const endGame = (finalScore, correct, total) => {
    setScore(finalScore);
    setCorrectAnswers(correct);
    setTotalAnswered(total);
    setGameState('result');
    // Guardar puntaje en la base de datos
    saveScore(playerName, finalScore, correct, total, gradeId);
  };

  const playAgain = () => {
    setGameState('welcome');
  };

  const backToGrades = () => {
    navigate(`/admin/contenido/quiz/${gradeId}`);
  };

  const saveScore = async (name, score, correct, total, gradeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          score,
          correctAnswers: correct,
          totalAnswered: total,
          gradeId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar puntaje');
      }
      
      console.log('Puntaje guardado exitosamente');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="quiz-module quiz-view">
      <div className="quiz-header-bar">
        <button onClick={backToGrades} className="back-button">
          ← Volver a Quizzes
        </button>
        <h1 className="quiz-title">
          Quiz de Español - {gradeInfo ? `${gradeInfo.name} ${gradeInfo.level}` : 'Cargando...'}
        </h1>
      </div>

      <div className="quiz-content">
        {gameState === 'welcome' && (
          <WelcomeScreen onStart={startGame} />
        )}
        {gameState === 'playing' && (
          <QuizContainerEnhanced 
            playerName={playerName} 
            onGameEnd={endGame} 
          />
        )}
        {gameState === 'result' && (
          <ResultScreen 
            playerName={playerName} 
            score={score} 
            correctAnswers={correctAnswers}
            totalAnswered={totalAnswered}
            onPlayAgain={playAgain} 
          />
        )}
      </div>
    </div>
  );
}

export default QuizView;