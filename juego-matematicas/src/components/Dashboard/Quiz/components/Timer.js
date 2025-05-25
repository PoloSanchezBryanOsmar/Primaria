// components/Dashboard/Quiz/components/Timer.js
import React from 'react';

function Timer({ timeLeft }) {
  // Calcular el porcentaje de tiempo restante para la barra de progreso
  const timePercentage = (timeLeft / 60) * 100;
  
  // Determinar el color de la barra de tiempo
  let timerColor = 'green';
  if (timeLeft < 30) timerColor = 'orange';
  if (timeLeft < 10) timerColor = 'red';

  return (
    <div className="timer-container">
      <div className="timer-text">Tiempo: {timeLeft} segundos</div>
      <div className="timer-bar-container">
        <div 
          className="timer-bar" 
          style={{ 
            width: `${timePercentage}%`, 
            backgroundColor: timerColor 
          }}
        ></div>
      </div>
    </div>
  );
}

export default Timer;