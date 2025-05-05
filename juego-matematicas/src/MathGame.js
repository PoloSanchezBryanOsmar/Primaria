import React from 'react';
import './MathGame.css';


const PrimarySchoolSubjects = () => {
  return (
    <div className="code-org-homepage">
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-left">
          <span className="logo">ESCUELA</span>
          <div className="nav-links">
            <a href="#">Inicio</a>
            <a href="#">Materias</a>
            <a href="#">Recursos</a>
            <a href="#">Actividades</a>
            <a href="#">Estudiantes</a>
            <a href="#">Padres</a>
          </div>
        </div>
        <div className="nav-right">
          <button className="btn btn-primary">Nuevo Proyecto</button>
          <button className="btn btn-secondary">Iniciar sesión</button>
          <button className="btn btn-secondary">Registrarse</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <p className="hero-subtitle">APRENDE Y DESCUBRE</p>
          <h1 className="hero-title">Materias Fundamentales para Primaria</h1>
          <p className="hero-description">Explorando el conocimiento, inspirando el aprendizaje y desarrollando habilidades para el futuro.</p>
          <p className="hero-collab">En colaboración con <span className="amazon-text">Educación</span></p>
          <button className="btn btn-explore">Explorar Materias</button>
        </div>
        <div className="hero-graphic">
          <div className="ai-box">
            <div className="ai-content">
              <div className="ai-icon">📚</div>
              <div className="ai-text">Aprender</div>
            </div>
            <div className="user-icon">👧</div>
            <div className="chat-icon">🌟</div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid-section">
        {/* Matemáticas */}
        <div className="grid-item teal">
          <div className="grid-image-container">
            <img 
              src="https://itahora.com/wp-content/uploads/2023/03/pi.jpg" 
              alt="Matemáticas" 
              className="grid-image"
            />
          </div>
          <h2>Matemáticas</h2>
          <p>Números, lógica y resolución de problemas</p>
          <div className="grid-buttons">
            <button>Números básicos</button>
            <button>Geometría</button>
            <button>Problemas matemáticos</button>
          </div>
        </div>

        {/* Lenguaje y Literatura */}
        <div className="grid-item purple">
          <div className="grid-image-container">
            <img 
              src="https://www.shutterstock.com/image-vector/concept-linguistics-man-woman-stand-600nw-2227748159.jpg" 
              alt="Lenguaje" 
              className="grid-image"
            />
          </div>
          <h2>Lenguaje y Literatura</h2>
          <p>Lectura, escritura y comunicación</p>
          <div className="grid-buttons">
            <button>Comprensión lectora</button>
            <button>Escritura creativa</button>
            <button>Gramática básica</button>
          </div>
        </div>

        {/* Ciencias */}
        <div className="grid-item blue">
          <div className="grid-image-container">
            <img 
              src="https://www.magisnet.com/wp-content/uploads/2020/01/ensen%CC%83ar-ciencias.jpg" 
              alt="Ciencias" 
              className="grid-image"
            />
          </div>
          <h2>Ciencias</h2>
          <p>Descubriendo el mundo natural</p>
          <div className="grid-buttons">
            <button>Biología básica</button>
            <button>Experimentos simples</button>
            <button>Naturaleza</button>
          </div>
        </div>

        {/* Estudios Sociales */}
        <div className="grid-item green">
          <div className="grid-image-container">
            <img 
              src="https://img.freepik.com/foto-gratis/grupo-ninos-estudios-sociales_23-2148258710.jpg" 
              alt="Estudios Sociales" 
              className="grid-image"
            />
          </div>
          <h2>Estudios Sociales</h2>
          <p>Comprendiendo nuestro mundo</p>
          <div className="grid-buttons">
            <button>Historia</button>
            <button>Geografía</button>
            <button>Cultura</button>
          </div>
        </div>

        {/* Geografia */}
        <div className="grid-item blue">
          <div className="grid-image-container">
            <img 
              src="https://img.freepik.com/foto-gratis/mano-nina-senalando-globo-terraqueo_23-2148947336.jpg" 
              alt="Geografia" 
              className="grid-image"
            />
          </div>
          <h2>Geografía</h2>
          <p>Explorando nuestro planeta</p>
          <div className="grid-buttons">
            <button>Continentes</button>
            <button>Mapas y Ubicaciones</button>
            <button>Culturas del Mundo</button>
          </div>
        </div>

        {/* Historia */}
        <div className="grid-item purple">
          <div className="grid-image-container">
            <img 
              src="https://img.freepik.com/foto-gratis/ninos-vestidos-trajes-historicos_23-2148258755.jpg" 
              alt="Historia" 
              className="grid-image"
            />
          </div>
          <h2>Historia</h2>
          <p>Viajando a través del tiempo</p>
          <div className="grid-buttons">
            <button>Civilizaciones Antiguas</button>
            <button>Líneas del Tiempo</button>
            <button>Personajes Históricos</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimarySchoolSubjects;