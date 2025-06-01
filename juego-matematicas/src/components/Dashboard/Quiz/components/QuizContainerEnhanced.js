// components/Dashboard/Quiz/components/QuizContainerEnhanced.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Question from './Question';
import Timer from './Timer';
import { QuizGenerator } from '../QuizGenerator';

function QuizContainerEnhanced({ playerName, onGameEnd }) {
  const { quizId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answered, setAnswered] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  
  // Estados para el quiz generado dinámicamente
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    generateQuiz();
  }, [quizId]);

  // Generar el quiz usando el QuizGenerator
  const generateQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que el quiz puede ser generado
      const validation = QuizGenerator.validateQuizGeneration(quizId);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generar el quiz
      const generatedQuiz = QuizGenerator.generateQuizFromTemplate(quizId);
      
      if (!generatedQuiz.questions || generatedQuiz.questions.length === 0) {
        throw new Error('No se pudieron generar preguntas para este quiz');
      }

      setQuizData(generatedQuiz.quizInfo);
      setQuestions(generatedQuiz.questions);
      setTimeLeft(generatedQuiz.quizInfo.time || 60);
      
      console.log(`Quiz generado: ${generatedQuiz.quizInfo.title}`);
      console.log(`Preguntas cargadas: ${generatedQuiz.questions.length}`);
      
    } catch (error) {
      console.error('Error generando quiz:', error);
      setError(error.message);
      
      // Fallback: usar preguntas por defecto si falla
      const fallbackQuestions = [
        {
          id: 'fallback_1',
          question: "¿Cuál de las siguientes palabras es un sustantivo?",
          options: ["Correr", "Mesa", "Rápido", "Saltando"],
          correctAnswer: "Mesa"
        },
        {
          id: 'fallback_2',
          question: "¿Cuál es el sinónimo de 'alegre'?",
          options: ["Triste", "Enojado", "Contento", "Aburrido"],
          correctAnswer: "Contento"
        }
      ];
      
      setQuestions(fallbackQuestions);
      setQuizData({
        title: 'Quiz de Español (Modo Básico)',
        questions: fallbackQuestions.length,
        time: 60
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && gameInProgress) {
      endGame();
      return;
    }

    const timer = setTimeout(() => {
      if (gameInProgress) {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameInProgress]);

  const endGame = () => {
    setGameInProgress(false);
    onGameEnd(score, correctAnswers, totalAnswered);
  };

  const handleAnswer = (selectedOption) => {
    if (!gameInProgress || answered || questions.length === 0) return;
    
    setAnswered(true);
    setTotalAnswered(totalAnswered + 1);
    
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 10);
      setCorrectAnswers(correctAnswers + 1);
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    
    setTimeout(() => {
      setAnswered(false);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        endGame();
      }
    }, 1500);
  };
  
  const playCorrectSound = () => {
    console.log("¡Respuesta correcta!");
  };
  
  const playIncorrectSound = () => {
    console.log("Respuesta incorrecta");
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="loading-spinner"></div>
          <p>Generando quiz personalizado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <h3>Error al cargar el quiz</h3>
          <p>{error}</p>
          <p>Usando modo básico...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <h3>No hay preguntas disponibles</h3>
          <p>Por favor, intenta con otro quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="player-info">
          <span>Jugador: {playerName}</span>
          <span>Puntuación: {score}/{(quizData?.questions || questions.length) * 10}</span>
          <span>Pregunta: {currentQuestionIndex + 1}/{questions.length}</span>
        </div>
        <Timer timeLeft={timeLeft} />
      </div>
      
      <div className="quiz-info">
        <h2 className="quiz-title">{quizData?.title || 'Quiz de Español'}</h2>
        {quizData?.topics && (
          <div className="quiz-topics-display">
            <span>Temas: {quizData.topics.join(', ')}</span>
          </div>
        )}
      </div>
      
      {gameInProgress ? (
        <Question 
          question={questions[currentQuestionIndex]} 
          onAnswer={handleAnswer}
          answered={answered}
        />
      ) : (
        <div className="game-over">
          <h2>¡Tiempo agotado!</h2>
        </div>
      )}
    </div>
  );
}

export default QuizContainerEnhanced;