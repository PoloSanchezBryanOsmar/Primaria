// data/quizTemplates.js
export const quizTemplates = {
    español: [
      // Quiz General de Español
      {
        quiz_id: 'esp_general',
        title: 'Quiz General de Español',
        icon: '📚',
        color: '#3498db',
        description: 'Evaluación integral de conocimientos básicos de español: gramática, ortografía y vocabulario.',
        difficulty: 'Básico',
        questions: 10,
        time: 60,
        subject_id: 1,
        subject: 'español',
        topics: ['gramática', 'ortografía', 'vocabulario', 'puntuación'],
        question_distribution: {
          gramática: 3,
          ortografía: 3,
          vocabulario: 2,
          puntuación: 2
        }
      },
      // Quiz de Gramática
      {
        quiz_id: 'esp_gramatica',
        title: 'Quiz de Gramática',
        icon: '📝',
        color: '#2980b9',
        description: 'Evaluación específica de gramática: sustantivos, adjetivos, verbos y adverbios.',
        difficulty: 'Intermedio',
        questions: 12,
        time: 75,
        subject_id: 1,
        subject: 'español',
        topics: ['gramática'],
        subtopics: ['sustantivos', 'adjetivos', 'verbos', 'adverbios'],
        question_distribution: {
          sustantivos: 3,
          adjetivos: 3,
          verbos: 3,
          adverbios: 3
        }
      },
      // Quiz de Ortografía
      {
        quiz_id: 'esp_ortografia',
        title: 'Quiz de Ortografía',
        icon: '✏️',
        color: '#8e44ad',
        description: 'Evaluación de reglas ortográficas: tildes, escritura correcta y uso de letras.',
        difficulty: 'Intermedio',
        questions: 10,
        time: 60,
        subject_id: 1,
        subject: 'español',
        topics: ['ortografía'],
        subtopics: ['tildes', 'escritura'],
        question_distribution: {
          tildes: 6,
          escritura: 4
        }
      },
      // Quiz de Vocabulario
      {
        quiz_id: 'esp_vocabulario',
        title: 'Quiz de Vocabulario',
        icon: '📖',
        color: '#27ae60',
        description: 'Evaluación de vocabulario: sinónimos, antónimos y significados.',
        difficulty: 'Básico',
        questions: 8,
        time: 45,
        subject_id: 1,
        subject: 'español',
        topics: ['vocabulario'],
        subtopics: ['sinónimos', 'antónimos'],
        question_distribution: {
          sinónimos: 4,
          antónimos: 4
        }
      },
      // Quiz de Comprensión Lectora
      {
        quiz_id: 'esp_comprension',
        title: 'Quiz de Comprensión Lectora',
        icon: '🔍',
        color: '#e67e22',
        description: 'Evaluación de comprensión de textos y análisis de contenido.',
        difficulty: 'Intermedio',
        questions: 8,
        time: 90,
        subject_id: 1,
        subject: 'español',
        topics: ['comprensión'],
        subtopics: ['análisis', 'idea principal'],
        question_distribution: {
          análisis: 4,
          'idea principal': 4
        }
      },
      // Quiz de Literatura
      {
        quiz_id: 'esp_literatura',
        title: 'Quiz de Literatura',
        icon: '📚',
        color: '#9b59b6',
        description: 'Evaluación de conocimientos literarios: géneros, características y elementos narrativos.',
        difficulty: 'Avanzado',
        questions: 6,
        time: 60,
        subject_id: 1,
        subject: 'español',
        topics: ['literatura'],
        subtopics: ['géneros'],
        question_distribution: {
          géneros: 6
        }
      }
    ],
    
    matemáticas: [
      // Quiz General de Matemáticas
      {
        quiz_id: 'mat_general',
        title: 'Quiz General de Matemáticas',
        icon: '🔢',
        color: '#e74c3c',
        description: 'Evaluación integral de matemáticas: aritmética, geometría y problemas básicos.',
        difficulty: 'Básico',
        questions: 10,
        time: 60,
        subject_id: 2,
        subject: 'matemáticas',
        topics: ['aritmética', 'geometría', 'problemas'],
        comingSoon: true
      },
      // Quiz de Aritmética
      {
        quiz_id: 'mat_aritmetica',
        title: 'Quiz de Aritmética',
        icon: '➕',
        color: '#c0392b',
        description: 'Evaluación de operaciones básicas: suma, resta, multiplicación y división.',
        difficulty: 'Básico',
        questions: 12,
        time: 45,
        subject_id: 2,
        subject: 'matemáticas',
        topics: ['aritmética'],
        subtopics: ['suma', 'resta', 'multiplicación', 'división'],
        comingSoon: true
      }
    ],
    
    'ciencias naturales': [
      // Quiz General de Ciencias
      {
        quiz_id: 'cien_general',
        title: 'Quiz de Ciencias Naturales',
        icon: '🧪',
        color: '#27ae60',
        description: 'Evaluación de conceptos básicos de biología, física y química adaptados para primaria.',
        difficulty: 'Intermedio',
        questions: 10,
        time: 75,
        subject_id: 3,
        subject: 'ciencias naturales',
        topics: ['biología', 'física', 'química'],
        comingSoon: true
      }
    ],
    
    historia: [
      // Quiz de Historia
      {
        quiz_id: 'hist_general',
        title: 'Quiz de Historia',
        icon: '🏛️',
        color: '#f39c12',
        description: 'Evaluación de conocimientos históricos importantes y fechas relevantes.',
        difficulty: 'Intermedio',
        questions: 15,
        time: 90,
        subject_id: 4,
        subject: 'historia',
        topics: ['historia nacional', 'historia mundial', 'fechas importantes'],
        comingSoon: true
      }
    ],
    
    geografía: [
      // Quiz de Geografía
      {
        quiz_id: 'geo_general',
        title: 'Quiz de Geografía',
        icon: '🌍',
        color: '#16a085',
        description: 'Evaluación de conocimientos geográficos: países, capitales, ríos y montañas.',
        difficulty: 'Intermedio',
        questions: 12,
        time: 60,
        subject_id: 5,
        subject: 'geografía',
        topics: ['países', 'capitales', 'geografía física'],
        comingSoon: true
      }
    ],
    
    'cívica y ética': [
      // Quiz de Cívica y Ética
      {
        quiz_id: 'civ_general',
        title: 'Quiz de Cívica y Ética',
        icon: '🏛️',
        color: '#34495e',
        description: 'Evaluación de valores cívicos, derechos y responsabilidades ciudadanas.',
        difficulty: 'Básico',
        questions: 8,
        time: 45,
        subject_id: 6,
        subject: 'cívica y ética',
        topics: ['valores', 'derechos', 'responsabilidades'],
        comingSoon: true
      }
    ]
  };
  
  // Función para obtener todos los quizzes disponibles
  export const obtenerTodosLosQuizzes = () => {
    const todosLosQuizzes = [];
    
    Object.keys(quizTemplates).forEach(materia => {
      quizTemplates[materia].forEach(quiz => {
        todosLosQuizzes.push({
          ...quiz,
          materia: materia
        });
      });
    });
    
    return todosLosQuizzes;
  };
  
  // Función para obtener quizzes por materia
  export const obtenerQuizzesPorMateria = (materia) => {
    return quizTemplates[materia] || [];
  };
  
  // Función para obtener un quiz específico
  export const obtenerQuizPorId = (quizId) => {
    const todosLosQuizzes = obtenerTodosLosQuizzes();
    return todosLosQuizzes.find(quiz => quiz.quiz_id === quizId);
  };
  
  // Función para obtener quizzes por grado
  export const obtenerQuizzesPorGrado = () => {
    // Ahora todos los quizzes funcionan para cualquier grado
    return obtenerTodosLosQuizzes();
  };
  
  // Función para obtener materias disponibles
  export const obtenerMateriasDisponibles = () => {
    return Object.keys(quizTemplates);
  };
  
  export default quizTemplates;