// components/Dashboard/Quiz/components/QuizContainer.js
import React, { useState, useEffect } from 'react';
import Question from './Question';
import Timer from './Timer';

// Base de preguntas
const questions = [
  {
    id: 1,
    question: "¿Cuál de las siguientes palabras es un sustantivo?",
    options: ["Correr", "Mesa", "Rápido", "Saltando"],
    correctAnswer: "Mesa"
  },
  {
    id: 2,
    question: "¿Cuál es el sinónimo de 'alegre'?",
    options: ["Triste", "Enojado", "Contento", "Aburrido"],
    correctAnswer: "Contento"
  },
  {
    id: 3,
    question: "¿Cuál palabra está escrita correctamente?",
    options: ["Havía", "Había", "Abia", "Habia"],
    correctAnswer: "Había"
  },
  {
    id: 4,
    question: "Completa la oración: 'Juan _____ a la escuela todos los días'",
    options: ["va", "bas", "ban", "vamos"],
    correctAnswer: "va"
  },
  {
    id: 5,
    question: "¿Qué signo de puntuación se usa para hacer una pregunta?",
    options: [".", ",", "¿?", "!"],
    correctAnswer: "¿?"
  },
  {
    id: 6,
    question: "¿Cuál de estas palabras es un adjetivo?",
    options: ["Caminar", "Rápidamente", "Hermoso", "Casa"],
    correctAnswer: "Hermoso"
  },
  {
    id: 7,
    question: "¿Cuál es el antónimo de 'grande'?",
    options: ["Enorme", "Gigante", "Pequeño", "Alto"],
    correctAnswer: "Pequeño"
  },
  {
    id: 8,
    question: "¿Cuál es el plural de 'lápiz'?",
    options: ["lápizes", "lápiz", "lápices", "lapiz"],
    correctAnswer: "lápices"
  },
  {
    id: 9,
    question: "¿Cuál palabra tiene tilde?",
    options: ["Arbol", "Examen", "Corazon", "Cámara"],
    correctAnswer: "Cámara"
  },
  {
    id: 10,
    question: "¿Qué tipo de palabra es 'rápidamente'?",
    options: ["Sustantivo", "Adjetivo", "Adverbio", "Verbo"],
    correctAnswer: "Adverbio"
  }
];

function QuizContainer({ playerName, onGameEnd }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 segundos para el juego
  const [answered, setAnswered] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  
  // Estado para preguntas mezcladas
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  
  useEffect(() => {
    // Mezclar las preguntas al iniciar
    const randomizedQuestions = [...questions].sort(() => Math.random() - 0.5);
    
    // Para cada pregunta, también mezclamos sus opciones
    const questionsWithRandomOptions = randomizedQuestions.map(q => {
      // Guardar la respuesta correcta
      const correctAnswer = q.correctAnswer;
      
      // Mezclar las opciones
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      
      // Devolver la pregunta con opciones mezcladas
      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: correctAnswer
      };
    });
    
    setShuffledQuestions(questionsWithRandomOptions);
  }, []);

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
    // Pasamos tanto el puntaje como la cantidad de respuestas correctas
    onGameEnd(score, correctAnswers, totalAnswered);
  };

  const handleAnswer = (selectedOption) => {
    if (!gameInProgress || answered) return;
    
    setAnswered(true);
    setTotalAnswered(totalAnswered + 1);
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 10); // 10 puntos por respuesta correcta
      setCorrectAnswers(correctAnswers + 1);
      
      // Efecto de sonido o animación para respuesta correcta
      playCorrectSound();
    } else {
      // Efecto de sonido o animación para respuesta incorrecta
      playIncorrectSound();
    }
    
    // Pasar a la siguiente pregunta después de un breve retraso
    setTimeout(() => {
      setAnswered(false);
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Si ya respondimos todas las preguntas, terminamos el juego
        endGame();
      }
    }, 1500); // Aumentamos un poco el tiempo para que se vea la respuesta correcta
  };
  
  const playCorrectSound = () => {
    // Aquí puedes implementar un sonido para respuestas correctas
    console.log("¡Respuesta correcta!");
  };
  
  const playIncorrectSound = () => {
    // Aquí puedes implementar un sonido para respuestas incorrectas
    console.log("Respuesta incorrecta");
  };

  if (shuffledQuestions.length === 0) {
    return <div>Cargando preguntas...</div>;
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="player-info">
          <span>Jugador: {playerName}</span>
          <span>Puntuación: {score}/100</span>
          <span>Pregunta: {currentQuestionIndex + 1}/10</span>
        </div>
        <Timer timeLeft={timeLeft} />
      </div>
      
      {gameInProgress ? (
        <Question 
          question={shuffledQuestions[currentQuestionIndex]} 
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

export default QuizContainer;