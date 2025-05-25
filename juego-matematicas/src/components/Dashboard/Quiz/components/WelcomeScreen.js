// components/Dashboard/Quiz/components/WelcomeScreen.js
import React, { useState } from 'react';

function WelcomeScreen({ onStart }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name);
    }
  };

  return (
    <div className="welcome-screen">
      <h2>¡Bienvenido al Quiz de Español!</h2>
      <p>Este es un juego divertido para practicar conocimientos de español.</p>
      <p>Tienes 60 segundos para responder todas las preguntas que puedas.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="playerName">Tu nombre:</label>
          <input
            type="text"
            id="playerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-start">¡Comenzar!</button>
      </form>
    </div>
  );
}

export default WelcomeScreen;