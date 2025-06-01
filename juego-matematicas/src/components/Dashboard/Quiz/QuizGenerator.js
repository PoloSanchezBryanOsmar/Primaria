// components/Dashboard/Quiz/QuizGenerator.js
import { 
    obtenerPreguntasPorTema, 
    obtenerPreguntasMixtas, 
    contarPreguntasPorTema 
  } from '../../../data/questions/espanol';
  import { obtenerQuizPorId } from '../../../data/quizTemplates';
  
  export class QuizGenerator {
    
    // Generar quiz basado en una plantilla específica
    static generateQuizFromTemplate(quizId) {
      const template = obtenerQuizPorId(quizId);
      
      if (!template) {
        throw new Error(`Template de quiz no encontrado: ${quizId}`);
      }
  
      // Solo español está implementado por ahora
      if (template.subject !== 'español') {
        throw new Error(`Materia no implementada: ${template.subject}`);
      }
  
      return this.generateSpanishQuiz(template);
    }
  
    // Generar quiz de español basado en template
    static generateSpanishQuiz(template) {
      let questions = [];
  
      try {
        if (template.question_distribution) {
          // Quiz con distribución específica de temas
          questions = this.generateByDistribution(template);
        } else if (template.topics && template.topics.length > 0) {
          // Quiz por temas generales
          questions = obtenerPreguntasMixtas(template.topics, template.questions);
        } else {
          // Quiz general - obtener preguntas aleatorias
          questions = obtenerPreguntasMixtas(['gramática', 'ortografía', 'vocabulario'], template.questions);
        }
  
        // Verificar que tenemos suficientes preguntas
        if (questions.length < template.questions) {
          console.warn(`No hay suficientes preguntas para el quiz ${template.title}. Obtenidas: ${questions.length}, Requeridas: ${template.questions}`);
          
          // Completar con preguntas aleatorias si es necesario
          const preguntasAdicionales = obtenerPreguntasMixtas(
            ['gramática', 'ortografía', 'vocabulario', 'puntuación'], 
            template.questions - questions.length
          );
          
          questions = [...questions, ...preguntasAdicionales].slice(0, template.questions);
        }
  
        // Mezclar las preguntas finales
        questions = questions.sort(() => Math.random() - 0.5);
  
        return {
          quizInfo: template,
          questions: questions.slice(0, template.questions)
        };
  
      } catch (error) {
        console.error('Error generando quiz de español:', error);
        throw new Error('Error al generar el quiz');
      }
    }
  
    // Generar preguntas basado en distribución específica
    static generateByDistribution(template) {
      let allQuestions = [];
  
      try {
        Object.entries(template.question_distribution).forEach(([tema, cantidad]) => {
          let preguntasDelTema = [];
  
          // Si el template tiene subtopics, usar esos
          if (template.subtopics && template.subtopics.includes(tema)) {
            // Es un subtopic, buscar por subtopic
            const topicPrincipal = this.findMainTopic(tema, template);
            preguntasDelTema = obtenerPreguntasPorTema(topicPrincipal, tema, cantidad);
          } else {
            // Es un topic principal
            preguntasDelTema = obtenerPreguntasPorTema(tema, null, cantidad);
          }
  
          allQuestions = [...allQuestions, ...preguntasDelTema];
        });
  
        return allQuestions;
  
      } catch (error) {
        console.error('Error en distribución de preguntas:', error);
        // Fallback: usar temas principales
        return obtenerPreguntasMixtas(template.topics, template.questions);
      }
    }
  
    // Encontrar el topic principal para un subtopic
    static findMainTopic(subtopic, template) {
      // Mapeo de subtopics a topics principales para español
      const subtopicToTopic = {
        'sustantivos': 'gramática',
        'adjetivos': 'gramática',
        'verbos': 'gramática',
        'adverbios': 'gramática',
        'tildes': 'ortografía',
        'escritura': 'ortografía',
        'sinónimos': 'vocabulario',
        'antónimos': 'vocabulario',
        'signos': 'puntuación',
        'análisis': 'comprensión',
        'idea principal': 'comprensión',
        'géneros': 'literatura',
        'narrativa': 'escritura',
        'descripción': 'escritura',
        'expresión oral': 'comunicación'
      };
  
      return subtopicToTopic[subtopic] || template.topics[0] || 'gramática';
    }
  
    // Generar quiz personalizado
    static generateCustomQuiz(config) {
      const {
        subject = 'español',
        topics = ['gramática'],
        subtopics = null,
        questionCount = 10,
        timeLimit = 60,
        difficulty = 'básico'
      } = config;
  
      if (subject !== 'español') {
        throw new Error(`Materia no implementada: ${subject}`);
      }
  
      let questions = [];
  
      if (subtopics && subtopics.length > 0) {
        // Distribuir preguntas entre subtopics
        const questionsPerSubtopic = Math.ceil(questionCount / subtopics.length);
        
        subtopics.forEach(subtopic => {
          const topicPrincipal = this.findMainTopic(subtopic, { topics });
          const preguntasSubtopic = obtenerPreguntasPorTema(topicPrincipal, subtopic, questionsPerSubtopic);
          questions = [...questions, ...preguntasSubtopic];
        });
      } else {
        // Usar topics principales
        questions = obtenerPreguntasMixtas(topics, questionCount);
      }
  
      // Filtrar por dificultad si se especifica
      if (difficulty !== 'básico') {
        questions = questions.filter(q => q.difficulty === difficulty);
      }
  
      // Tomar solo la cantidad solicitada
      questions = questions.slice(0, questionCount);
  
      return {
        quizInfo: {
          title: `Quiz Personalizado de ${subject}`,
          subject,
          topics,
          subtopics,
          questions: questionCount,
          time: timeLimit,
          difficulty,
          description: `Quiz personalizado con ${questionCount} preguntas sobre ${topics.join(', ')}`
        },
        questions: questions.sort(() => Math.random() - 0.5)
      };
    }
  
    // Validar que un quiz puede ser generado
    static validateQuizGeneration(quizId) {
      try {
        const template = obtenerQuizPorId(quizId);
        
        if (!template) {
          return { valid: false, error: 'Template no encontrado' };
        }
  
        if (template.comingSoon) {
          return { valid: false, error: 'Quiz no disponible aún' };
        }
  
        if (template.subject !== 'español') {
          return { valid: false, error: 'Materia no implementada' };
        }
  
        return { valid: true };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    }
  
    // Obtener información de preview del quiz
    static getQuizPreview(quizId) {
      const template = obtenerQuizPorId(quizId);
      
      if (!template) {
        throw new Error(`Template no encontrado: ${quizId}`);
      }
  
      // Generar una muestra de preguntas (3 preguntas)
      let sampleQuestions = [];
      
      try {
        if (template.subject === 'español') {
          sampleQuestions = obtenerPreguntasMixtas(template.topics || ['gramática'], 3);
        }
      } catch (error) {
        console.warn('Error obteniendo preguntas de muestra:', error);
      }
  
      return {
        quizInfo: template,
        sampleQuestions,
        totalAvailableQuestions: this.countAvailableQuestions(template),
        estimatedDifficulty: this.calculateEstimatedDifficulty(template)
      };
    }
  
    // Contar preguntas disponibles para un template
    static countAvailableQuestions(template) {
      if (template.subject !== 'español') {
        return 0;
      }
  
      try {
        if (template.topics) {
          const preguntas = obtenerPreguntasMixtas(template.topics, 1000);
          return preguntas.length;
        }
        return 0;
      } catch (error) {
        return 0;
      }
    }
  
    // Calcular dificultad estimada basada en los topics
    static calculateEstimatedDifficulty(template) {
      const difficultyMap = {
        'vocabulario': 1,
        'puntuación': 1,
        'gramática': 2,
        'ortografía': 2,
        'comprensión': 3,
        'literatura': 3,
        'escritura': 3,
        'comunicación': 3
      };
  
      if (!template.topics) return 'básico';
  
      const avgDifficulty = template.topics.reduce((sum, topic) => {
        return sum + (difficultyMap[topic] || 1);
      }, 0) / template.topics.length;
  
      if (avgDifficulty <= 1.5) return 'básico';
      if (avgDifficulty <= 2.5) return 'intermedio';
      return 'avanzado';
    }
  
    // Obtener estadísticas de preguntas disponibles
    static getQuestionStats() {
      try {
        const conteo = contarPreguntasPorTema();
        const total = Object.values(conteo).reduce((sum, count) => sum + count, 0);
        
        return {
          total,
          byTopic: conteo,
          topicsAvailable: Object.keys(conteo)
        };
      } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
          total: 0,
          byTopic: {},
          topicsAvailable: []
        };
      }
    }
  
    // Verificar disponibilidad de preguntas para un template
    static checkQuestionAvailability(template) {
      if (template.subject !== 'español') {
        return {
          available: false,
          reason: 'Materia no implementada',
          missing: []
        };
      }
  
      const stats = this.getQuestionStats();
      const missing = [];
      let totalNeeded = 0;
      let totalAvailable = 0;
  
      if (template.question_distribution) {
        // Verificar distribución específica
        Object.entries(template.question_distribution).forEach(([tema, cantidad]) => {
          totalNeeded += cantidad;
          
          if (template.subtopics && template.subtopics.includes(tema)) {
            // Es un subtopic
            const topicPrincipal = this.findMainTopic(tema, template);
            const available = obtenerPreguntasPorTema(topicPrincipal, tema, 1000).length;
            totalAvailable += available;
            
            if (available < cantidad) {
              missing.push({
                topic: topicPrincipal,
                subtopic: tema,
                needed: cantidad,
                available
              });
            }
          } else {
            // Es un topic principal
            const available = stats.byTopic[tema] || 0;
            totalAvailable += available;
            
            if (available < cantidad) {
              missing.push({
                topic: tema,
                needed: cantidad,
                available
              });
            }
          }
        });
      } else {
        // Verificar temas generales
        template.topics.forEach(tema => {
          const available = stats.byTopic[tema] || 0;
          totalAvailable += available;
        });
        totalNeeded = template.questions;
      }
  
      return {
        available: missing.length === 0 && totalAvailable >= totalNeeded,
        reason: missing.length > 0 ? 'Preguntas insuficientes en algunos temas' : 'OK',
        missing,
        totalNeeded,
        totalAvailable
      };
    }
  
    // Generar reporte de quiz
    static generateQuizReport(quizId) {
      try {
        const template = obtenerQuizPorId(quizId);
        if (!template) {
          throw new Error('Template no encontrado');
        }
  
        const availability = this.checkQuestionAvailability(template);
        const stats = this.getQuestionStats();
        const preview = this.getQuizPreview(quizId);
  
        return {
          template,
          availability,
          stats,
          preview,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Error generando reporte: ${error.message}`);
      }
    }
  }