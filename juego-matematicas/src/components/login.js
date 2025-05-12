import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

function Login({ setCurrentUser, setIsAuthenticated }) {
  const [userType, setUserType] = useState('estudiante');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Añadir clase al body solo cuando el componente está montado
  useEffect(() => {
    // Añadir clase de login al body
    document.body.classList.add('login-page');
    
    // Cleanup function - remover la clase cuando el componente se desmonte
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar información del usuario y token
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirigir según el tipo de usuario
        if (data.user.role === 'estudiante') {
          navigate('/estudiante');
        } else if (data.user.role === 'docente') {
          navigate('/docente');
        } else if (data.user.role === 'admin') {
          navigate('/admin');
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      console.error('Error:', error);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
  };

  return (
    <div className="login-container">
      <h1>Sistema Académico</h1>
      <div className="login-card">
        <h2>Iniciar Sesión</h2>

        <div className="filter-switch">
          <input
            type="radio"
            id="option1"
            name="user-type"
            value="estudiante"
            checked={userType === 'estudiante'}
            onChange={() => handleUserTypeChange('estudiante')}
          />
          <label htmlFor="option1">Estudiante</label>

          <input
            type="radio"
            id="option2"
            name="user-type"
            value="docente"
            checked={userType === 'docente'}
            onChange={() => handleUserTypeChange('docente')}
          />
          <label htmlFor="option2">Docente</label>

          <input
            type="radio"
            id="option3"
            name="user-type"
            value="admin"
            checked={userType === 'admin'}
            onChange={() => handleUserTypeChange('admin')}
          />
          <label htmlFor="option3">Admin</label>

          <div className="background"></div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Usuario:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
              placeholder="Ingrese su usuario"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">Ingresar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;