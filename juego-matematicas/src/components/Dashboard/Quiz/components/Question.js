// components/Dashboard/Quiz/components/Question.js
import React from 'react';

function Question({ question, onAnswer, answered }) {
  return (
    <div className="question-container">
      <h3>{question.question}</h3>
      <div className="options-container">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !answered && onAnswer(option)}
            className={`option-button ${answered ? (option === question.correctAnswer ? 'correct' : 'incorrect') : ''}`}
            disabled={answered}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Question;